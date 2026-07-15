import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { gerarPostsDoBrief, type GeneratedPost } from '@/lib/claude';
import { buscarFotoPexels } from '@/lib/pexels';
import { buscarCanaisAtivos } from '@/lib/ayrshare';
import { comporImagemPost } from '@/lib/composicao-imagem';

export const maxDuration = 60;

// ── Validação de lista numerada ────────────────────────────────────────────────
// Conta itens numerados no caption (emoji keycap ou dígito+ponto/paren por linha).
function contarItensNumerados(caption: string): number {
  const keycaps = ['1️⃣','2️⃣','3️⃣','4️⃣','5️⃣','6️⃣','7️⃣','8️⃣','9️⃣'];
  const emojiCount = keycaps.reduce((acc, k) => acc + (caption.includes(k) ? 1 : 0), 0);
  if (emojiCount > 0) return emojiCount;
  return (caption.match(/^\s*[1-9][.)]\s/gm) ?? []).length;
}

// Se o título promete N itens mas a caption entrega menos, corrige o número no título.
// Protege contra truncamento do modelo sem causar falha da geração.
function validarNumerados(post: GeneratedPost): GeneratedPost {
  const m = post.title.match(/\b([2-9]|1[0-2])\b/);
  if (!m) return post;
  const prometido = parseInt(m[1]);
  const entregues = contarItensNumerados(post.caption);
  if (entregues > 0 && entregues < prometido) {
    console.warn(`[post-validate] "${post.title}" prometeu ${prometido} itens, entregou ${entregues}`);
    return { ...post, title: post.title.replace(m[0], String(entregues)) };
  }
  return post;
}

// POST /api/generate  { brief: string, campaignName?: string, canal?: string }
export async function POST(req: Request) {
  try {
    const { brief, campaignName, canal: canalOverride, formato: formatoOverride } = await req.json();
    if (!brief) return NextResponse.json({ error: 'brief obrigatório' }, { status: 400 });

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { error: 'ANTHROPIC_API_KEY não configurada. Abra o arquivo .env e cole sua chave de console.anthropic.com' },
        { status: 500 }
      );
    }

    // ── Validação de canal ──────────────────────────────────────────────────────
    const canaisAtivos = await buscarCanaisAtivos();
    if (canaisAtivos !== null && canaisAtivos.length === 0) {
      return NextResponse.json(
        { error: 'Nenhum canal ativo — conecte uma conta em Canais antes de gerar posts.' },
        { status: 400 }
      );
    }
    if (canalOverride && canaisAtivos !== null && !canaisAtivos.includes(canalOverride)) {
      return NextResponse.json(
        { error: `Canal "${canalOverride}" não está conectado. Reconecte-o em Canais.` },
        { status: 400 }
      );
    }
    const canaisParaIA: string[] | undefined = canalOverride
      ? [canalOverride]
      : (canaisAtivos ?? undefined);

    // Busca perfil ativo para associar ao post
    const perfilAtivo = await db.brandProfile.findFirst({ where: { ativo: true } });

    const rawPosts = await gerarPostsDoBrief(
      brief, 3,
      perfilAtivo as Parameters<typeof gerarPostsDoBrief>[2],
      canaisParaIA
    );
    // Valida listas numeradas — corrige título se resposta da IA foi truncada
    const posts = rawPosts.map(validarNumerados);

    // Busca fotos no Pexels em paralelo; retorna null se não houver chave ou resultado
    const photos = await Promise.all(posts.map(p => buscarFotoPexels(p.imageQuery ?? '')));

    const campaign = await db.campaign.create({
      data: { name: campaignName ?? brief.slice(0, 40), brief }
    });

    const VALID_CHANNELS = ['instagram', 'facebook', 'linkedin', 'tiktok'];
    const VALID_STAGES = ['atrair', 'educar', 'conectar', 'converter'];

    // Cria individualmente para obter IDs e rodar composição de imagem
    const criados = await Promise.all(posts.map((p, i) => {
      const aiChannel = VALID_CHANNELS.find(c => (p.channel ?? '').toLowerCase().includes(c));
      const channel = canalOverride && VALID_CHANNELS.includes(canalOverride)
        ? canalOverride
        : (aiChannel && canaisAtivos?.includes(aiChannel) ? aiChannel : (canaisAtivos?.[0] ?? aiChannel ?? 'instagram'));
      const stage = VALID_STAGES.find(s => (p.stage ?? '').toLowerCase().includes(s)) ?? 'atrair';
      const hashtags = Array.isArray(p.hashtags) ? p.hashtags.join(' ') : p.hashtags;
      return db.post.create({
        data: {
          campaignId: campaign.id,
          profileId:  perfilAtivo?.id ?? null,
          channel, format: formatoOverride ?? p.format, stage,
          title: p.title, caption: p.caption, hashtags,
          whyNow: p.whyNow, mediaUrl: photos[i] ?? null, status: 'pending'
        }
      });
    }));

    // Composição de imagem — fire-and-forget para não bloquear a resposta
    void Promise.all(criados.map(async (post) => {
      if (!post.mediaUrl) return;
      const composedUrl = await comporImagemPost({
        postId:   post.id,
        mediaUrl: post.mediaUrl,
        titulo:   post.title,
        canal:    post.channel,
        stage:    post.stage ?? 'atrair',
      });
      if (composedUrl) {
        await db.post.update({ where: { id: post.id }, data: { mediaUrl: composedUrl } });
      }
    })).catch(() => {});

    return NextResponse.json({ campaignId: campaign.id, criados: posts.length });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro desconhecido ao gerar posts';
    console.error('[/api/generate]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
