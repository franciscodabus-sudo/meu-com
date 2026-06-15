import { db } from './db';
import { lerRadar, isTituloLixo } from './rss';
import { gerarPostDoRadar, getModel, BrandProfile } from './claude';
import { buscarFotoPexels } from './pexels';
import { proximoSlot } from './cadencia';
import Anthropic from '@anthropic-ai/sdk';

const VALID_CHANNELS = ['instagram', 'facebook', 'linkedin'];
const VALID_STAGES   = ['atrair', 'educar', 'conectar', 'converter'];

// ---------- helpers de configuração ----------

export async function getSetting(key: string, fallback: string): Promise<string> {
  try {
    const s = await db.setting.findUnique({ where: { key } });
    return s?.value ?? fallback;
  } catch {
    return fallback;
  }
}

export async function setSetting(key: string, value: string): Promise<void> {
  await db.setting.upsert({
    where:  { key },
    create: { key, value },
    update: { value },
  });
}

// ---------- avaliação de relevância por IA ----------

async function avaliarRelevancia(
  item: { title: string; summary?: string | null },
  perfil: Pick<BrandProfile, 'displayName' | 'publicoAlvo' | 'produtos' | 'objetivo'>
): Promise<number> {
  try {
    const anthropic = new Anthropic();
    const msg = await anthropic.messages.create({
      model: getModel('radar_filter'),
      max_tokens: 50,
      messages: [{
        role: 'user',
        content: `Avalie a relevância desta notícia para o perfil a seguir. Responda APENAS com um número inteiro de 0 a 100.

Perfil: ${perfil.displayName}
${perfil.publicoAlvo ? `Público: ${perfil.publicoAlvo}` : ''}
${perfil.produtos ? `Produtos: ${perfil.produtos}` : ''}
${perfil.objetivo ? `Objetivo: ${perfil.objetivo}` : ''}

Notícia: "${item.title}"
${item.summary ? `Resumo: ${item.summary}` : ''}

IMPORTANTE: Se a notícia for vaga de emprego, recrutamento, contratação, "we are hiring", "join our team", ou qualquer oportunidade de trabalho, retorne 0 obrigatoriamente.

Relevância (0-100):`,
      }],
    });
    const txt = msg.content.find(b => b.type === 'text');
    if (!txt || txt.type !== 'text') return 50;
    const num = parseInt(txt.text.trim().replace(/[^\d]/g, ''), 10);
    return isNaN(num) ? 50 : Math.min(100, Math.max(0, num));
  } catch {
    return 50; // fallback: assume relevante
  }
}

// ---------- lógica principal ----------

export type AutoResult = {
  novosItens: number;
  postsGerados: number;
  erros: string[];
  rodarEm: string | null;
};

export async function executarRadarAuto(): Promise<AutoResult> {
  const erros: string[] = [];

  if (!process.env.ANTHROPIC_API_KEY) {
    return { novosItens: 0, postsGerados: 0, erros: ['ANTHROPIC_API_KEY não configurada'], rodarEm: null };
  }

  // Perfis com radar ativo — cada um tem suas próprias fontes
  let perfisRadar = await db.brandProfile.findMany({
    where: { radarAtivo: true, pausado: false },
  });
  if (perfisRadar.length === 0) {
    const ativo = await db.brandProfile.findFirst({ where: { ativo: true } });
    if (ativo) perfisRadar = [ativo];
  }

  if (perfisRadar.length === 0) {
    return { novosItens: 0, postsGerados: 0, erros: ['Nenhum perfil ativo'], rodarEm: null };
  }

  const maxPosts = parseInt(await getSetting('radarMaxPostsPerRun', '2'), 10);
  const horariosJson = await getSetting('publicacaoHorarios', '["09:00","14:00","19:00"]');
  const horariosConfig: string[] = JSON.parse(horariosJson);
  let novosItens = 0;
  let postsGerados = 0;

  // Para cada perfil: busca suas fontes, coleta itens, avalia, gera posts
  for (const perfil of perfisRadar) {
    const fontesDoPerfil = await db.radarSource.findMany({
      where: { active: true, profileId: perfil.id },
    });
    if (fontesDoPerfil.length === 0) continue;

    // 1. Coleta entradas das fontes deste perfil
    const itens = await lerRadar(perfil.id);

    // 2. Salva novos itens vinculados a este perfil
    const novos: { id: string; title: string; summary: string | null; sourceName: string | null; sourceUrl: string | null }[] = [];
    for (const item of itens) {
      if (isTituloLixo(item.title)) continue;
      const existe = await db.radarItem.findFirst({ where: { title: item.title, profileId: perfil.id } });
      if (!existe) {
        const criado = await db.radarItem.create({
          data: { kind: 'noticia', ...item, profileId: perfil.id },
        });
        novos.push(criado);
        novosItens++;
      }
    }

    // 3. Para cada item novo: avalia relevância com DNA do perfil e gera post
    for (const item of novos.slice(0, maxPosts)) {
      try {
        const relevancia = await avaliarRelevancia(item, perfil as BrandProfile);
        if (relevancia < 60) continue;

        const post = await gerarPostDoRadar(item, perfil as BrandProfile);
        const mediaUrl = await buscarFotoPexels(post.imageQuery ?? '');

        const channel  = VALID_CHANNELS.find(c => post.channel?.toLowerCase().includes(c)) ?? 'instagram';
        const stage    = VALID_STAGES.find(s => post.stage?.toLowerCase().includes(s)) ?? 'atrair';
        const hashtags = Array.isArray(post.hashtags) ? post.hashtags.join(' ') : (post.hashtags ?? '');

        const slotSugerido = proximoSlot(horariosConfig);

        const campaign = await db.campaign.create({
          data: {
            name:  `Radar: ${item.title.slice(0, 40)}`,
            brief: `Auto-gerado do radar: ${item.title} [${perfil.displayName}]`,
          },
        });

        await db.post.create({
          data: {
            campaignId: campaign.id,
            profileId:  perfil.id,
            channel, format: post.format ?? 'post', stage,
            title: post.title, caption: post.caption, hashtags,
            whyNow: post.whyNow, mediaUrl, status: 'pending',
            scheduledAt: slotSugerido ?? undefined,
          },
        });

        await db.radarItem.update({ where: { id: item.id }, data: { usedAt: new Date() } });
        postsGerados++;
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        erros.push(`"${item.title.slice(0, 50)}" [${perfil.displayName}]: ${msg}`);
      }
    }
  }

  const agora = new Date();
  await setSetting('lastAutoRadarAt', agora.toISOString());
  await setSetting('lastAutoResult', JSON.stringify({ novosItens, postsGerados, erros }));

  const intervalHoras = parseFloat(await getSetting('radarIntervalHoras', '6'));
  const rodarEm = intervalHoras > 0
    ? new Date(agora.getTime() + intervalHoras * 3_600_000).toISOString()
    : null;

  return { novosItens, postsGerados, erros, rodarEm };
}
