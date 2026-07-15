import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { gerarPostDoRadar } from '@/lib/claude';
import { buscarFotoPexels } from '@/lib/pexels';
import { buscarCanaisAtivos } from '@/lib/ayrshare';

export const maxDuration = 60;

// POST /api/radar/gerar  { radarItemId, profileId?, canal? }
export async function POST(req: Request) {
  try {
    const { radarItemId, profileId, canal: canalSolicitado } = await req.json();
    if (!radarItemId) return NextResponse.json({ error: 'radarItemId obrigatório' }, { status: 400 });

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json({ error: 'ANTHROPIC_API_KEY não configurada' }, { status: 500 });
    }

    // ── Validação de canal ──────────────────────────────────────────────────────
    const canaisAtivos = await buscarCanaisAtivos();
    if (canaisAtivos !== null && canaisAtivos.length === 0) {
      return NextResponse.json(
        { error: 'Nenhum canal ativo — conecte uma conta em Canais antes de gerar posts.' },
        { status: 400 }
      );
    }
    if (canalSolicitado && canaisAtivos !== null && !canaisAtivos.includes(canalSolicitado)) {
      return NextResponse.json(
        { error: `Canal "${canalSolicitado}" não está conectado. Reconecte-o em Canais.` },
        { status: 400 }
      );
    }
    // Lista final: canal específico escolhido ou todos os ativos
    const canaisParaIA: string[] | undefined = canalSolicitado
      ? [canalSolicitado]
      : (canaisAtivos ?? undefined);

    const item = await db.radarItem.findUnique({ where: { id: radarItemId } });
    if (!item) return NextResponse.json({ error: 'item não encontrado' }, { status: 404 });

    // Use provided profileId or fall back to the item's own profileId or the active profile
    let perfilId: string | null = profileId ?? item.profileId ?? null;
    let perfil = perfilId ? await db.brandProfile.findUnique({ where: { id: perfilId } }) : null;
    if (!perfil) {
      perfil = await db.brandProfile.findFirst({ where: { ativo: true } });
      perfilId = perfil?.id ?? null;
    }

    const post = await gerarPostDoRadar(item, perfil ?? undefined, canaisParaIA);
    const mediaUrl = await buscarFotoPexels(post.imageQuery ?? '');

    const VALID_CHANNELS = ['instagram', 'facebook', 'linkedin', 'tiktok'];
    const VALID_STAGES   = ['atrair', 'educar', 'conectar', 'converter'];
    // Usa o canal retornado pela IA; se não estiver na lista de ativos, usa o primeiro ativo
    const aiChannel = VALID_CHANNELS.find(c => (post.channel ?? '').toLowerCase().includes(c));
    const channel = canalSolicitado
      ? canalSolicitado
      : (aiChannel && canaisAtivos?.includes(aiChannel) ? aiChannel : (canaisAtivos?.[0] ?? aiChannel ?? 'instagram'));
    const stage    = VALID_STAGES.find(s => (post.stage ?? '').toLowerCase().includes(s)) ?? 'atrair';
    const hashtags = Array.isArray(post.hashtags) ? post.hashtags.join(' ') : post.hashtags;

    const campaign = await db.campaign.create({
      data: { name: `Radar: ${item.title.slice(0, 40)}`, brief: `Gerado do radar: ${item.title}` }
    });

    const created = await db.post.create({
      data: {
        campaignId: campaign.id,
        profileId: perfilId,
        channel, format: post.format, stage,
        title: post.title, caption: post.caption, hashtags,
        whyNow: post.whyNow, mediaUrl, status: 'pending'
      }
    });

    await db.radarItem.update({ where: { id: radarItemId }, data: { usedAt: new Date() } });

    return NextResponse.json({ ok: true, postId: created.id });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro desconhecido';
    console.error('[/api/radar/gerar]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
