import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { lerRadar, isTituloLixo } from '@/lib/rss';

export const maxDuration = 60;

// GET /api/radar?profileId=xxx — coleta, salva novos, devolve os não-deletados mais recentes
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const profileId = searchParams.get('profileId') ?? undefined;

  const itens = await lerRadar(profileId);
  const validos = itens.filter(i => !isTituloLixo(i.title));

  if (validos.length > 0) {
    // Busca todos os títulos existentes de uma vez (evita N+1 queries)
    const existentes = await db.radarItem.findMany({
      where: {
        title: { in: validos.map(i => i.title) },
        ...(profileId ? { profileId } : {}),
      },
      select: { title: true },
    });
    const titulosExistentes = new Set(existentes.map(e => e.title));
    const novos = validos.filter(i => !titulosExistentes.has(i.title));
    if (novos.length > 0) {
      await db.radarItem.createMany({
        data: novos.map(i => ({ kind: 'noticia' as const, ...i, profileId: profileId ?? null })),
      });
    }
  }

  const recentes = await db.radarItem.findMany({
    where: { deletedAt: null, ...(profileId ? { profileId } : {}) },
    orderBy: { createdAt: 'desc' },
    take: 30,
  });
  return NextResponse.json(recentes);
}

// DELETE /api/radar  { id } — marca item como deletado (nunca volta)
export async function DELETE(req: Request) {
  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: 'id obrigatório' }, { status: 400 });
  await db.radarItem.update({ where: { id }, data: { deletedAt: new Date() } });
  return NextResponse.json({ ok: true });
}
