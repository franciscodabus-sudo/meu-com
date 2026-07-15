import { db } from './db';
import {
  pesquisarArtigo,
  planejarArtigo,
  copiarArtigo,
  redigirArtigo,
  editarArtigo,
  revisarArtigo,
  type ArticleCopy,
  type ArticlePlan,
  type ArticleResearch,
  type ArticleDraft,
} from './claude';

function draftParaCorpo(draft: ArticleDraft): string {
  return draft.secoes
    .map(s => `## ${s.heading}\n\n${s.corpo}`)
    .join('\n\n');
}

// ── FASE 1: Pesquisador → Estrategista → Copywriter → aguardando_gancho ──────
// O pipeline pausa aqui e aguarda o usuário escolher um dos ganchos gerados.

export async function executarPipelineArtigo(
  articleId: string,
  brief: string,
  profileId?: string | null,
): Promise<void> {
  const perfil = profileId
    ? await db.brandProfile.findUnique({ where: { id: profileId } })
    : await db.brandProfile.findFirst({ where: { ativo: true } });

  try {
    // AGENTE 1: Pesquisador
    console.log(`[artigo:${articleId}] 🔍 Pesquisador iniciado`);
    const research = await pesquisarArtigo(brief, perfil);
    await db.article.update({
      where: { id: articleId },
      data: { researchJson: JSON.stringify(research) },
    });
    console.log(`[artigo:${articleId}] 🔍 Pesquisador: ${research.fatos.length} fatos, ${research.angulos.length} ângulos`);

    // AGENTE 2: Estrategista
    console.log(`[artigo:${articleId}] 🧭 Estrategista iniciado`);
    const plan = await planejarArtigo(brief, research, perfil);
    await db.article.update({
      where: { id: articleId },
      data: { planJson: JSON.stringify(plan) },
    });
    console.log(`[artigo:${articleId}] 🧭 Estrategista: "${plan.titulo}" — ${plan.outline.length} seções`);

    // AGENTE 3: Copywriter
    console.log(`[artigo:${articleId}] ✏️  Copywriter iniciado`);
    const copy = await copiarArtigo(brief, plan, research, perfil);
    await db.article.update({
      where: { id: articleId },
      data: {
        copyJson: JSON.stringify(copy),
        status: 'aguardando_gancho',
      },
    });
    console.log(`[artigo:${articleId}] ⏸  Aguardando escolha de gancho (${copy.opcoes.length} opções geradas)`);

  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[artigo:${articleId}] ✗ Erro na fase 1: ${msg}`);
    await db.article.update({
      where: { id: articleId },
      data: { status: 'erro', qaJson: JSON.stringify({ erro: msg }) },
    });
  }
}

// ── FASE 2: Redator → Editor → Revisor → rascunho ────────────────────────────
// Chamada depois que o usuário escolhe um dos ganchos.

export async function continuarPipelineArtigo(
  articleId: string,
  opcaoIndex: number,
): Promise<void> {
  const article = await db.article.findUnique({ where: { id: articleId } });
  if (!article?.copyJson || !article?.planJson || !article?.researchJson) {
    throw new Error('Dados da fase 1 não encontrados — reinicie o pipeline');
  }

  const copy     = JSON.parse(article.copyJson)     as ArticleCopy;
  const plan     = JSON.parse(article.planJson)     as ArticlePlan;
  const research = JSON.parse(article.researchJson) as ArticleResearch;
  const opcao    = copy.opcoes[opcaoIndex];
  if (!opcao) throw new Error(`Opção ${opcaoIndex} inválida`);

  const perfil = article.profileId
    ? await db.brandProfile.findUnique({ where: { id: article.profileId } })
    : await db.brandProfile.findFirst({ where: { ativo: true } });

  try {
    await db.article.update({
      where: { id: articleId },
      data: { status: 'gerando_artigo', titulo: opcao.titulo },
    });

    // AGENTE 4: Redator
    console.log(`[artigo:${articleId}] ✍️  Redator iniciado (gancho: "${opcao.titulo}")`);
    const draft = await redigirArtigo(article.brief, plan, research, perfil, opcao);
    await db.article.update({
      where: { id: articleId },
      data: { draftJson: JSON.stringify(draft) },
    });
    console.log(`[artigo:${articleId}] ✍️  Redator: ${draft.secoes.length} seções escritas`);

    // AGENTE 5: Editor
    console.log(`[artigo:${articleId}] 🎨 Editor iniciado`);
    const editedDraft = await editarArtigo(draft, perfil);
    await db.article.update({
      where: { id: articleId },
      data: { editJson: JSON.stringify(editedDraft) },
    });
    console.log(`[artigo:${articleId}] 🎨 Editor: tom de voz calibrado`);

    // AGENTE 6: Revisor (com 1 retry automático)
    console.log(`[artigo:${articleId}] ✅ Revisor iniciado`);
    const qa = await revisarArtigo(editedDraft, research, perfil);
    await db.article.update({
      where: { id: articleId },
      data: { qaJson: JSON.stringify(qa) },
    });
    console.log(`[artigo:${articleId}] ✅ Revisor: aprovado=${qa.aprovado}, retry=${qa.retryCount}`);

    const draftFinal = qa.retryCount > 0 && qa.draftCorrigido ? qa.draftCorrigido : editedDraft;

    await db.article.update({
      where: { id: articleId },
      data: {
        status:       'rascunho',
        titulo:       draftFinal.titulo,
        subtitulo:    draftFinal.subtitulo,
        corpo:        draftParaCorpo(draftFinal),
        cta:          draftFinal.cta,
        legendaRedes: draftFinal.legendaRedes,
        hashtags:     draftFinal.hashtags,
      },
    });

    console.log(`[artigo:${articleId}] ✓ Pipeline concluído — aguardando aprovação`);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[artigo:${articleId}] ✗ Erro na fase 2: ${msg}`);
    await db.article.update({
      where: { id: articleId },
      data: { status: 'erro', qaJson: JSON.stringify({ erro: msg }) },
    });
  }
}
