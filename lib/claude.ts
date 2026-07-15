import Anthropic from '@anthropic-ai/sdk';
import { db } from './db';
import { getSetting } from './radar-auto';

const anthropic = new Anthropic();

// ── Seleção inteligente de modelo ─────────────────────────────────────────────

const MODELS = {
  fast:     'claude-haiku-4-5-20251001',  // triagem — muitas chamadas, decisão simples
  balanced: 'claude-sonnet-4-6',           // conteúdo padrão — equilíbrio custo/qualidade
  powerful: 'claude-opus-4-6',             // brief e planejamento — máxima qualidade
} as const;

export type ModelTask =
  | 'radar_filter'      // triagem de relevância — Haiku
  | 'radar_post'        // gerar post a partir de notícia — Sonnet
  | 'brief_post'        // gerar post a partir de brief — Opus
  | 'campaign_plan'     // plano de campanha completo — Opus
  | 'chat_cmo'          // responder pergunta no painel — Sonnet
  | 'quality_check'     // verificar [verificar] e dados suspeitos — Haiku
  | 'video_script'      // roteiro de vídeo curto — Opus
  | 'article_research'  // pesquisador com web search — Sonnet
  | 'article_plan'      // estrategista de artigo — Sonnet
  | 'article_write'     // redator de artigo longo — Opus
  | 'article_qa';       // revisor de artigo — Haiku

export function getModel(task: ModelTask): string {
  const forced = process.env.FORCE_MODEL?.trim();
  const auto = (): string => {
    switch (task) {
      case 'radar_filter':  return MODELS.fast;
      case 'quality_check': return MODELS.fast;
      case 'radar_post':    return MODELS.balanced;
      case 'chat_cmo':      return MODELS.balanced;
      case 'brief_post':        return MODELS.powerful;
      case 'campaign_plan':     return MODELS.powerful;
      case 'video_script':      return MODELS.powerful;
      case 'article_write':     return MODELS.powerful;
      case 'article_research':  return MODELS.balanced;
      case 'article_plan':      return MODELS.balanced;
      case 'article_qa':        return MODELS.fast;
      default:                  return MODELS.balanced;
    }
  };
  const model = forced || auto();
  const tag = forced ? 'FORCE_MODEL' : task;
  console.log(`🤖 IA [${tag}] → ${model}`);
  return model;
}

// ── Perfil de marca ──────────────────────────────────────────────────────────

export type BrandProfile = {
  id: string;
  name: string;
  displayName: string;
  avatarColor: string;
  descricao: string | null;
  publicoAlvo: string | null;
  tomDeVoz: string | null;
  tomEvitar: string | null;
  idioma: string;
  contato: string | null;
  produtos: string | null;
  frequencia: string | null;
  channelsActive: string | null;
  objetivo: string;
  notasLivres: string | null;
  ativo: boolean;
  pausado: boolean;
  radarAtivo: boolean;
};

export async function getPerfilAtivo(): Promise<BrandProfile | null> {
  return db.brandProfile.findFirst({ where: { ativo: true } });
}

// ── Montagem dinâmica do prompt a partir do perfil ───────────────────────────

function montarPromptDoPerfil(perfil: BrandProfile | null): string {
  if (!perfil) {
    // Fallback mínimo sem inventar dados
    return [
      'Você é um CMO pessoal especializado em marketing para profissionais independentes.',
      'Tom: consultivo, direto, caloroso. Idioma: PT-BR como padrão.',
      REGRAS_GERAIS,
    ].join('\n\n');
  }

  const linhas: string[] = [
    `Você é o CMO pessoal de ${perfil.displayName}, com base em Orlando, FL.`,
  ];

  if (perfil.descricao?.trim())
    linhas.push(`Negócio: ${perfil.descricao.trim()}`);

  if (perfil.publicoAlvo?.trim())
    linhas.push(`Público-alvo: ${perfil.publicoAlvo.trim()}`);

  if (perfil.tomDeVoz?.trim())
    linhas.push(`Tom de voz (usar): ${perfil.tomDeVoz.trim()}`);

  if (perfil.tomEvitar?.trim())
    linhas.push(`Tom de voz (evitar): ${perfil.tomEvitar.trim()}`);

  if (perfil.produtos?.trim())
    linhas.push(`Produtos/serviços: ${perfil.produtos.trim()}`);

  if (perfil.objetivo?.trim())
    linhas.push(`Objetivo de marketing: ${perfil.objetivo.trim()}`);

  if (perfil.frequencia?.trim())
    linhas.push(`Frequência de postagem: ${perfil.frequencia.trim()}`);

  linhas.push(`Idioma principal: ${perfil.idioma}.`);

  if (perfil.contato?.trim())
    linhas.push(`Site/contato: ${perfil.contato.trim()}`);

  if (perfil.notasLivres?.trim())
    linhas.push(`Notas adicionais para o CMO: ${perfil.notasLivres.trim()}`);

  linhas.push(
    'Sua função: transformar um brief ou notícia em posts prontos para redes sociais sobre QUALQUER tema. Adapte o ângulo ao tema do brief.',
    REGRAS_GERAIS,
  );

  return linhas.join('\n\n');
}

