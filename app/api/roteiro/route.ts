import { NextResponse } from 'next/server';
import { gerarRoteiroDeVideo, getPerfilAtivo } from '@/lib/claude';
import { db } from '@/lib/db';

// POST /api/roteiro  { brief, profileId? }
export async function POST(req: Request) {
  try {
    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json({ error: 'ANTHROPIC_API_KEY não configurada' }, { status: 500 });
    }

    const { brief, profileId } = await req.json();
    if (!brief?.trim()) {
      return NextResponse.json({ error: 'Brief obrigatório' }, { status: 400 });
    }

    const perfil = profileId
      ? await db.brandProfile.findUnique({ where: { id: profileId } })
      : await getPerfilAtivo();

    const roteiro = await gerarRoteiroDeVideo(brief.trim(), perfil);
    return NextResponse.json(roteiro);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Erro ao gerar roteiro';
    console.error('[/api/roteiro]', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
