import Parser from 'rss-parser';
import { db } from './db';

const parser = new Parser();

type RadarEntry = {
  title: string; summary?: string;
  sourceUrl?: string; sourceName?: string;
};

export async function lerFeedRSS(url: string): Promise<RadarEntry[]> {
  const feed = await parser.parseURL(url);
  return feed.items.slice(0, 5).map(item => ({
    title: item.title ?? '(sem título)',
    summary: item.contentSnippet?.slice(0, 200),
    sourceUrl: item.link,
    sourceName: feed.title
  }));
}

export async function detectarRSSDoSite(pageUrl: string): Promise<string | null> {
  const res = await fetch(pageUrl, { headers: { 'User-Agent': 'MeuCMO/1.0' }, signal: AbortSignal.timeout(8000) });
  const html = await res.text();
  const match = html.match(/<link[^>]+type=["']application\/(rss|atom)\+xml["'][^>]*href=["']([^"']+)["']/i)
    ?? html.match(/<link[^>]+href=["']([^"']+)["'][^>]+type=["']application\/(rss|atom)\+xml["']/i);
  if (match) {
    const href = match[match.length - 2] || match[match.length - 1];
    return href.startsWith('http') ? href : new URL(href, pageUrl).toString();
  }
  // tenta sufixos comuns
  for (const suffix of ['/feed', '/rss', '/rss.xml', '/atom.xml', '/feed.xml']) {
    try {
      const candidate = new URL(suffix, pageUrl).toString();
      await parser.parseURL(candidate);
      return candidate;
    } catch { /* não é RSS */ }
  }
  return null;
}

async function lerWebsite(url: string, name: string): Promise<RadarEntry[]> {
  try {
    const rssUrl = await detectarRSSDoSite(url);
    if (rssUrl) {
      const feed = await parser.parseURL(rssUrl);
      return feed.items.slice(0, 5).map(item => ({
        title: item.title ?? '(sem título)',
        summary: item.contentSnippet?.slice(0, 200),
        sourceUrl: item.link,
        sourceName: name || feed.title
      }));
    }
    // sem RSS detectado — extrai h-tags básicos
    const res = await fetch(url, { headers: { 'User-Agent': 'MeuCMO/1.0' }, signal: AbortSignal.timeout(8000) });
    const html = await res.text();
    const headlines: string[] = [];
    const re = /<h[123][^>]*>([^<]+)<\/h[123]>/gi;
    let m;
    while ((m = re.exec(html)) !== null && headlines.length < 5) {
      const text = m[1].replace(/&[a-z]+;/gi, ' ').trim();
      if (text.length > 15) headlines.push(text);
    }
    return headlines.map(title => ({ title, sourceName: name, sourceUrl: url }));
  } catch {
    return [];
  }
}

export type ResultadoTeste = {
  ok: boolean;
  count: number;
  rssUrl?: string;   // URL do feed descoberto quando kind === 'website'
  erro?: string;
};

export async function testarFonte(url: string, kind: string, name: string): Promise<ResultadoTeste> {
  if (kind === 'instagram') {
    return { ok: false, count: 0, erro: 'Instagram não tem RSS nativo. Use rss.app para criar um feed do perfil e adicione como tipo RSS.' };
  }
  try {
    if (kind === 'rss') {
      const items = await lerFeedRSS(url);
      return { ok: true, count: items.length };
    }
    // kind === 'website' — tenta descobrir RSS primeiro
    const rssUrl = await detectarRSSDoSite(url);
    if (rssUrl) {
      const items = await lerFeedRSS(rssUrl);
      return { ok: true, count: items.length, rssUrl };
    }
    // sem RSS — extrai headlines
    const items = await lerWebsite(url, name);
    return { ok: true, count: items.length };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { ok: false, count: 0, erro: msg.slice(0, 120) };
  }
}

export async function lerRadar(): Promise<RadarEntry[]> {
  const itens: RadarEntry[] = [];

  // 1. Fontes salvas no DB
  let fontes: { url: string; kind: string; name: string }[] = [];
  try {
    fontes = await db.radarSource.findMany({ where: { active: true } });
  } catch { /* tabela ainda não existe na primeira run */ }

  for (const fonte of fontes) {
    try {
      if (fonte.kind === 'rss') {
        itens.push(...await lerFeedRSS(fonte.url));
      } else if (fonte.kind === 'website') {
        itens.push(...await lerWebsite(fonte.url, fonte.name));
      }
      // 'instagram' não pode ser lido diretamente — ignorado (UI explica como configurar)
    } catch { /* fonte fora do ar: segue */ }
  }

  // 2. Fallback: RADAR_FEEDS do .env (caso DB vazio)
  if (fontes.length === 0) {
    const feeds = (process.env.RADAR_FEEDS ?? '').split(',').map(s => s.trim()).filter(Boolean);
    for (const url of feeds) {
      try { itens.push(...await lerFeedRSS(url)); } catch { /* segue */ }
    }
  }

  return itens;
}
