import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const profileId = searchParams.get('profileId') ?? undefined;
  const where = profileId ? { profileId } : {};
  const fontes = await db.radarSource.findMany({ where, orderBy: { createdAt: 'asc' } });
  return NextResponse.json(fontes);
}

export async function POST(req: Request) {
  try {
    const { url, kind, name, profileId } = await req.json() as {
      url: string; kind: string; name: string; profileId?: string;
    };
    if (!url || !name) return NextResponse.json({ error: 'url e name obrigatórios' }, { status: 400 });
    const validos = ['rss', 'website', 'instagram'];
    if (!validos.includes(kind)) return NextResponse.json({ error: 'kind inválido' }, { status: 400 });

    const existing = await db.radarSource.findFirst({ where: { url, profileId: profileId ?? null } });
    const fonte = existing
      ? await db.radarSource.update({
          where: { id: existing.id },
          data: { kind: kind ?? 'rss', name, active: true },
        })
      : await db.radarSource.create({
          data: { url, kind: kind ?? 'rss', name, active: true, profileId: profileId ?? null },
        });
    return NextResponse.json(fonte, { status: 201 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erro';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const { id, active } = await req.json() as { id: string; active: boolean };
    if (!id || active === undefined) return NextResponse.json({ error: 'id e active obrigatórios' }, { status: 400 });
    const fonte = await db.radarSource.update({ where: { id }, data: { active } });
    return NextResponse.json(fonte);
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
