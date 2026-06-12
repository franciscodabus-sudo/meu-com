import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { publicar } from '@/lib/ayrshare';

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

    const result = await publicar({
      caption: `${post.caption}\n\n${post.hashtags ?? ''}`.trim(),
      platforms: [post.channel],
      mediaUrls: post.mediaUrl ? [post.mediaUrl] : undefined,
      scheduleDate: agora ? undefined : scheduleDate
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