const REGRAS_GERAIS = `REGRAS:
- Nunca invente estatísticas; se citar dado, marque como [verificar].
- Nunca invente informações sobre a empresa (slogan, anos de mercado, equipe, prêmios) que não estejam no perfil acima.
- Todo post tem: gancho forte na 1ª linha, corpo curto, CTA claro (DM, salvar, comentar).
- Hashtags locais e de nicho (5 a 8), sem hashtags genéricas inúteis.
- Nunca adicione assinatura, cargo, nome da empresa ou byline ao texto do post.
- Se o gancho ou título prometer N itens numerados (ex: "3 dicas", "5 seguros"), inclua EXATAMENTE N itens (1️⃣ 2️⃣ 3️⃣) antes do CTA — nunca prometa e não entregue.
- Responda SOMENTE com JSON válido, sem markdown, sem comentários.`;

async function getSystemPrompt(perfilOverride?: BrandProfile | null): Promise<string> {
  const [perfil, extra, waNumero] = await Promise.all([
    perfilOverride !== undefined ? Promise.resolve(perfilOverride) : getPerfilAtivo(),
    getSetting('perfilContexto', ''),
    getSetting('whatsappNumero', ''),
  ]);

  let prompt = montarPromptDoPerfil(perfil);

  if (waNumero) {
    const waLink = `https://wa.me/${waNumero.replace(/\D/g, '')}`;
    prompt += `\n\nCONFIGURAÇÃO DE CTA: o link de WhatsApp é ${waLink}. Inclua-o no caption apenas quando o CTA pedir ação direta do leitor (contato, tirar dúvida, etc.).`;
  }

  if (extra?.trim()) {
    prompt += `\n\nCONTEXTO ADICIONAL:\n${extra.trim()}`;
  }

  return prompt;
}

// ── Tipos e helpers ──────────────────────────────────────────────────────────

export type GeneratedPost = {
  channel: 'instagram' | 'facebook' | 'linkedin' | 'tiktok';
  format: string;
  stage: 'atrair' | 'educar' | 'conectar' | 'converter';
  title: string;
  caption: string;
  hashtags: string;
  whyNow: string;
  scheduledHint: string;
  imageQuery: string;
};

const FORMATO_JSON = `
FORMATO OBRIGATÓRIO (JSON puro, sem markdown):
{"posts":[{"channel":"instagram","format":"post","stage":"atrair","title":"...","caption":"...","hashtags":"#tag1 #tag2 #tag3","whyNow":"...","scheduledHint":"seg 18:00","imageQuery":"insurance family florida"}]}

REGRAS DE CAMPO:
- channel: APENAS uma destas strings exatas: "instagram", "facebook", "linkedin", "tiktok"
  · TikTok: tom casual/direto, gancho nos primeiros 3 segundos (1ª linha = hook impactante), 1ª pessoa,
    emojis estratégicos, CTA simples ("Segue pra mais!", "Comenta aqui ↓"), hashtags trending (3-5 no máximo)
- format: uma destas strings — "post" (feed 1:1), "story" (Stories 9:16), "carrossel", "reel", "artigo"
  · Use "story" quando: conteúdo urgente/notícia, bastidores, checklist rápido, promoção relâmpago, dica de 1 linha
  · Story tem caption curto (1-3 linhas), sem hashtags ou no máximo 3
- stage: APENAS uma destas strings exatas: "atrair", "educar", "conectar", "converter"
- hashtags: string única com hashtags separadas por espaço (não array)
- imageQuery: 2 a 3 palavras EM INGLÊS descrevendo a foto ideal para o post
- Nunca adicione assinatura, cargo ou byline ao texto do post`;

