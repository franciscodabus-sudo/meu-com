import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { gerarPostsDoBrief } from '@/lib/claude';
import { buscarFotoPexels } from '@/lib/pexels';

// POST /api/generate  { brief: string, campaignName?: string }
export async function POST(req: Request) {
  try {
    const { brief, campaignName } = await req.json();
    if (!brief) return NextResponse.json({ error: 'brief obrigatório' }, { status: 400 });

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { error: 'ANTHROPIC_API_KEY não configurada. Abra o arquivo .env e cole sua chave de console.anthropic.com' },
        { status: 500 }
      );
    }

    const posts = await gerarPostsDoBrief(brief);

    // Busca fotos no Pexels em paralelo; retorna null se não houver chave ou resultado
    const photos = await Promise.all(posts.map(p => buscarFotoPexels(p.imageQuery ?? '')));

    const campaign = await db.campaign.create({
      data: { name: campaignName ?? brief.slice(0, 40), brief }
    });

    const VALID_CHANNELS = ['instagram', 'facebook', 'linkedin'];
    const VALID_STAGES = ['atrair', 'educar', 'conectar', 'converter'];

    await db.post.createMany({
      data: posts.map((p, i) => {
        const channel = VALID_CHANNELS.find(c => p.channel.toLowerCase().includes(c)) ?? 'instagram';
        const stage = VALID_STAGES.find(s => p.stage.toLowerCase().includes(s)) ?? 'atrair';
        const hashtags = Array.isArray(p.hashtags) ? p.hashtags.join(' ') : p.hashtags;
        return {
          campaignId: campaign.id,
          channel, format: p.format, stage,
          title: p.title, caption: p.caption, hashtags,
          whyNow: p.whyNow, mediaUrl: photos[i] ?? null, status: 'pending'
        };
      })
    });

    return NextResponse.json({ campaignId: campaign.id, criados: posts.length });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro desconhecido ao gerar posts';
    console.error('[/api/generate]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
