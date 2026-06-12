import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/imagens/salvar  → lista todos os assets
export async function GET() {
  const assets = await db.mediaAsset.findMany({ orderBy: { createdAt: 'desc' } });
  return NextResponse.json(assets);
}

// POST /api/imagens/salvar  { url, tags?, source? }
export async function POST(req: Request) {
  try {
    const { url, tags, source } = await req.json() as { url: string; tags?: string; source?: string };
    if (!url) return NextResponse.json({ error: 'url obrigatória' }, { status: 400 });

    const asset = await db.mediaAsset.upsert({
      where: { url },
      create: { url, kind: 'foto', tags: tags ?? '', source: source ?? 'pexels' },
      update: { tags: tags ?? '', source: source ?? 'pexels' },
    });
    return NextResponse.json(asset, { status: 201 });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Erro' }, { status: 500 });
  }
}