function parsePosts(raw: string): GeneratedPost[] {
  const parsed = JSON.parse(raw.replace(/```json|```/g, '').trim());
  return parsed.posts as GeneratedPost[];
}

// ── Geradores ────────────────────────────────────────────────────────────────

export async function gerarPostDoRadar(
  item: { title: string; summary?: string | null; sourceName?: string | null; sourceUrl?: string | null },
  perfil?: BrandProfile | null,
  canaisPermitidos?: string[],
): Promise<GeneratedPost> {
  const system = await getSystemPrompt(perfil);
  const restricao = canaisPermitidos?.length
    ? `\nCANAIS DISPONÍVEIS: gere o post SOMENTE para um destes canais: ${canaisPermitidos.join(', ')}. Não use nenhum outro canal.`
    : '';
  const msg = await anthropic.messages.create({
    model: getModel('radar_post'),
    max_tokens: 1200,
    system,
    messages: [{
      role: 'user',
      content: `Notícia detectada pelo Radar:
Título: "${item.title}"
Resumo: "${item.summary ?? 'sem resumo'}"
Fonte: ${item.sourceName ?? 'desconhecida'}${restricao}

Gere 1 post aproveitando esta notícia para posicionar o autor como referência no tema.
${FORMATO_JSON}`,
    }],
  });
  const text = msg.content.find(b => b.type === 'text');
  if (!text || text.type !== 'text') throw new Error('Resposta sem texto');
  return parsePosts(text.text)[0];
}

export async function gerarPostsDoBrief(
  brief: string,
  quantidade = 3,
  perfil?: BrandProfile | null,
  canaisPermitidos?: string[],
): Promise<GeneratedPost[]> {
  const system = await getSystemPrompt(perfil);
  const restricao = canaisPermitidos?.length
    ? `\nCANAIS DISPONÍVEIS: distribua os posts SOMENTE entre estes canais conectados: ${canaisPermitidos.join(', ')}. Não use nenhum outro canal.`
    : '';
  const msg = await anthropic.messages.create({
    model: getModel('brief_post'),
    max_tokens: 4096,
    system,
    messages: [{
      role: 'user',
      content: `Brief do cliente: """${brief}"""${restricao}

Gere ${quantidade} posts seguindo a jornada (atrair -> educar -> conectar -> converter).
${FORMATO_JSON}`,
    }],
  });
  const text = msg.content.find(b => b.type === 'text');
  if (!text || text.type !== 'text') throw new Error('Resposta sem texto');
  return parsePosts(text.text);
}

// ── Roteiro de Vídeo ─────────────────────────────────────────────────────────

export type VideoScript = {
  titulo: string;
  canal: 'reels' | 'tiktok' | 'shorts';
  duracao: '15s' | '30s' | '60s' | '90s';
  gancho: string;        // primeiros 3 segundos — fala ou ação visual de abertura
  pontos: string[];      // 3-5 pontos de desenvolvimento com tempo sugerido
  cta: string;           // chamada final do vídeo
  legenda: string;       // caption completo para publicar junto ao vídeo
  hashtags: string;      // hashtags separadas por espaço
  musicaSugerida: string; // tom/estilo de música ou trilha
};

// ── Helpers ──────────────────────────────────────────────────────────────────

// Extrai o primeiro bloco JSON válido de um texto que pode ter prefixo/sufixo em prosa.
function extrairJSON<T>(text: string): T {
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) throw new Error('Resposta não contém JSON válido');
  return JSON.parse(match[0]) as T;
}

// ── Pipeline de Artigo ───────────────────────────────────────────────────────

export type ResearchFact = {
  fato: string;
  fonte: string;        // URL real da fonte
  tituloFonte: string;  // título da página/artigo
};

