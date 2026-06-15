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
  | 'radar_filter'    // triagem de relevância — Haiku
  | 'radar_post'      // gerar post a partir de notícia — Sonnet
  | 'brief_post'      // gerar post a partir de brief — Opus
  | 'campaign_plan'   // plano de campanha completo — Opus
  | 'chat_cmo'        // responder pergunta no painel — Sonnet
  | 'quality_check';  // verificar [verificar] e dados suspeitos — Haiku

export function getModel(task: ModelTask): string {
  const forced = process.env.FORCE_MODEL?.trim();
  const auto = (): string => {
    switch (task) {
      case 'radar_filter':  return MODELS.fast;
      case 'quality_check': return MODELS.fast;
      case 'radar_post':    return MODELS.balanced;
      case 'chat_cmo':      return MODELS.balanced;
      case 'brief_post':    return MODELS.powerful;
      case 'campaign_plan': return MODELS.powerful;
      default:              return MODELS.balanced;
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
  channel: 'instagram' | 'facebook' | 'linkedin';
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
- channel: APENAS uma destas strings exatas: "instagram", "facebook", "linkedin"
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
): Promise<GeneratedPost> {
  const system = await getSystemPrompt(perfil);
  const msg = await anthropic.messages.create({
    model: getModel('radar_post'),
    max_tokens: 1200,
    system,
    messages: [{
      role: 'user',
      content: `Notícia detectada pelo Radar:
Título: "${item.title}"
Resumo: "${item.summary ?? 'sem resumo'}"
Fonte: ${item.sourceName ?? 'desconhecida'}

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
): Promise<GeneratedPost[]> {
  const system = await getSystemPrompt(perfil);
  const msg = await anthropic.messages.create({
    model: getModel('brief_post'),
    max_tokens: 2500,
    system,
    messages: [{
      role: 'user',
      content: `Brief do cliente: """${brief}"""

Gere ${quantidade} posts seguindo a jornada (atrair -> educar -> conectar -> converter).
${FORMATO_JSON}`,
    }],
  });
  const text = msg.content.find(b => b.type === 'text');
  if (!text || text.type !== 'text') throw new Error('Resposta sem texto');
  return parsePosts(text.text);
}
