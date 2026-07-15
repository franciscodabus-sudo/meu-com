import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { publicar, buscarCanais } from '@/lib/ayrshare';

const CANAL_LABEL: Record<string, string> = {
  instagram: 'Instagram', facebook: 'Facebook',
  linkedin: 'LinkedIn', tiktok: 'TikTok',
};

// POST /api/publish  { postId, agora?: boolean, scheduleDate?: string }
export async function POST(req: Request) {
  try {
    if (!process.env.AYRSHARE_API_KEY) {
      return NextResponse.json(
        { error: 'AYRSHARE_API_KEY não configurada. Adicione sua chave do Ayrshare no arquivo .env' },
        { status: 500 }
      );
    }

    const { postId, agora, scheduleDate } = await req.json();
    const post = await db.post.findUnique({ where: { id: postId } });
    if (!post) return NextResponse.json({ error: 'post não encontrado' }, { status: 404 });
    if (!['approved', 'scheduled'].includes(post.status)) {
      return NextResponse.json({ error: 'O post precisa ser aprovado antes de ser publicado.' }, { status: 403 });
    }

    // Verifica se o canal está realmente conectado antes de tentar publicar
    try {
      const canais = await buscarCanais();
      const conectado = canais.some(c => c.platform === post.channel && c.status === 'connected');
      if (!conectado) {
        const nome = CANAL_LABEL[post.channel] ?? post.channel;
        return NextResponse.json({
          error: `A conta do ${nome} não está conectada. Acesse a tela de Canais, conecte a conta e tente novamente.`,
        }, { status: 422 });
      }
    } catch { /* Se a verificação falhar, tentamos publicar assim mesmo */ }

    // URL composta é relativa (/uploads/...) — Ayrshare precisa de URL absoluta
    let mediaUrlFinal = post.mediaUrl;
    if (post.mediaUrl?.startsWith('/uploads/')) {
      const base = process.env.NEXTAUTH_URL
        ?? (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');
      mediaUrlFinal = `${base}${post.mediaUrl}`;
    }

    const result = await publicar({
      caption: `${post.caption}\n\n${post.hashtags ?? ''}`.trim(),
      platforms: [post.channel],
      mediaUrls: mediaUrlFinal ? [mediaUrlFinal] : undefined,
      scheduleDate: agora ? undefined : scheduleDate,
      mediaFeedType: post.format === 'story' ? 'story' : undefined,
    });

    await db.post.update({
      where: { id: postId },
      data: {
        status: agora ? 'published' : 'scheduled',
        publishedAt: agora ? new Date() : null,
        scheduledAt: scheduleDate ? new Date(scheduleDate) : null,
        ayrshareId: result.id ?? null
      }
    });

    return NextResponse.json({ ok: true, ayrshare: result });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro desconhecido ao publicar';
    console.error('[/api/publish]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
