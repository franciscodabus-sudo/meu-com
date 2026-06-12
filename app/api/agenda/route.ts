import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/agenda?from=2026-06-09&to=2026-06-15
// Returns posts with campaign info for agenda views
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const from = searchParams.get('from');
  const to = searchParams.get('to');

  const where: Record<string, unknown> = {
    status: { in: ['pending', 'approved', 'scheduled', 'published'] }
  };

  if (from && to) {
    where.OR = [
      { scheduledAt: { gte: new Date(from), lte: new Date(to + 'T23:59:59Z') } },
      { publishedAt: { gte: new Date(from), lte: new Date(to + 'T23:59:59Z') } },
      // pending/approved (no date yet) always show if no date filter or if looking at current week
      ...((!from) ? [{ scheduledAt: null }] : [])
    ];
  }

  const posts = await db.post.findMany({
    where,
    include: { campaign: { select: { id: true, name: true, brief: true } } },
    orderBy: { createdAt: 'desc' }
  });

  // Also return campaigns with their posts for jornada view
  const campaigns = await db.campaign.findMany({
    where: { status: 'ativa' },
    include: {
      posts: {
        where: { status: { not: 'skipped' } },
        orderBy: { createdAt: 'asc' }
      }
    },
    orderBy: { createdAt: 'desc' },
    take: 5
  });

  return NextResponse.json({ posts, campaigns });
}
