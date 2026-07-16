import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { avancarPipeline } from '@/lib/pipeline-artigo';

export const maxDuration = 60;

type Params = { params: { id: string } };

// GET /api/artigo/:id — estado atual do artigo (usado para exibição)
export async function GET(_req: Request, { params }: Params) {
  const article = await db.article.findUnique({ where: { id: params.id } });
  if (!article) return NextResponse.json({ error: 'artigo não encontrado' }, { status: 404 });
  return NextResponse.json(article);
}

// PATCH /api/artigo/:id
//   { action: 'avancar' }                          → roda o próximo agente (um por chamada)
//   { action: 'retry' }                             → restaura status a partir do progresso salvo
//   { action: 'escolher_gancho', opcaoIndex: 0|1|2 } → salva escolha, avança para gerando_artigo
//   { action: 'aprovar' }                           → cria Post na fila
export async function PATCH(req: Request, { params }: Params) {
  try {
    const body = await req.json();
    const { action } = body;

    // ── Avança um passo do pipeline ─────────────────────────────────────────────
    if (action === 'avancar') {
      const updated = await avancarPipeline(params.id);
      return NextResponse.json(updated);
    }

    // ── Retry: infere o último passo concluído pelos JSONs salvos ──────────────
    if (action === 'retry') {
      const article = await db.article.findUnique({ where: { id: params.id } });
      if (!article) return NextResponse.json({ error: 'artigo não encontrado' }, { status: 404 });
      if (article.status !== 'erro') {
        return NextResponse.json({ error: 'Apenas artigos com erro podem ser retomados' }, { status: 400 });
      }
      const statusRetomada =
        article.editJson                            ? 'editado' :
        article.draftJson                           ? 'redigido' :
        article.copyJson && article.opcaoEscolhida  ? 'gerando_artigo' :
        article.copyJson                            ? 'aguardando_gancho' :
        article.planJson                            ? 'planejado' :
        article.researchJson                        ? 'pesquisado' :
                                                      'generating';
      const updated = await db.article.update({
        where: { id: params.id },
        data: { status: statusRetomada },
      });
      return NextResponse.json(updated);
    }

    // ── Escolha de gancho: salva índice e libera Fase 2 ────────────────────────
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
      await db.article.update({
        where: { id: params.id },
        data: { status: 'gerando_artigo', opcaoEscolhida: String(opcaoIndex) },
      });
      return NextResponse.json({ ok: true });
    }

    // ── Aprovação do artigo ─────────────────────────────────────────────────────
    if (action === 'aprovar') {
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
    }

    return NextResponse.json({ error: 'Ação inválida' }, { status: 400 });

  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erro ao processar artigo';
    console.error('[PATCH /api/artigo/:id]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
