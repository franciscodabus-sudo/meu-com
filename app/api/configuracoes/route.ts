import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSetting, setSetting } from '@/lib/radar-auto';

const CANAIS_PADRAO = [
  { name: 'instagram', active: true },
  { name: 'facebook',  active: true },
  { name: 'linkedin',  active: true },
  { name: 'tiktok',   active: false },
];

async function garantirCanais() {
  const count = await db.channel.count();
  if (count === 0) await db.channel.createMany({ data: CANAIS_PADRAO });
}

export async function GET() {
  await garantirCanais();

  const [perfil, intervalHoras, maxPostsPerRun, canais] = await Promise.all([
    getSetting('perfilContexto', ''),
    getSetting('radarIntervalHoras', '6'),
    getSetting('radarMaxPostsPerRun', '2'),
    db.channel.findMany({ orderBy: { name: 'asc' } }),
  ]);

  const chaves = {
    anthropic: !!process.env.ANTHROPIC_API_KEY,
    ayrshare:  !!process.env.AYRSHARE_API_KEY,
    pexels:    !!process.env.PEXELS_API_KEY,
  };

  return NextResponse.json({ perfil, intervalHoras, maxPostsPerRun, canais, chaves });
}

export async function POST(req: Request) {
  try {
    await garantirCanais();
    const body = await req.json() as {
      perfil?: string;
      intervalHoras?: string;
      maxPostsPerRun?: string;
      canais?: { name: string; active: boolean }[];
    };

    const saves: Promise<unknown>[] = [];

    if (body.perfil !== undefined)        saves.push(setSetting('perfilContexto',    body.perfil));
    if (body.intervalHoras !== undefined) saves.push(setSetting('radarIntervalHoras', body.intervalHoras));
    if (body.maxPostsPerRun !== undefined) saves.push(setSetting('radarMaxPostsPerRun', body.maxPostsPerRun));

    if (body.canais) {
      for (const c of body.canais) {
        saves.push(db.channel.upsert({
          where:  { name: c.name },
          create: { name: c.name, active: c.active },
          update: { active: c.active },
        }));
      }
    }

    await Promise.all(saves);
    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erro';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
