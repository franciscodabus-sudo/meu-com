import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

const CANAIS_PADRAO = ['instagram', 'facebook', 'linkedin', 'tiktok'];

async function garantirCanais() {
  for (const name of CANAIS_PADRAO) {
    await db.channel.upsert({
      where: { name },
      create: { name, active: name !== 'tiktok' }, // tiktok começa desativado
      update: {}
    });
  }
}

export async function GET() {
  await garantirCanais();
  const canais = await db.channel.findMany({ orderBy: { name: 'asc' } });
  return NextResponse.json(canais);
}

export async function PATCH(req: Request) {
  const { id, active } = await req.json();
  if (!id || typeof active !== 'boolean')
    return NextResponse.json({ error: 'id e active obrigatórios' }, { status: 400 });
  const canal = await db.channel.update({ where: { id }, data: { active } });
  return NextResponse.json(canal);
}
