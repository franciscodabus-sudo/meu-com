import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  const perfil = await db.brandProfile.findFirst({ where: { ativo: true } });
  if (!perfil) return NextResponse.json({ error: 'Nenhum perfil ativo' }, { status: 404 });

  const settings = await db.adSettings.upsert({
    where:  { profileId: perfil.id },
    create: { profileId: perfil.id },
    update: {},
  });

  return NextResponse.json({
    ...settings,
    metaConnected: !!(process.env.META_ACCESS_TOKEN?.trim()),
  });
}

export async function PATCH(req: Request) {
  const body = await req.json() as {
    monthlyBudget?: number;
    maxCPC?: number;
    autoBrake?: boolean;
    boostWinners?: boolean;
  };

  const perfil = await db.brandProfile.findFirst({ where: { ativo: true } });
  if (!perfil) return NextResponse.json({ error: 'Nenhum perfil ativo' }, { status: 404 });

  const data: Record<string, unknown> = {};
  if (body.monthlyBudget !== undefined) data.monthlyBudget = body.monthlyBudget;
  if (body.maxCPC !== undefined)        data.maxCPC        = body.maxCPC;
  if (body.autoBrake !== undefined)     data.autoBrake     = body.autoBrake;
  if (body.boostWinners !== undefined)  data.boostWinners  = body.boostWinners;

  const settings = await db.adSettings.upsert({
    where:  { profileId: perfil.id },
    create: { profileId: perfil.id, ...data },
    update: data,
  });

  return NextResponse.json({ ...settings, metaConnected: !!(process.env.META_ACCESS_TOKEN?.trim()) });
}
