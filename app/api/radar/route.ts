import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { lerRadar, isTituloLixo } from '@/lib/rss';

// GET /api/radar?profileId=xxx — coleta, salva novos, devolve os não-deletados mais recentes
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const profileId = searchParams.get('profileId') ?? undefined;

  const itens = await lerRadar(profileId);
  for (const i of itens) {
    if (isTituloLixo(i.title)) continue;
    const where = profileId
      ? { title: i.title, profileId }
      : { title: i.title };
    const existe = await db.radarItem.findFirst({ where });
    if (!existe) {
      await db.radarItem.create({
        data: { kind: 'noticia', ...i, profileId: profileId ?? null },
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
