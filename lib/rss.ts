import Parser from 'rss-parser';
import { db } from './db';

const parser = new Parser();

export type RadarEntry = {
  title: string; summary?: string;
  sourceUrl?: string; sourceName?: string;
};

// ── Padrões de lixo (camada a) ────────────────────────────────────────────────

const JUNK_PHRASES = [
  // autenticação / contas
  'sign in', 'log in', 'log out', 'login', 'logout',
  'create account', 'free account', 'register now', 'sign up',
  'authentication', 'password', 'forgot password', 'reset password',
  // marketing / assinatura
  'subscribe', 'subscription', 'newsletter', 'set a search alert', 'search alert',
  // privacidade / legal
  'cookie', 'privacy policy', 'terms of service', 'terms and conditions',
  // bloqueio / CAPTCHA
  'enable javascript', 'verify you are human', 'i am not a robot', 'captcha',
  'access denied', 'forbidden', 'cloudflare', 'ddos protection',
  'please wait', 'just a moment', 'checking your browser',
  // navegação de site
  'contact us', 'connect with us', 'about us', 'rss feed', 'rss feeds',
  'browse rss', 'home ::', ':: home', 'newswire',
];

// Chaves técnicas tipo "Authentication.SignIn.HeadSignInHeader"
const DOT_KEY_RE = /^[A-Z][a-zA-Z]+(\.[A-Z][a-zA-Z]+){2,}$/;

// Apenas nome próprio (1-3 palavras, todas com inicial maiúscula, sem verbos)
const AUTHOR_NAME_RE = /^([A-Z][a-z]+\s){1,2}[A-Z][a-z]+$/;

// Remove "- Source Name" do final do título antes de avaliar o conteúdo real
function titleSemFonte(t: string): string {
  return t.replace(/\s+-\s+[^-]{1,60}$/, '').trim();
}

