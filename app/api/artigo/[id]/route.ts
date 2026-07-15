import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

type Params = { params: { id: string } };

// GET /api/artigo/:id — estado atual do artigo (usado para polling)
export async function GET(_req: Request, { params }: Params) {
  const article = await db.article.findUnique({ where: { id: params.id } });
  if (!article) return NextResponse.json({ error: 'artigo não encontrado' }, { status: 404 });
  return NextResponse.json(article);
}

// PATCH /api/artigo/:id  { action: 'aprovar' }
// Cria um Post na fila de aprovação a partir do artigo e muda status para 'aprovado'
export async function PATCH(req: Request, { params }: Params) {
  try {
    const { action } = await req.json();
    if (action !== 'aprovar') {
      return NextResponse.json({ error: 'Ação inválida' }, { status: 400 });
    }

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