export type ArticleResearch = {
  angulos: string[];
  fatos: ResearchFact[];
  palavrasChave: string[];
};

export type ArticlePlan = {
  titulo: string;
  subtitulo: string;
  angulo: string;
  publicoAlvo: string;
  outline: Array<{ secao: string; pontos: string[] }>;
};

export type ArticleSection = { heading: string; corpo: string };

export type ArticleDraft = {
  titulo: string;
  subtitulo: string;
  secoes: ArticleSection[];
  cta: string;
  legendaRedes: string;
  hashtags: string;
};

export type ArticleQA = {
  aprovado: boolean;
  issues: string[];
  retryCount: number;
  draftCorrigido?: ArticleDraft;
};

// 1. Pesquisador — Sonnet + web search (server-side tool Anthropic)
export async function pesquisarArtigo(
  brief: string,
  perfil?: BrandProfile | null,
): Promise<ArticleResearch> {
  const system = await getSystemPrompt(perfil);
  const model  = getModel('article_research');

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const response = await (anthropic.beta.messages as any).create({
    model,
    max_tokens: 4096,
    betas: ['web-search-2025-03-05'],
    tools: [{ type: 'web_search_20250305', name: 'web_search' }],
    system,
    messages: [{
      role: 'user',
      content: `Você é o Pesquisador de um pipeline de redação de artigos.
Busque na web fontes reais sobre o tema abaixo e retorne um JSON estruturado.

TEMA: "${brief}"

INSTRUÇÕES:
- Faça buscas reais na web para coletar fatos, dados e estatísticas sobre o tema
- Cada fato DEVE ter uma URL real e específica (não homepage genérica)
- Colete entre 5 e 10 fatos relevantes com fontes reais
- Se não encontrar um dado com fonte verificável, não inclua
- Liste 3 a 5 ângulos diferentes para abordar o tema no artigo
- Extraia 5 a 8 palavras-chave para SEO

Responda SOMENTE com JSON válido neste formato exato (sem markdown, sem explicações):
{
  "angulos": [
    "Ângulo 1: descrição do ângulo editorial",
    "Ângulo 2: descrição do ângulo editorial"
  ],
  "fatos": [
    {
      "fato": "Descrição clara e precisa do dado encontrado",
      "fonte": "https://url-exata-da-fonte.com/pagina",
      "tituloFonte": "Título do artigo ou página onde o dado está"
    }
  ],
  "palavrasChave": ["palavra1", "palavra2", "palavra3"]
}`,
    }],
  });

  // O web search é server-side: o modelo busca e responde em um único call.
  // Extraímos o último bloco de texto e parseamos o JSON de dentro.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const textBlock = [...response.content].reverse().find((b: any) => b.type === 'text');
  if (!textBlock) throw new Error('Pesquisador não retornou texto');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return extrairJSON<ArticleResearch>((textBlock as any).text);
}

// 2. Estrategista — Sonnet: define ângulo e outline
export async function planejarArtigo(
  brief: string,
  research: ArticleResearch,
  perfil?: BrandProfile | null,
): Promise<ArticlePlan> {
  const system = await getSystemPrompt(perfil);
  const msg = await anthropic.messages.create({
    model: getModel('article_plan'),
    max_tokens: 2048,
    system,
    messages: [{
      role: 'user',
      content: `Você é o Estrategista de um pipeline de redação de artigos.
Com base na pesquisa abaixo, defina a estratégia editorial do artigo.

BRIEF ORIGINAL: "${brief}"

PESQUISA COLETADA:
Ângulos disponíveis: ${research.angulos.join(' | ')}
Fatos disponíveis: ${research.fatos.map(f => `• ${f.fato} (${f.tituloFonte})`).join('\n')}
Palavras-chave: ${research.palavrasChave.join(', ')}

INSTRUÇÕES:
- Escolha o melhor ângulo para o público-alvo do perfil
- Defina título e subtítulo atraentes (não clickbait)
- Monte um outline de 4 a 6 seções com pontos específicos a cobrir em cada seção
- Use APENAS fatos que aparecem na pesquisa acima

Responda SOMENTE com JSON válido (sem markdown):
{
  "titulo": "Título principal do artigo",
  "subtitulo": "Subtítulo explicativo (1 frase)",
  "angulo": "Descrição do ângulo editorial escolhido e por quê",
  "publicoAlvo": "Para quem este artigo é escrito",
  "outline": [
    {
      "secao": "Nome da seção",
      "pontos": ["ponto específico a cobrir", "outro ponto"]
    }
  ]
}`,
    }],
  });
  const txt = msg.content.find(b => b.type === 'text');
  if (!txt || txt.type !== 'text') throw new Error('Estrategista não retornou texto');
  return extrairJSON<ArticlePlan>(txt.text);
}

