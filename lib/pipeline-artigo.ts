import { db } from './db';
import {
  pesquisarArtigo,
  planejarArtigo,
  redigirArtigo,
  revisarArtigo,
  type ArticleDraft,
} from './claude';

function draftParaCorpo(draft: ArticleDraft): string {
  return draft.secoes
    .map(s => `## ${s.heading}\n\n${s.corpo}`)
    .join('\n\n');
}

export async function executarPipelineArtigo(
  articleId: string,
  brief: string,
  profileId?: string | null,
): Promise<void> {
  const perfil = profileId
    ? await db.brandProfile.findUnique({ where: { id: profileId } })
    : await db.brandProfile.findFirst({ where: { ativo: true } });

  try {
    // ── AGENTE 1: Pesquisador (web search) ──────────────────────────────────
    console.log(`[artigo:${articleId}] 🔍 Pesquisador iniciado`);
    const research = await pesquisarArtigo(brief, perfil);
    await db.article.update({
      where: { id: articleId },
      data: { researchJson: JSON.stringify(research) },
    });
    console.log(`[artigo:${articleId}] 🔍 Pesquisador: ${research.fatos.length} fatos, ${research.angulos.length} ângulos`);

    // ── AGENTE 2: Estrategista ───────────────────────────────────────────────
    console.log(`[artigo:${articleId}] 🧭 Estrategista iniciado`);
    const plan = await planejarArtigo(brief, research, perfil);
    await db.article.update({
      where: { id: articleId },
      data: { planJson: JSON.stringify(plan) },
    });
    console.log(`[artigo:${articleId}] 🧭 Estrategista: "${plan.titulo}" — ${plan.outline.length} seções`);

    // ── AGENTE 3: Redator ────────────────────────────────────────────────────
    console.log(`[artigo:${articleId}] ✍️  Redator iniciado`);
    const draft = await redigirArtigo(brief, plan, research, perfil);
    await db.article.update({
      where: { id: articleId },
      data: { draftJson: JSON.stringify(draft) },
    });
    console.log(`[artigo:${articleId}] ✍️  Redator: ${draft.secoes.length} seções escritas`);

    // ── AGENTE 4: Revisor (com 1 retry automático) ───────────────────────────
    console.log(`[artigo:${articleId}] ✅ Revisor iniciado`);
    const qa = await revisarArtigo(draft, research, perfil);
    await db.article.update({
      where: { id: articleId },
      data: { qaJson: JSON.stringify(qa) },
    });
    console.log(`[artigo:${articleId}] ✅ Revisor: aprovado=${qa.aprovado}, retry=${qa.retryCount}, issues=${qa.issues.length}`);

    // Usa rascunho corrigido pelo Revisor se houve retry
    const draftFinal = qa.retryCount > 0 && qa.draftCorrigido ? qa.draftCorrigido : draft;

    // ── CHECKPOINT: salva artigo completo e muda status para 'rascunho' ─────
    await db.article.update({
      where: { id: articleId },
      data: {
        status:      'rascunho',
        titulo:      draftFinal.titulo,
        subtitulo:   draftFinal.subtitulo,
        corpo:       draftParaCorpo(draftFinal),
        cta:         draftFinal.cta,
        legendaRedes: draftFinal.legendaRedes,
        hashtags:    draftFinal.hashtags,
      },
    });

    console.log(`[artigo:${articleId}] ✓ Pipeline concluído — aguardando aprovação`);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[artigo:${articleId}] ✗ Erro no pipeline: ${msg}`);
    await db.article.update({
      where: { id: articleId },
      data: { status: 'erro', qaJson: JSON.stringify({ erro: msg }) },
    });
  }
}
