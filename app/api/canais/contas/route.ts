import { NextResponse } from 'next/server';
import { buscarCanais } from '@/lib/ayrshare';

export async function GET() {
  if (!process.env.AYRSHARE_API_KEY)
    return NextResponse.json({ error: 'Serviço de publicação não configurado' }, { status: 503 });
  try {
    const contas = await buscarCanais();
    return NextResponse.json(contas);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erro';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
