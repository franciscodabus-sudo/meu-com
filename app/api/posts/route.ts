import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { deletarPublicacao } from '@/lib/ayrshare';

// GET /api/posts?status=pending  (suporta vírgula: ?status=published,scheduled)
export async function GET(req: Request) {
  const statusParam = new URL(req.url).searchParams.get('status') ?? 'pending';
  const statuses = statusParam.split(',').filter(Boolean);
  const posts = await db.post.findMany({
    where: { status: statuses.length === 1 ? statuses[0] : { in: statuses } },
    orderBy: { createdAt: 'desc' }
  });
  return NextResponse.json(posts);
}

// PATCH /api/posts  { id, action: 'approve' | 'skip' | 'caption', caption? }
export async function PATCH(req: Request) {
  const { id, action, caption } = await req.json();
  if (action === 'caption') {
    const post = await db.post.update({ where: { id }, data: { caption } });
    return NextResponse.json(post);
  }
  const status = action === 'approve' ? 'approved' : 'skipped';
  const post = await db.post.update({ where: { id }, data: { status } });
  return NextResponse.json(post);
}

// DELETE /api/posts  { id }
export async function DELETE(req: Request) {
  try {
    const { id } = await req.json();
    const post = await db.post.findUnique({ where: { id } });
    if (!post) return NextResponse.json({ error: 'post não encontrado' }, { status: 404 });

    // Tenta remover do Ayrshare se tiver ID
    if (post.ayrshareId && process.env.AYRSHARE_API_KEY) {
      try { await deletarPublicacao(post.ayrshareId); } catch { /* segue mesmo se falhar */ }
    }

    await db.post.update({ where: { id }, data: { status: 'deleted' } });
    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erro';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
