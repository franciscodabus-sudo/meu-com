// Roda uma vez quando o servidor Next.js inicializa (Node.js runtime).
// Agenda a varredura automática do Radar de acordo com radarIntervalHoras.

export async function register() {
  if (process.env.NEXT_RUNTIME !== 'nodejs') return;

  // Evita duplicação de timers em dev com hot-reload
  const g = globalThis as typeof globalThis & { __radarAgendado?: boolean };
  if (g.__radarAgendado) return;
  g.__radarAgendado = true;

  const { getSetting, executarRadarAuto } = await import('./lib/radar-auto');

  async function rodar() {
    try {
      const intervalHoras = parseFloat(await getSetting('radarIntervalHoras', '6'));
      if (intervalHoras <= 0) {
        // Radar desligado — verifica de novo em 1h por se o usuário reativar
        setTimeout(rodar, 3_600_000);
        return;
      }

      console.log('[radar-auto] iniciando varredura…');
      const r = await executarRadarAuto();
      console.log(`[radar-auto] concluído: ${r.novosItens} itens novos, ${r.postsGerados} posts gerados`);
      if (r.erros.length) console.warn('[radar-auto] erros:', r.erros);

      setTimeout(rodar, intervalHoras * 3_600_000);
    } catch (err) {
      console.error('[radar-auto] erro inesperado:', err);
      setTimeout(rodar, 3_600_000); // tenta de novo em 1h
    }
  }

  // Primeira execução 90 segundos após o servidor subir
  // (dá tempo do Prisma conectar e das rotas estarem prontas)
  setTimeout(rodar, 90_000);
  console.log('[radar-auto] agendador registrado');
}
