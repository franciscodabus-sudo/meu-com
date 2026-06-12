import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic(); // usa ANTHROPIC_API_KEY do .env

const SYSTEM_CMO = `Você é o CMO pessoal de Francisco Dabus, com base em Orlando, FL.
Francisco atua em múltiplas frentes: seguros (licença 2-15), real estate, consultoria (ZYON Group)
e empreendedorismo. Público: brasileiros e latinos na Flórida + mercado americano local.
Tom: consultivo, direto, caloroso, sem juridiquês. Idiomas: PT-BR como padrão; EN quando fizer sentido.

Sua função: transformar um brief ou notícia em posts prontos para redes sociais sobre QUALQUER tema
que Francisco queira abordar — seguros, imóveis, negócios, mercado, culinária, lifestyle, etc.
Adapte o ângulo e a voz ao tema do brief sem forçar menção à área de seguros.

REGRAS:
- Nunca invente estatísticas; se citar dado, marque como [verificar].
- Todo post tem: gancho forte na 1ª linha, corpo curto, CTA claro (DM, salvar, comentar).
- Hashtags locais e de nicho (5 a 8), sem hashtags genéricas inúteis.
- Nunca adicione assinatura, cargo, nome da empresa ou byline ao texto do post.
- Responda SOMENTE com JSON válido, sem markdown, sem comentários.`;

export type GeneratedPost = {
  channel: 'instagram' | 'facebook' | 'linkedin';
  format: string;
  stage: 'atrair' | 'educar' | 'conectar' | 'converter';
  title: string;
  caption: string;
  hashtags: string;
  whyNow: string;
  scheduledHint: string;
  imageQuery: string; // 2-3 palavras em inglês para buscar foto no Pexels
};

const FORMATO_JSON = `
FORMATO OBRIGATÓRIO (JSON puro, sem markdown):
{"posts":[{"channel":"instagram","format":"post","stage":"atrair","title":"...","caption":"...","hashtags":"#tag1 #tag2 #tag3","whyNow":"...","scheduledHint":"seg 18:00","imageQuery":"family home florida"}]}

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

export async function gerarPostDoRadar(item: {
  title: string; summary?: string | null;
  sourceName?: string | null; sourceUrl?: string | null;
}): Promise<GeneratedPost> {
  const msg = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1200,
    system: SYSTEM_CMO,
    messages: [{
      role: 'user',
      content: `Notícia detectada pelo Radar:
Título: "${item.title}"
Resumo: "${item.summary ?? 'sem resumo'}"
Fonte: ${item.sourceName ?? 'desconhecida'}

Gere 1 post aproveitando esta notícia para posicionar Francisco como referência no tema.
${FORMATO_JSON}`
    }]
  });
  const text = msg.content.find(b => b.type === 'text');
  if (!text || text.type !== 'text') throw new Error('Resposta sem texto');
  return parsePosts(text.text)[0];
}

export async function gerarPostsDoBrief(brief: string, quantidade = 3): Promise<GeneratedPost[]> {
  const msg = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 2500,
    system: SYSTEM_CMO,
    messages: [{
      role: 'user',
      content: `Brief do cliente: """${brief}"""

Gere ${quantidade} posts seguindo a jornada (atrair -> educar -> conectar -> converter).
${FORMATO_JSON}`
    }]
  });

  const text = msg.content.find(b => b.type === 'text');
  if (!text || text.type !== 'text') throw new Error('Resposta sem texto');
  return parsePosts(text.text);
}
