import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { executarPipelineArtigo } from '@/lib/pipeline-artigo';

export const maxDuration = 60;

// POST /api/artigo  { brief, profileId? }
export async function POST(req: Request) {
  try {
    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json({ error: 'ANTHROPIC_API_KEY não configurada' }, { status: 500 });
    }

    const { brief, profileId } = await req.json();
    if (!brief?.trim()) {
      return NextResponse.json({ error: 'Brief obrigatório' }, { status: 400 });
    }

    const article = await db.article.create({
      data: {
        brief: brief.trim(),
        profileId: profileId ?? null,
        status: 'generating',
      },
    });

    // Fire-and-forget: pipeline roda em background; cliente faz polling no GET
    executarPipelineArtigo(article.id, brief.trim(), profileId).catch(() => {});

    return NextResponse.json({ articleId: article.id });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erro ao iniciar pipeline';
    console.error('[POST /api/artigo]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// GET /api/artigo  — lista artigos recentes (últimos 20)
export async function GET() {
  const articles = await db.article.findMany({
    orderBy: { createdAt: 'desc' },
    take: 20,
    select: {
      id: true, brief: true, status: true,
      titulo: true, subtitulo: true,
      createdAt: true, updatedAt: true,
    },
  });
  return NextResponse.json(articles);
}
