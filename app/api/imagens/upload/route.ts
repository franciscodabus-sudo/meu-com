import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { uploadToStorage } from '@/lib/storage';
import sharp from 'sharp';

const IMAGE_EXTS = ['jpg', 'jpeg', 'png', 'webp'];

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const file = form.get('file') as File | null;
    if (!file) return NextResponse.json({ error: 'Arquivo não enviado' }, { status: 400 });

    const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg';
    const allowed = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'mp4', 'mov'];
    if (!allowed.includes(ext)) {
      return NextResponse.json({ error: 'Formato não suportado' }, { status: 400 });
    }

    // Imagens: aplica rotação EXIF antes de salvar, para que o Ayrshare
    // (e qualquer outro serviço headless) veja a orientação correta nos pixels.
    // Fotos de celular chegam com EXIF Orientation ≠ 1 — sem isso aparecem
    // giradas no Instagram mesmo parecendo corretas no browser.
    const rawBuffer = Buffer.from(await file.arrayBuffer());
    let finalBuffer: Buffer;
    let finalExt: string;
    let contentType: string;
    if (IMAGE_EXTS.includes(ext)) {
      finalBuffer = await sharp(rawBuffer)
        .rotate()
        .jpeg({ quality: 90 })
        .toBuffer();
      finalExt = 'jpg';
      contentType = 'image/jpeg';
    } else {
      finalBuffer = rawBuffer;
      finalExt = ext;
      contentType = ['mp4', 'mov'].includes(ext) ? 'video/mp4' : `image/${ext}`;
    }

    const nome = `${Date.now()}-${Math.random().toString(36).slice(2)}.${finalExt}`;
    const url = await uploadToStorage(finalBuffer, nome, contentType);
    const kind = ['mp4', 'mov'].includes(ext) ? 'video' : 'foto';

    const asset = await db.mediaAsset.create({
      data: { url, kind, source: 'upload', tags: file.name },
    });

    return NextResponse.json(asset, { status: 201 });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Erro' }, { status: 500 });
  }
}
