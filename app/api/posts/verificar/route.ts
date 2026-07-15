import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verificarStatusPost } from '@/lib/ayrshare';

// POST /api/posts/verificar
// Verifica todos os posts publicados contra o Ayrshare.
// Posts não encontrados são marcados como 'deleted_externally'.
export async function POST() {
  if (!process.env.AYRSHARE_API_KEY) {
    return NextResponse.json({ error: 'Chave de publicação não configurada' }, { status: 400 });
  }

  const posts = await db.post.findMany({
    where: { status: 'published', ayrshareId: { not: null } },
    select: { id: true, ayrshareId: true, title: true },
  });

  if (posts.length === 0) {
    return NextResponse.json({ verificados: 0, fantasmas: 0, atualizados: [] });
  }

  const resultados = await Promise.all(
    posts.map(async p => {
      const status = await verificarStatusPost(p.ayrshareId!);
      return { id: p.id, title: p.title, status };
    })
  );

  const deletados = resultados.filter(r => r.status === 'deletado');

  if (deletados.length > 0) {
    await Promise.all(
      deletados.map(r =>
        db.post.update({ where: { id: r.id }, data: { status: 'deleted_externally' } })
      )
    );
  }

  return NextResponse.json({
    verificados: posts.length,
    fantasmas: deletados.length,
    atualizados: deletados.map(r => r.title),
  });
}
