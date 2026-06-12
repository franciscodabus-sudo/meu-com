import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  const fontes = await db.radarSource.findMany({ orderBy: { createdAt: 'asc' } });
  return NextResponse.json(fontes);
}

export async function POST(req: Request) {
  try {
    const { url, kind, name } = await req.json() as { url: string; kind: string; name: string };
    if (!url || !name) return NextResponse.json({ error: 'url e name obrigatórios' }, { status: 400 });
    const validos = ['rss', 'website', 'instagram'];
    if (!validos.includes(kind)) return NextResponse.json({ error: 'kind inválido' }, { status: 400 });

    const fonte = await db.radarSource.upsert({
      where: { url },
      create: { url, kind: kind ?? 'rss', name, active: true },
      update: { kind: kind ?? 'rss', name, active: true }
    });
    return NextResponse.json(fonte, { status: 201 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erro';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { id } = await req.json() as { id: string };
    if (!id) return NextResponse.json({ error: 'id obrigatório' }, { status: 400 });
    await db.radarSource.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erro';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
