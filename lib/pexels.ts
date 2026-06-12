const BASE = 'https://api.pexels.com/v1';

export type PexelsPhoto = {
  id: number;
  width: number;
  height: number;
  photographer: string;
  src: { large: string; large2x: string; medium: string; tiny: string };
  alt: string;
};

export async function buscarFotoPexels(query: string): Promise<string | null> {
  const key = process.env.PEXELS_API_KEY;
  if (!key) return null;
  try {
    const url = `${BASE}/search?query=${encodeURIComponent(query)}&per_page=1&orientation=landscape`;
    const res = await fetch(url, { headers: { Authorization: key } });
    if (!res.ok) return null;
    const data = await res.json() as { photos?: PexelsPhoto[] };
    return data.photos?.[0]?.src?.large ?? null;
  } catch {
    return null;
  }
}

export async function buscarFotosPexels(query: string, page = 1, perPage = 12): Promise<{
  photos: PexelsPhoto[];
  totalResults: number;
  nextPage: number | null;
}> {
  const key = process.env.PEXELS_API_KEY;
  if (!key) return { photos: [], totalResults: 0, nextPage: null };
  try {
    const url = `${BASE}/search?query=${encodeURIComponent(query)}&per_page=${perPage}&page=${page}&orientation=landscape`;
    const res = await fetch(url, { headers: { Authorization: key } });
    if (!res.ok) return { photos: [], totalResults: 0, nextPage: null };
    const data = await res.json() as { photos: PexelsPhoto[]; total_results: number; next_page?: string };
    return {
      photos: data.photos ?? [],
      totalResults: data.total_results ?? 0,
      nextPage: data.next_page ? page + 1 : null,
    };
  } catch {
    return { photos: [], totalResults: 0, nextPage: null };
  }
}
