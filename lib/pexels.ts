export async function buscarFotoPexels(query: string): Promise<string | null> {
  const key = process.env.PEXELS_API_KEY;
  if (!key) return null;

  try {
    const url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=1&orientation=landscape`;
    const res = await fetch(url, { headers: { Authorization: key } });
    if (!res.ok) return null;
    const data = await res.json() as { photos?: { src?: { large?: string } }[] };
    return data.photos?.[0]?.src?.large ?? null;
  } catch {
    return null;
  }
}
