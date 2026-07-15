import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { continuarPipelineArtigo } from '@/lib/pipeline-artigo';

export const maxDuration = 60;

type Params = { params: { id: string } };

// GET /api/artigo/:id — estado atual do artigo (usado para polling)
export async function GET(_req: Request, { params }: Params) {
  const article = await db.article.findUnique({ where: { id: params.id } });
  if (!article) return NextResponse.json({ error: 'artigo não encontrado' }, { status: 404 });
  return NextResponse.json(article);
}

// PATCH /api/artigo/:id  { action: 'aprovar' | 'escolher_gancho', opcaoIndex?: number }
export async function PATCH(req: Request, { params }: Params) {
  try {
    const body = await req.json();
    const { action } = body;

    // ── Escolha de gancho: retoma pipeline na fase 2 ──────────────────────────
    if (action === 'escolher_gancho') {
      const opcaoIndex = typeof body.opcaoIndex === 'number' ? body.opcaoIndex : -1;
      if (opcaoIndex < 0 || opcaoIndex > 2) {
        return NextResponse.json({ error: 'opcaoIndex inválido (0, 1 ou 2)' }, { status: 400 });
      }
      const article = await db.article.findUnique({ where: { id: params.id } });
      if (!article) return NextResponse.json({ error: 'artigo não encontrado' }, { status: 404 });
      if (article.status !== 'aguardando_gancho') {
        return NextResponse.json({ error: 'Artigo não está aguardando escolha de gancho' }, { status: 400 });
      }
      // Fire-and-forget: fase 2 roda em background
      continuarPipelineArtigo(params.id, opcaoIndex).catch(() => {});
      return NextResponse.json({ ok: true });
    }
    if (action !== 'aprovar') {
      return NextResponse.json({ error: 'Ação inválida' }, { status: 400 });
    }

    // ── Aprovação do artigo ───────────────────────────────────────────────────

    const article = await db.article.findUnique({ where: { id: params.id } });
    if (!article) return NextResponse.json({ error: 'artigo não encontrado' }, { status: 404 });
    if (article.status !== 'rascunho') {
      return NextResponse.json({ error: 'Apenas artigos em rascunho podem ser aprovados' }, { status: 400 });
    }

    const campaign = await db.campaign.create({
      data: { name: (article.titulo ?? article.brief).slice(0, 60), brief: article.brief },
    });

    const post = await db.post.create({
      data: {
        campaignId: campaign.id,
        profileId:  article.profileId,
        channel:    'linkedin',
        format:     'artigo',
        stage:      'educar',
        title:      article.titulo ?? article.brief.slice(0, 80),
        caption:    article.corpo ?? '',
        hashtags:   article.hashtags ?? '',
        status:     'pending',
      },
    });

    await db.article.update({
      where: { id: params.id },
      data: { status: 'aprovado', postId: post.id },
    });

    return NextResponse.json({ ok: true, postId: post.id });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erro ao aprovar artigo';
    console.error('[PATCH /api/artigo/:id]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
