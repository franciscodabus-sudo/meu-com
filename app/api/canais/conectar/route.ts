import { NextResponse } from 'next/server';
import { gerarLinkConexao } from '@/lib/ayrshare';

export async function GET() {
  const url = gerarLinkConexao();
  return NextResponse.json({ url });
}
