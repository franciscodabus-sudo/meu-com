// Camada de integração com serviço de publicação multicanal.
// Infraestrutura invisível — nada deste arquivo deve vazar para o front-end.
const BASE = 'https://api.ayrshare.com/api';

function headers() {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${process.env.AYRSHARE_API_KEY}`,
  };
}

// ── erros traduzidos para o usuário ────────────────────────────────────────────
const ERROS_PT: [RegExp, string][] = [
  [/requires? a media url/i,          'Este canal exige uma imagem ou vídeo'],
  [/invalid.?grant/i,                  'Autorização expirada — reconecte a conta'],
  [/token.?expired/i,                  'Token expirado — reconecte a conta'],
  [/not connected/i,                   'Conta não conectada'],
  [/rate limit/i,                      'Limite de publicações atingido — aguarde alguns minutos'],
  [/media.?upload/i,                   'Erro ao enviar a imagem'],
  [/caption.?too.?long/i,             'Legenda muito longa para este canal'],
  [/scheduled.?in.?past/i,            'Horário de agendamento já passou'],
  [/duplicate.?post/i,                 'Post idêntico já foi publicado recentemente'],
  [/account.?suspended/i,              'Conta suspensa na rede social'],
];

export function traduzirErro(raw: string): string {
  for (const [re, pt] of ERROS_PT) {
    if (re.test(raw)) return pt;
  }
  return 'Falha na publicação — verifique a conexão da conta';
}

// ── publicação ──────────────────────────────────────────────────────────────────

type PublishInput = {
  caption: string;
  platforms: string[];
  mediaUrls?: string[];
  scheduleDate?: string; // ISO — omitir = publica agora
  mediaFeedType?: 'story' | 'feed'; // Instagram: 'story' ou 'feed' (padrão)
};

export async function publicar(input: PublishInput) {
  const body: Record<string, unknown> = {
    post:        input.caption,
    platforms:   input.platforms,
    mediaUrls:   input.mediaUrls,
    scheduleDate: input.scheduleDate,
  };

  // Stories do Instagram — Ayrshare usa instagramOptions.mediaFeedType
  if (input.mediaFeedType === 'story' && input.platforms.includes('instagram')) {
    body.instagramOptions = { mediaFeedType: 'story' };
  }

  const res = await fetch(`${BASE}/post`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(traduzirErro(await res.text()));
  return res.json();
}

export async function deletarPublicacao(id: string) {
  const res = await fetch(`${BASE}/post`, {
    method: 'DELETE',
    headers: headers(),
    body: JSON.stringify({ id }),
  });
  if (!res.ok) throw new Error(traduzirErro(await res.text()));
  return res.json();
}

// ── perfil e canais conectados ──────────────────────────────────────────────────

export type PerfilCanal = {
  platform: string;
  username?: string;
  displayName?: string;
  avatarUrl?: string;
  status: 'connected' | 'error' | 'disconnected';
  error?: string;
};

export async function buscarCanais(): Promise<PerfilCanal[]> {
  const res = await fetch(`${BASE}/user`, {
    headers: headers(),
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json() as {
    activeSocialAccounts?: string[];
    displayNames?: {
      platform: string;
      username?: string;
      displayName?: string;
      userImage?: string;
    }[];
  };

  const ativos = data.activeSocialAccounts ?? [];
  const displayMap = new Map((data.displayNames ?? []).map(d => [d.platform, d]));

  return ativos.map(platform => {
    const d = displayMap.get(platform);
    return {
      platform,
      username:    d?.username,
      displayName: d?.displayName,
      avatarUrl:   d?.userImage || undefined,
      status:      'connected',
    } satisfies PerfilCanal;
  });
}

// ── histórico de posts ──────────────────────────────────────────────────────────

export type HistoricoItem = {
  id: string;
  caption: string;
  platforms: string[];
  createdAt: string;
  status: { platform: string; status: string; postUrl?: string; error?: string }[];
};

export async function buscarHistorico(limit = 20): Promise<HistoricoItem[]> {
  const res = await fetch(`${BASE}/post/history?limit=${limit}`, {
    headers: headers(),
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json() as {
    history?: {
      id: string;
      post: string;
      platforms?: string[];
      created?: string;
      status?: { platform: string; status: string; postUrl?: string; errors?: string }[];
    }[];
  };

  return (data.history ?? []).map(h => ({
    id: h.id,
    caption: h.post ?? '',
    platforms: h.platforms ?? [],
    createdAt: h.created ?? '',
    status: (h.status ?? []).map(s => ({
      platform: s.platform,
      status:   s.status,
      postUrl:  s.postUrl,
      error:    s.errors ? traduzirErro(s.errors) : undefined,
    })),
  }));
}

// ── canais ativos (fonte de verdade para geração de posts) ────────────────────
// Retorna plataformas conectadas. null = chave não configurada ou erro de rede → sem restrição.
// [] = chave válida mas nenhum canal conectado → bloquear geração.
export async function buscarCanaisAtivos(): Promise<string[] | null> {
  if (!process.env.AYRSHARE_API_KEY) return null;
  try {
    const contas = await buscarCanais();
    return contas.filter(c => c.status === 'connected').map(c => c.platform);
  } catch {
    return null; // falha de rede → não bloquear geração
  }
}

// ── verificação de existência de post ──────────────────────────────────────────
// Retorna 'deletado' se o post não existe mais no Ayrshare,
// 'existe' se ainda está lá, 'incerto' em caso de erro de rede/auth.
export async function verificarStatusPost(id: string): Promise<'existe' | 'deletado' | 'incerto'> {
  try {
    const res = await fetch(`${BASE}/post?id=${encodeURIComponent(id)}`, {
      headers: headers(),
      cache: 'no-store',
    });
    if (res.status === 400 || res.status === 404) return 'deletado';
    if (!res.ok) return 'incerto';
    const data = await res.json() as Record<string, unknown>;
    if (data?.status === 'error') return 'deletado';
    return 'existe';
  } catch {
    return 'incerto';
  }
}

// ── painel de gerenciamento de contas ─────────────────────────────────────────
// Fase atual: direciona o usuário para conectar no painel web.
// Fase 3: white-label via Ayrshare Business (OAuth embutido no app).
export const AYRSHARE_DASHBOARD_URL = 'https://app.ayrshare.com';
