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
};

export async function publicar(input: PublishInput) {
  const res = await fetch(`${BASE}/post`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({
      post: input.caption,
      platforms: input.platforms,
      mediaUrls: input.mediaUrls,
      scheduleDate: input.scheduleDate,
    }),
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
  const res = await fetch(`${BASE}/user`, { headers: headers() });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json() as {
    activeSocialAccounts?: string[];
    profiles?: Record<string, {
      userDetails?: {
        username?: string;
        name?: string;
        profilePicUrl?: string;
        picture?: { url?: string };
      };
      errors?: { message: string }[];
    }>;
  };

  const ativos = data.activeSocialAccounts ?? [];
  const profiles = data.profiles ?? {};

  return ativos.map(platform => {
    const p = profiles[platform];
    const det = p?.userDetails;
    const avatarUrl = det?.profilePicUrl ?? det?.picture?.url;
    const erros = p?.errors;
    return {
      platform,
      username:    det?.username,
      displayName: det?.name,
      avatarUrl,
      status: erros?.length ? 'error' : 'connected',
      error:  erros?.length ? traduzirErro(erros[0].message) : undefined,
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
  const res = await fetch(`${BASE}/post/history?limit=${limit}`, { headers: headers() });
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

// ── link de conexão OAuth ───────────────────────────────────────────────────────
// Retorna uma URL para conectar redes sociais via OAuth.
// Fase atual: abre o painel de conexão do serviço em popup.
// Fase 3: white-label via Ayrshare Business (user profiles).
export function gerarLinkConexao(): string {
  // O painel de conexão aceita a chave como query param para pré-autenticar.
  const apiKey = process.env.AYRSHARE_API_KEY ?? '';
  return apiKey
    ? `https://app.ayrshare.com/connect?apiKey=${encodeURIComponent(apiKey)}`
    : 'https://app.ayrshare.com/';
}
