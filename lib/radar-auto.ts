import { db } from './db';
import { lerRadar, isTituloLixo } from './rss';
import { gerarPostDoRadar } from './claude';
import { buscarFotoPexels } from './pexels';

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

// ---------- lógica principal ----------

export type AutoResult = {
  novosItens: number;
  postsGerados: number;
  erros: string[];
  rodarEm: string | null; // ISO — próxima execução
};

export async function executarRadarAuto(): Promise<AutoResult> {
  const erros: string[] = [];

  if (!process.env.ANTHROPIC_API_KEY) {
    return { novosItens: 0, postsGerados: 0, erros: ['ANTHROPIC_API_KEY não configurada'], rodarEm: null };
  }

  const fontes = await db.radarSource.findMany({ where: { active: true } });
  if (fontes.length === 0) {
    return { novosItens: 0, postsGerados: 0, erros: ['Nenhuma fonte de radar ativa'], rodarEm: null };
  }

  // 1. Busca itens dos RSS
  const itens = await lerRadar();

  // 2. Salva apenas os novos (que passem no filtro de qualidade)
  let novosItens = 0;
  const novos: { id: string; title: string; summary: string | null; sourceName: string | null; sourceUrl: string | null }[] = [];

  for (const item of itens) {
    if (isTituloLixo(item.title)) continue;
    // Não re-adiciona item já existente (mesmo deletado)
    const existe = await db.radarItem.findFirst({ where: { title: item.title } });
    if (!existe) {
      const criado = await db.radarItem.create({ data: { kind: 'noticia', ...item } });
      novos.push(criado);
      novosItens++;
    }
  }

  // 3. Gera posts para os N melhores itens novos
  const maxPosts = parseInt(await getSetting('radarMaxPostsPerRun', '2'), 10);
  let postsGerados = 0;

  for (const item of novos.slice(0, maxPosts)) {
    try {
      const post = await gerarPostDoRadar(item);
      const mediaUrl = await buscarFotoPexels(post.imageQuery ?? '');

      const channel  = VALID_CHANNELS.find(c => post.channel?.toLowerCase().includes(c)) ?? 'instagram';
      const stage    = VALID_STAGES.find(s => post.stage?.toLowerCase().includes(s)) ?? 'atrair';
      const hashtags = Array.isArray(post.hashtags) ? post.hashtags.join(' ') : (post.hashtags ?? '');

      const campaign = await db.campaign.create({
        data: { name: `Radar: ${item.title.slice(0, 40)}`, brief: `Auto-gerado do radar: ${item.title}` },
      });

      await db.post.create({
        data: {
          campaignId: campaign.id,
          channel, format: post.format ?? 'post', stage,
          title: post.title, caption: post.caption, hashtags,
          whyNow: post.whyNow, mediaUrl, status: 'pending',
        },
      });

      await db.radarItem.update({ where: { id: item.id }, data: { usedAt: new Date() } });
      postsGerados++;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      erros.push(`"${item.title.slice(0, 50)}": ${msg}`);
    }
  }

  // 4. Registra última execução e calcula próxima
  const agora = new Date();
  await setSetting('lastAutoRadarAt', agora.toISOString());
  await setSetting('lastAutoResult', JSON.stringify({ novosItens, postsGerados, erros }));

  const intervalHoras = parseFloat(await getSetting('radarIntervalHoras', '6'));
  const rodarEm = intervalHoras > 0
    ? new Date(agora.getTime() + intervalHoras * 3_600_000).toISOString()
    : null;

  return { novosItens, postsGerados, erros, rodarEm };
}
