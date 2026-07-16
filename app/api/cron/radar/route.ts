import { NextResponse } from 'next/server';
import { executarRadarAuto } from '@/lib/radar-auto';

// GET — disparado pelo Vercel Cron a cada 6h
// Vercel envia: Authorization: Bearer <CRON_SECRET>
// Docs: https://vercel.com/docs/cron-jobs/manage-cron-jobs
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret && process.env.NODE_ENV === 'production') {
    console.error('[cron/radar] CRON_SECRET não configurada — recusando chamada');
    return NextResponse.json({ error: 'CRON_SECRET não configurada' }, { status: 500 });
  }
  if (secret) {
    const auth = req.headers.get('authorization');
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  try {
    const result = await executarRadarAuto();
    console.log('[cron/radar]', new Date().toISOString(), result);
    return NextResponse.json({ ok: true, ts: new Date().toISOString(), ...result });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Erro desconhecido';
    console.error('[cron/radar]', msg);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
