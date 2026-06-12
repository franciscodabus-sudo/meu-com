// Publicação multicanal via Ayrshare (IG + FB + LinkedIn com uma chave).
// Docs: https://www.ayrshare.com/docs
const BASE = 'https://api.ayrshare.com/api';

type PublishInput = {
  caption: string;
  platforms: string[];      // ['instagram','facebook','linkedin']
  mediaUrls?: string[];
  scheduleDate?: string;    // ISO; omitir = publica agora
};

export async function publicar(input: PublishInput) {
  const res = await fetch(`${BASE}/post`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.AYRSHARE_API_KEY}`
    },
    body: JSON.stringify({
      post: input.caption,
      platforms: input.platforms,
      mediaUrls: input.mediaUrls,
      scheduleDate: input.scheduleDate
    })
  });
  if (!res.ok) throw new Error(`Ayrshare ${res.status}: ${await res.text()}`);
  return res.json();
}

export async function deletarPublicacao(id: string) {
  const res = await fetch(`${BASE}/post`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.AYRSHARE_API_KEY}`
    },
    body: JSON.stringify({ id })
  });
  if (!res.ok) throw new Error(`Ayrshare DELETE ${res.status}: ${await res.text()}`);
  return res.json();
}
