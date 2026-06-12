import { NextResponse } from 'next/server';
import { executarRadarAuto, getSetting, setSetting } from '@/lib/radar-auto';

// GET — status atual do agendador
export async function GET() {
  const [lastAt, lastResult, intervalHoras, maxPosts] = await Promise.all([
    getSetting('lastAutoRadarAt', ''),
    getSetting('lastAutoResult', ''),
    getSetting('radarIntervalHoras', '6'),
    getSetting('radarMaxPostsPerRun', '2'),
  ]);

  const resultado = lastResult ? JSON.parse(lastResult) : null;
  const proximaRodada = lastAt && parseFloat(intervalHoras) > 0
    ? new Date(new Date(lastAt).getTime() + parseFloat(intervalHoras) * 3_600_000).toISOString()
    : null;

  return NextResponse.json({ lastAt, resultado, intervalHoras, maxPosts, proximaRodada });
}

// POST — dispara manualmente OU salva configurações
export async function POST(req: Request) {
  try {
    const body: Record<string, unknown> = await req.json().catch(() => ({}));

    // Salva configurações se vieram no body
    let configurou = false;
    if (typeof body.intervalHoras === 'string' || typeof body.intervalHoras === 'number') {
      await setSetting('radarIntervalHoras', String(body.intervalHoras));
      configurou = true;
    }
    if (typeof body.maxPosts === 'string' || typeof body.maxPosts === 'number') {
      await setSetting('radarMaxPostsPerRun', String(body.maxPosts));
      configurou = true;
    }
    if (configurou && !body.rodar) {
      return NextResponse.json({ ok: true, configurado: true });
    }

    // Executa a varredura
    const result = await executarRadarAuto();
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Erro desconhecido';
    console.error('[/api/radar/auto]', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
