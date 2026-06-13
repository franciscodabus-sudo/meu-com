import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { lerRadar, isTituloLixo } from '@/lib/rss';

// GET /api/radar — coleta, salva novos, devolve os não-deletados mais recentes
export async function GET() {
  const itens = await lerRadar();
  for (const i of itens) {
    if (isTituloLixo(i.title)) continue;
    // Ignora se já existe (mesmo deletado — não volta)
    const existe = await db.radarItem.findFirst({ where: { title: i.title } });
    if (!existe) {
      await db.radarItem.create({ data: { kind: 'noticia', ...i } });
    }
  }
  const recentes = await db.radarItem.findMany({
    where: { deletedAt: null },
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
