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
  if (!Array.isArray(draft?.secoes)) return '';
  return draft.secoes
    .map(s => `## ${s.heading}\n\n${s.corpo}`)
    .join('\n\n');
}

// Máquina de estados: lê o status atual, roda o próximo agente, grava no DB.
// Cada chamada executa exatamente um agente (~20-35 s) — cabe no limite de 60 s da Vercel.
// Erros internos são capturados e persistidos como status 'erro' para o modal exibir corretamente.
export async function avancarPipeline(articleId: string) {
  const article = await db.article.findUnique({ where: { id: articleId } });
  if (!article) throw new Error('Artigo não encontrado');

  const perfil = article.profileId
    ? await db.brandProfile.findUnique({ where: { id: article.profileId } })
    : await db.brandProfile.findFirst({ where: { ativo: true } });

  try {
    switch (article.status) {
      case 'generating': {
        const research = await pesquisarArtigo(article.brief, perfil);
        return db.article.update({
          where: { id: articleId },
          data: { researchJson: JSON.stringify(research), status: 'pesquisado' },
        });
      }

      case 'pesquisado': {
        const research: ArticleResearch = JSON.parse(article.researchJson!);
        const plan = await planejarArtigo(article.brief, research, perfil);
        return db.article.update({
          where: { id: articleId },
          data: { planJson: JSON.stringify(plan), status: 'planejado' },
        });
      }

      case 'planejado': {
        const research: ArticleResearch = JSON.parse(article.researchJson!);
        const plan: ArticlePlan = JSON.parse(article.planJson!);
        const copy = await copiarArtigo(article.brief, plan, research, perfil);
        return db.article.update({
          where: { id: articleId },
          data: { copyJson: JSON.stringify(copy), status: 'aguardando_gancho' },
        });
      }

      case 'gerando_artigo': {
        const opcaoIndex = parseInt(article.opcaoEscolhida ?? '0', 10);
        const copy: ArticleCopy = JSON.parse(article.copyJson!);
        const plan: ArticlePlan = JSON.parse(article.planJson!);
        const research: ArticleResearch = JSON.parse(article.researchJson!);
        const opcao = copy.opcoes[opcaoIndex];
        if (!opcao) throw new Error(`Opção ${opcaoIndex} inválida`);
        const draft = await redigirArtigo(article.brief, plan, research, perfil, opcao);
        return db.article.update({
          where: { id: articleId },
          data: { draftJson: JSON.stringify(draft), status: 'redigido' },
        });
      }

      case 'redigido': {
        const draft: ArticleDraft = JSON.parse(article.draftJson!);
        const editedDraft = await editarArtigo(draft, perfil);
        return db.article.update({
          where: { id: articleId },
          data: { editJson: JSON.stringify(editedDraft), status: 'editado' },
        });
      }

      case 'editado': {
        const research: ArticleResearch = JSON.parse(article.researchJson!);
        const editedDraft: ArticleDraft = JSON.parse(article.editJson!);
        const qa = await revisarArtigo(editedDraft, research, perfil);
        // Só usa draftCorrigido se vier com secoes válidas
        const corrigidoValido =
          qa.draftCorrigido &&
          Array.isArray(qa.draftCorrigido.secoes) &&
          qa.draftCorrigido.secoes.length > 0;
        const draftFinal = qa.retryCount > 0 && corrigidoValido ? qa.draftCorrigido! : editedDraft;
        return db.article.update({
          where: { id: articleId },
          data: {
            status:       'rascunho',
            qaJson:       JSON.stringify(qa),
            titulo:       draftFinal.titulo,
            subtitulo:    draftFinal.subtitulo,
            corpo:        draftParaCorpo(draftFinal),
            cta:          draftFinal.cta,
            legendaRedes: draftFinal.legendaRedes,
            hashtags:     draftFinal.hashtags,
          },
        });
      }

      default:
        throw new Error(`Status '${article.status}' não pode ser avançado`);
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[artigo:${articleId}] avancarPipeline erro:`, message);
    return db.article.update({
      where: { id: articleId },
      data: { status: 'erro', qaJson: JSON.stringify({ erro: message }) },
    });
  }
}