export function isTituloLixo(title: string): boolean {
  const t = title.trim();
  if (!t || t === '(sem título)') return true;

  // Remove atribuição de fonte antes de avaliar ("... - Gallagher Bassett")
  const limpo = titleSemFonte(t);

  // Menos de 5 palavras no título limpo — muito curto para ser notícia real
  if (limpo.split(/\s+/).length < 5) return true;

  // Chave técnica dot-notation
  if (DOT_KEY_RE.test(limpo)) return true;

  // Parece nome de autor (ex: "Charles Sowers", "Benjamin Gilbert")
  if (AUTHOR_NAME_RE.test(limpo)) return true;

  const lower = t.toLowerCase();

  // Frases de lixo conhecidas
  if (JUNK_PHRASES.some(p => lower.includes(p))) return true;

  // Começa com ponto, barra, parêntese — artefato de HTML
  if (/^[./()\[{]/.test(t)) return true;

  return false;
}

// ── Detecção de CAPTCHA / bloqueio (camada c) ─────────────────────────────────

const CAPTCHA_PHRASES = [
  'verify you are human',
  'please verify',
  'i am not a robot',
  'enable javascript and cookies',
  'ddos protection by cloudflare',
  'access denied',
  'ray id',           // Cloudflare
  'just a moment',    // Cloudflare
  'checking your browser',
];

export function isRespostaBloqueada(html: string, status: number): boolean {
  if (status === 403 || status === 429) return true;
  const lower = html.toLowerCase().slice(0, 4000);
  return CAPTCHA_PHRASES.some(p => lower.includes(p));
}

// ── Google News RSS como fallback ────────────────────────────────────────────

export function googleNewsRssUrl(siteUrl: string): string {
  try {
    const { hostname } = new URL(siteUrl);
    const domain = hostname.replace(/^www\./, '');
    return `https://news.google.com/rss/search?q=site:${domain}&hl=en-US&gl=US&ceid=US:en`;
  } catch {
    return '';
  }
}

// ── Leitores ─────────────────────────────────────────────────────────────────

export async function lerFeedRSS(url: string): Promise<RadarEntry[]> {
  const feed = await parser.parseURL(url);
  return feed.items
    .slice(0, 10)
    .map(item => ({
      title:      item.title ?? '(sem título)',
      summary:    item.contentSnippet?.slice(0, 200),
      sourceUrl:  item.link,
      sourceName: feed.title,
    }))
    .filter(entry => !isTituloLixo(entry.title));
}

export async function detectarRSSDoSite(pageUrl: string): Promise<string | null> {
  const res = await fetch(pageUrl, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; MeuCMO/1.0)' },
    signal: AbortSignal.timeout(8000),
  });
  const html = await res.text();

  if (isRespostaBloqueada(html, res.status)) return null;

  const match = html.match(/<link[^>]+type=["']application\/(rss|atom)\+xml["'][^>]*href=["']([^"']+)["']/i)
    ?? html.match(/<link[^>]+href=["']([^"']+)["'][^>]+type=["']application\/(rss|atom)\+xml["']/i);
  if (match) {
    const href = match[match.length - 2] || match[match.length - 1];
    return href.startsWith('http') ? href : new URL(href, pageUrl).toString();
  }
  for (const suffix of ['/feed', '/rss', '/rss.xml', '/atom.xml', '/feed.xml']) {
    try {
      const candidate = new URL(suffix, pageUrl).toString();
      await parser.parseURL(candidate);
      return candidate;
    } catch { /* não é RSS */ }
  }
  return null;
}

type ColetaResult = {
  entries: RadarEntry[];
  bloqueada: boolean;
  rssDescoberto?: string;
  junkCount: number;
  totalColetado: number;
};

async function coletarFonte(url: string, kind: string, name: string): Promise<ColetaResult> {
  if (kind === 'rss') {
    try {
      const feed = await parser.parseURL(url);
      const todos = feed.items.slice(0, 10).map(item => ({
        title:      item.title ?? '(sem título)',
        summary:    item.contentSnippet?.slice(0, 200),
        sourceUrl:  item.link,
        sourceName: name || feed.title,
      }));
      const limpos = todos.filter(e => !isTituloLixo(e.title));
      return {
        entries: limpos,
        bloqueada: false,
        junkCount: todos.length - limpos.length,
        totalColetado: todos.length,
      };
    } catch {
      return { entries: [], bloqueada: false, junkCount: 0, totalColetado: 0 };
    }
  }

  // kind === 'website' — tenta descobrir RSS primeiro
  try {
    const rssUrl = await detectarRSSDoSite(url);
    if (rssUrl) {
      const entries = await lerFeedRSS(rssUrl);
      return { entries, bloqueada: false, rssDescoberto: rssUrl, junkCount: 0, totalColetado: entries.length };
    }
  } catch { /* segue */ }

  // Tenta via HTTPS diretamente para detectar CAPTCHA
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; MeuCMO/1.0)' },
      signal: AbortSignal.timeout(8000),
    });
    const html = await res.text();
    if (isRespostaBloqueada(html, res.status)) {
      return { entries: [], bloqueada: true, junkCount: 0, totalColetado: 0 };
    }
  } catch { /* sem acesso */ }

  // Fallback: Google News RSS
  const gnUrl = googleNewsRssUrl(url);
  if (gnUrl) {
    try {
      const entries = await lerFeedRSS(gnUrl);
      if (entries.length > 0) {
        return { entries, bloqueada: false, rssDescoberto: gnUrl, junkCount: 0, totalColetado: entries.length };
      }
    } catch { /* sem resultado */ }
  }

  return { entries: [], bloqueada: false, junkCount: 0, totalColetado: 0 };
}

// ── Teste de fonte (usado nas Configurações) ──────────────────────────────────

export type ResultadoTeste = {
  ok: boolean;
  count: number;
  rssUrl?: string;
  erro?: string;
  bloqueada?: boolean;
  googleNewsUrl?: string;
};

export async function testarFonte(url: string, kind: string, name: string): Promise<ResultadoTeste> {
  if (kind === 'instagram') {
    return { ok: false, count: 0, erro: 'Instagram não tem RSS nativo. Use rss.app para criar um feed do perfil e adicione como tipo RSS.' };
  }
  try {
    const resultado = await coletarFonte(url, kind, name);
    if (resultado.bloqueada) {
      const gnUrl = googleNewsRssUrl(url);
      return {
        ok: false, count: 0, bloqueada: true,
        erro: 'Fonte bloqueada por proteção anti-robô. Convertendo para busca de notícias automática.',
        googleNewsUrl: gnUrl,
      };
    }
    if (resultado.entries.length === 0 && resultado.totalColetado === 0) {
      return { ok: false, count: 0, erro: 'Nenhum conteúdo encontrado na fonte' };
    }
    // avisa se muita proporção de lixo
    const pctLixo = resultado.totalColetado > 0
      ? resultado.junkCount / resultado.totalColetado
      : 0;
    if (pctLixo > 0.5) {
      return {
        ok: false, count: resultado.entries.length,
        erro: `A maioria dos itens é conteúdo bloqueado ou de interface. Verifique a URL do feed.`,
      };
    }
    return {
      ok: true,
      count: resultado.entries.length,
      rssUrl: resultado.rssDescoberto,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { ok: false, count: 0, erro: msg.slice(0, 120) };
  }
}

// ── lerRadar (chamado pelo agendador) ─────────────────────────────────────────
// Retorna entradas limpas + atualiza avisos nas fontes com problemas

export async function lerRadar(): Promise<RadarEntry[]> {
  const itens: RadarEntry[] = [];
  let fontes: { id: string; url: string; kind: string; name: string }[] = [];

  try {
    fontes = await db.radarSource.findMany({ where: { active: true } });
  } catch { /* primeira run sem DB */ }

  for (const fonte of fontes) {
    try {
      const resultado = await coletarFonte(fonte.url, fonte.kind, fonte.name);

      // Detecta fonte problemática e salva aviso
      if (resultado.bloqueada) {
        const gnUrl = googleNewsRssUrl(fonte.url);
        await db.radarSource.update({
          where: { id: fonte.id },
          data: { warning: '🚫 Bloqueada por proteção anti-robô — use o feed RSS oficial ou uma busca do Google News' },
        });
        // Tenta Google News como fallback automático
        if (gnUrl) {
          try {
            const gnEntries = await lerFeedRSS(gnUrl);
            itens.push(...gnEntries);
          } catch { /* sem resultado */ }
        }
        continue;
      }

      const pctLixo = resultado.totalColetado > 0
        ? resultado.junkCount / resultado.totalColetado
        : 0;

      if (pctLixo > 0.5) {
        await db.radarSource.update({
          where: { id: fonte.id },
          data: { warning: '⚠️ Fonte com conteúdo bloqueado ou inválido — verifique a URL do feed' },
        });
      } else if (resultado.entries.length > 0) {
        // Remove aviso anterior se a fonte voltou a funcionar
        await db.radarSource.update({ where: { id: fonte.id }, data: { warning: null } });
      }

      itens.push(...resultado.entries);
    } catch { /* fonte offline: ignora */ }
  }

  // Fallback para RADAR_FEEDS do .env quando DB está vazio
  if (fontes.length === 0) {
    const feeds = (process.env.RADAR_FEEDS ?? '').split(',').map(s => s.trim()).filter(Boolean);
    for (const url of feeds) {
      try { itens.push(...await lerFeedRSS(url)); } catch { /* segue */ }
    }
  }

  return itens;
}
