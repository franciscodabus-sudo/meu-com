import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  const [allPosts, campaigns] = await Promise.all([
    db.post.findMany({ orderBy: { createdAt: 'desc' } }),
    db.campaign.findMany({ orderBy: { createdAt: 'desc' } })
  ]);

  const now = new Date();
  const d30 = new Date(now); d30.setDate(now.getDate() - 30);
  const d7  = new Date(now); d7.setDate(now.getDate() - 7);

  const ultimos30 = allPosts.filter(p => new Date(p.createdAt) >= d30);
  const ultimos7  = allPosts.filter(p => new Date(p.createdAt) >= d7);

  const conta = (ps: typeof allPosts, status: string) => ps.filter(p => p.status === status).length;

  // por canal (publicados)
  const publicados = allPosts.filter(p => p.status === 'published');
  const porCanal: Record<string, number> = {};
  for (const p of publicados) {
    porCanal[p.channel] = (porCanal[p.channel] ?? 0) + 1;
  }

  // atividade nos últimos 30 dias — agrupa por data
  const atividade: Record<string, number> = {};
  for (const p of ultimos30.filter(q => q.status === 'published')) {
    const key = new Date(p.publishedAt ?? p.createdAt).toISOString().slice(0, 10);
    atividade[key] = (atividade[key] ?? 0) + 1;
  }

  return NextResponse.json({
    totais: {
      posts:     allPosts.length,
      publicados: conta(allPosts, 'published'),
      agendados:  conta(allPosts, 'scheduled'),
      pendentes:  conta(allPosts, 'pending'),
      aprovados:  conta(allPosts, 'approved'),
      pulados:    conta(allPosts, 'skipped'),
    },
    ultimos7:  { gerados: ultimos7.length, publicados: conta(ultimos7, 'published') },
    ultimos30: { gerados: ultimos30.length, publicados: conta(ultimos30, 'published') },
    porCanal,
    campanhas: campaigns.length,
    atividade, // { '2026-06-10': 2, ... }
  });
}
