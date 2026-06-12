import { NextResponse } from 'next/server';
import { buscarFotosPexels } from '@/lib/pexels';

// GET /api/imagens?q=termo&page=1
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q    = searchParams.get('q')?.trim() ?? '';
  const page = parseInt(searchParams.get('page') ?? '1', 10);

  if (!q) return NextResponse.json({ photos: [], totalResults: 0, nextPage: null });
  if (!process.env.PEXELS_API_KEY) {
    return NextResponse.json({ error: 'Chave do banco de imagens não configurada no .env' }, { status: 503 });
  }

  const result = await buscarFotosPexels(q, page, 12);
  return NextResponse.json(result);
}
