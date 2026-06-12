import { NextResponse } from 'next/server';
import { buscarHistorico } from '@/lib/ayrshare';

export async function GET(req: Request) {
  if (!process.env.AYRSHARE_API_KEY)
    return NextResponse.json({ error: 'Serviço de publicação não configurado' }, { status: 503 });
  try {
    const limit = Number(new URL(req.url).searchParams.get('limit') ?? '20');
    const historico = await buscarHistorico(limit);
    return NextResponse.json(historico);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erro';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
