import { NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { db } from '@/lib/db';

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

    const dir = join(process.cwd(), 'public', 'uploads');
    await mkdir(dir, { recursive: true });

    const nome = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const caminho = join(dir, nome);
    await writeFile(caminho, Buffer.from(await file.arrayBuffer()));

    const url = `/uploads/${nome}`;
    const kind = ['mp4', 'mov'].includes(ext) ? 'video' : 'foto';

    const asset = await db.mediaAsset.create({
      data: { url, kind, source: 'upload', tags: file.name },
    });

    return NextResponse.json(asset, { status: 201 });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Erro' }, { status: 500 });
  }
}
