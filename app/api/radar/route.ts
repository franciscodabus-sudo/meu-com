import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { lerRadar } from '@/lib/rss';

// GET /api/radar  -> busca feeds, grava itens novos, devolve os 10 mais recentes
export async function GET() {
  const itens = await lerRadar();
  for (const i of itens) {
    const existe = await db.radarItem.findFirst({ where: { title: i.title } });
    if (!existe) await db.radarItem.create({ data: { kind: 'noticia', ...i } });
  }
  const recentes = await db.radarItem.findMany({ orderBy: { createdAt: 'desc' }, take: 10 });
  return NextResponse.json(recentes);
}
