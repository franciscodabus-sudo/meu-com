const BUCKET = 'uploads';

export async function uploadToStorage(
  buffer: Buffer,
  filename: string,
  contentType: string,
): Promise<string> {
  const baseUrl = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY;
  if (!baseUrl || !key) throw new Error('SUPABASE_URL ou SUPABASE_SERVICE_KEY não configurados');

  const res = await fetch(`${baseUrl}/storage/v1/object/${BUCKET}/${filename}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': contentType,
      'x-upsert': 'true',
    },
    body: buffer as unknown as BodyInit,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Falha no upload de mídia: ${text}`);
  }

  return `${baseUrl}/storage/v1/object/public/${BUCKET}/${filename}`;
}