// 3. Redator — Opus: escreve o artigo completo
export async function redigirArtigo(
  brief: string,
  plan: ArticlePlan,
  research: ArticleResearch,
  perfil?: BrandProfile | null,
): Promise<ArticleDraft> {
  const system = await getSystemPrompt(perfil);
  const fatosFormatados = research.fatos
    .map(f => `• ${f.fato}\n  Fonte: ${f.tituloFonte} — ${f.fonte}`)
    .join('\n');

  const msg = await anthropic.messages.create({
    model: getModel('article_write'),
    max_tokens: 6000,
    system,
    messages: [{
      role: 'user',
      content: `Você é o Redator de um pipeline de redação de artigos. Escreva o artigo completo.

BRIEF: "${brief}"
TÍTULO: ${plan.titulo}
SUBTÍTULO: ${plan.subtitulo}
ÂNGULO: ${plan.angulo}
PÚBLICO: ${plan.publicoAlvo}

OUTLINE A SEGUIR:
${plan.outline.map(s => `## ${s.secao}\n${s.pontos.map(p => `  - ${p}`).join('\n')}`).join('\n\n')}

BANCO DE FATOS (USE APENAS ESTES — não invente dados):
${fatosFormatados}

REGRAS CRÍTICAS:
- Use APENAS os fatos acima; ao citar um dado, mencione a fonte entre parênteses ou como hiperlink
- Jamais invente estatísticas, datas ou citações
- Cada seção deve ter pelo menos 2 parágrafos
- Tom: consultivo, baseado em dados, sem promessas exageradas
- CTA deve ser específico e relevante ao público
- Legenda para redes sociais: 3 parágrafos curtos, máximo 800 caracteres

Responda SOMENTE com JSON válido (sem markdown no envelope — o corpo das seções pode ter markdown):
{
  "titulo": "${plan.titulo}",
  "subtitulo": "${plan.subtitulo}",
  "secoes": [
    {
      "heading": "Nome da seção",
      "corpo": "Texto completo da seção em markdown. **negrito**, listas etc."
    }
  ],
  "cta": "Chamada para ação final do artigo",
  "legendaRedes": "Legenda para publicar no LinkedIn / Instagram junto ao link do artigo",
  "hashtags": "#tag1 #tag2 #tag3 #tag4 #tag5"
}`,
    }],
  });
  const txt = msg.content.find(b => b.type === 'text');
  if (!txt || txt.type !== 'text') throw new Error('Redator não retornou texto');
  return extrairJSON<ArticleDraft>(txt.text);
}

// 4. Revisor — Haiku: checa qualidade e fontes; faz 1 autocorreção se necessário
export async function revisarArtigo(
  draft: ArticleDraft,
  research: ArticleResearch,
  perfil?: BrandProfile | null,
): Promise<ArticleQA> {
  const system = await getSystemPrompt(perfil);
  const fontesDisponiveis = research.fatos.map(f => f.fonte).join('\n');

  async function rodarRevisao(rascunho: ArticleDraft, tentativa: number): Promise<ArticleQA> {
    const msg = await anthropic.messages.create({
      model: getModel('article_qa'),
      max_tokens: 4096,
      system,
      messages: [{
        role: 'user',
        content: `Você é o Revisor de um pipeline de redação de artigos.
Analise o rascunho abaixo e verifique a qualidade e conformidade.

FONTES DISPONÍVEIS (todas as fontes legítimas para usar):
${fontesDisponiveis}

RASCUNHO:
Título: ${rascunho.titulo}
Subtítulo: ${rascunho.subtitulo}
${rascunho.secoes.map(s => `## ${s.heading}\n${s.corpo}`).join('\n\n')}
CTA: ${rascunho.cta}

CHECKLIST DE REVISÃO:
1. Algum número, estatística ou dado aparece SEM estar vinculado a uma das fontes acima?
2. Alguma afirmação parece inventada (não rastreável às fontes)?
3. O artigo tem CTA claro?
4. O tom é coerente com um profissional de seguros em Orlando?
5. Há conteúdo de baixa qualidade, filler ou repetição?

SE aprovado: retorne "aprovado": true e "issues": []
SE reprovado: retorne "aprovado": false, liste os issues E retorne uma versão corrigida do rascunho

Responda SOMENTE com JSON válido (sem markdown):
{
  "aprovado": true,
  "issues": [],
  "retryCount": ${tentativa},
  "draftCorrigido": null
}

OU se reprovado:
{
  "aprovado": false,
  "issues": ["Seção X cita dado Y sem fonte", "..."],
  "retryCount": ${tentativa},
  "draftCorrigido": {
    "titulo": "...",
    "subtitulo": "...",
    "secoes": [{ "heading": "...", "corpo": "..." }],
    "cta": "...",
    "legendaRedes": "...",
    "hashtags": "..."
  }
}`,
      }],
    });
    const txt = msg.content.find(b => b.type === 'text');
    if (!txt || txt.type !== 'text') throw new Error('Revisor não retornou texto');
    return extrairJSON<ArticleQA>(txt.text);
  }

  const resultado = await rodarRevisao(draft, 0);

  // Se reprovado e há draft corrigido, aceita a correção e registra retryCount=1
  if (!resultado.aprovado && resultado.draftCorrigido) {
    const segundaRevisao = await rodarRevisao(resultado.draftCorrigido, 1);
    return {
      ...segundaRevisao,
      retryCount: 1,
      // preserva os issues originais mesmo se a segunda passar
      issues: resultado.issues,
    };
  }

  return resultado;
}

export async function gerarRoteiroDeVideo(
  brief: string,
  perfil?: BrandProfile | null,
): Promise<VideoScript> {
  const system = await getSystemPrompt(perfil);
  const msg = await anthropic.messages.create({
    model: getModel('video_script'),
    max_tokens: 1500,
    system,
    messages: [{
      role: 'user',
      content: `Crie um roteiro para vídeo curto (Reels/TikTok/Shorts) baseado no brief abaixo.

Brief: """${brief}"""

Responda SOMENTE com JSON válido neste formato exato (sem markdown):
{
  "titulo": "título do vídeo",
  "canal": "reels",
  "duracao": "30s",
  "gancho": "Frase de abertura ou ação visual nos primeiros 3s — deve prender imediatamente",
  "pontos": [
    "0-10s: [o que dizer/mostrar]",
    "10-20s: [o que dizer/mostrar]",
    "20-30s: [o que dizer/mostrar]"
  ],
  "cta": "O que o espectador deve fazer ao final (seguir, comentar, salvar, DM)",
  "legenda": "Caption completo para publicar junto ao vídeo, com emojis estratégicos",
  "hashtags": "#tag1 #tag2 #tag3 #tag4 #tag5",
  "musicaSugerida": "Tipo/tom de música — ex: motivacional instrumental, hip-hop suave, trending upbeat"
}

REGRAS:
- canal: escolha o mais adequado ao conteúdo: "reels" (Instagram), "tiktok" ou "shorts" (YouTube)
- duracao: escolha entre "15s", "30s", "60s" ou "90s" — baseado na complexidade do conteúdo
- gancho: deve ser a frase MAIS impactante do roteiro — é o que decide se o usuário continua assistindo
- pontos: 3 a 5 itens com tempo anotado, linguagem coloquial e direta
- Nunca invente estatísticas — use [verificar] se citar dados`,
    }],
  });
  const txt = msg.content.find(b => b.type === 'text');
  if (!txt || txt.type !== 'text') throw new Error('Resposta sem texto');
  const parsed = JSON.parse(txt.text.replace(/```json|```/g, '').trim());
  return parsed as VideoScript;
}
