import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { gerarPostDoRadar } from '@/lib/claude';
import { buscarFotoPexels } from '@/lib/pexels';

// POST /api/radar/gerar  { radarItemId }
export async function POST(req: Request) {
  try {
    const { radarItemId } = await req.json();
    if (!radarItemId) return NextResponse.json({ error: 'radarItemId obrigatório' }, { status: 400 });

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json({ error: 'ANTHROPIC_API_KEY não configurada' }, { status: 500 });
    }

    const item = await db.radarItem.findUnique({ where: { id: radarItemId } });
    if (!item) return NextResponse.json({ error: 'item não encontrado' }, { status: 404 });

    const post = await gerarPostDoRadar(item);
    const mediaUrl = await buscarFotoPexels(post.imageQuery ?? '');

    const VALID_CHANNELS = ['instagram', 'facebook', 'linkedin'];
    const VALID_STAGES   = ['atrair', 'educar', 'conectar', 'converter'];
    const channel  = VALID_CHANNELS.find(c => post.channel.toLowerCase().includes(c)) ?? 'instagram';
    const stage    = VALID_STAGES.find(s => post.stage.toLowerCase().includes(s)) ?? 'atrair';
    const hashtags = Array.isArray(post.hashtags) ? post.hashtags.join(' ') : post.hashtags;

    const campaign = await db.campaign.create({
      data: { name: `Radar: ${item.title.slice(0, 40)}`, brief: `Gerado do radar: ${item.title}` }
    });

    const created = await db.post.create({
      data: {
        campaignId: campaign.id,
        channel, format: post.format, stage,
        title: post.title, caption: post.caption, hashtags,
        whyNow: post.whyNow, mediaUrl, status: 'pending'
      }
    });

    await db.radarItem.update({ where: { id: radarItemId }, data: { usedAt: new Date() } });

    return NextResponse.json({ ok: true, postId: created.id });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro desconhecido';
    console.error('[/api/radar/gerar]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
