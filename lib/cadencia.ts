// Calcula o próximo slot de publicação baseado nos horários configurados.

export function proximoSlot(horarios: string[]): Date | null {
  if (!horarios.length) return null;

  const agora = new Date();
  // adiciona 5 min de margem
  const minFuturo = agora.getTime() + 5 * 60 * 1000;

  const horas = horarios
    .map(h => parseInt(h.split(':')[0], 10))
    .sort((a, b) => a - b);

  // Tenta hoje
  for (const h of horas) {
    const slot = new Date(agora);
    slot.setHours(h, 0, 0, 0);
    if (slot.getTime() > minFuturo) return slot;
  }

  // Amanhã, primeiro horário
  const amanha = new Date(agora);
  amanha.setDate(amanha.getDate() + 1);
  amanha.setHours(horas[0], 0, 0, 0);
  return amanha;
}

export function formatarSlot(d: Date): string {
  return d.toLocaleDateString('pt-BR', {
    weekday: 'short', day: 'numeric', month: 'short',
    hour: '2-digit', minute: '2-digit',
  });
}

// Converte Date para string 'YYYY-MM-DDTHH:MM' usada pelo <input type="datetime-local">
export function toDatetimeLocal(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
