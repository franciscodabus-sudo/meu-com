import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/stats — métricas públicas para o painel de login
export async function GET() {
  const [postsHoje, canaisAtivos, totalPosts] = await Promise.all([
    db.post.count({
      where: {
        status: { in: ['published', 'scheduled'] },
        publishedAt: {
          gte: new Date(new Date().setHours(0, 0, 0, 0)),
        },
      },
    }),
    db.channel.count({ where: { active: true } }),
    db.post.count({ where: { status: 'published' } }),
  ]);

  return NextResponse.json({ postsHoje, canaisAtivos, totalPosts });
}
