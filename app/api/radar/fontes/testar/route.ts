import { NextResponse } from 'next/server';
import { testarFonte } from '@/lib/rss';

// POST /api/radar/fontes/testar  { url, kind, name }
export async function POST(req: Request) {
  try {
    const { url, kind, name } = await req.json() as { url: string; kind: string; name: string };
    if (!url) return NextResponse.json({ ok: false, count: 0, erro: 'URL obrigatória' }, { status: 400 });
    const result = await testarFonte(url, kind ?? 'website', name ?? '');
    return NextResponse.json(result);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erro desconhecido';
    return NextResponse.json({ ok: false, count: 0, erro: msg }, { status: 500 });
  }
}
