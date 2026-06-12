'use client';
import { useEffect, useState, useRef } from 'react';

type Stats = {
  totais: {
    posts: number; publicados: number; agendados: number;
    pendentes: number; aprovados: number; pulados: number;
  };
  ultimos7:  { gerados: number; publicados: number };
  ultimos30: { gerados: number; publicados: number };
  porCanal:  Record<string, number>;
  campanhas: number;
  atividade: Record<string, number>;
};

type CmoMsg = { role: 'user' | 'cmo'; text: string };

const COR_CANAL: Record<string, string> = {
  instagram: '#E4405F',
  facebook:  '#1877F2',
  linkedin:  '#0A66C2',
};

function Sparkline({ atividade }: { atividade: Record<string, number> }) {
  const dias = Array.from({ length: 14 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (13 - i));
    return d.toISOString().slice(0, 10);
  });
  const vals = dias.map(d => atividade[d] ?? 0);
  const max = Math.max(...vals, 1);
  const W = 260, H = 40;
  const step = W / (dias.length - 1);
  const pts = vals.map((v, i) => `${i * step},${H - (v / max) * H}`).join(' ');

  return (
    <svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
      <polyline points={pts} fill="none" stroke="#5CF5B0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      {vals.map((v, i) => v > 0 && (
        <circle key={i} cx={i * step} cy={H - (v / max) * H} r="3" fill="#5CF5B0" />
      ))}
    </svg>
  );
}

function BarraCanal({ canal, n, total }: { canal: string; n: number; total: number }) {
  const pct = total > 0 ? (n / total) * 100 : 0;
  const cor = COR_CANAL[canal] ?? '#9CA3AF';
  return (
    <div className="flex items-center gap-2 mb-2">
      <span className="text-[12px] capitalize font-semibold w-[70px]" style={{ color: cor }}>{canal}</span>
      <div className="flex-1 h-[6px] rounded-full" style={{ background: '#F3F4F6' }}>
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: cor }} />
      </div>
      <span className="text-[12px] font-semibold text-mut w-[24px] text-right">{n}</span>
    </div>
  );
}

function PergunteAoCMO({ stats }: { stats: Stats }) {
  const [msgs, setMsgs] = useState<CmoMsg[]>([]);
  const [input, setInput] = useState('');
  const [enviando, setEnviando] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [msgs]);

  async function enviar() {
    const q = input.trim();
    if (!q || enviando) return;
    setInput('');
    setMsgs(m => [...m, { role: 'user', text: q }]);
    setEnviando(true);
    try {
      const r = await fetch('/api/cmo-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pergunta: q, stats })
      });
      const data = await r.json();
      setMsgs(m => [...m, { role: 'cmo', text: data.resposta ?? 'Não consegui processar sua pergunta.' }]);
    } catch {
      setMsgs(m => [...m, { role: 'cmo', text: 'Falha de conexão. Tente novamente.' }]);
    } finally {
      setEnviando(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }

  const sugestoes = [
    'Qual canal está performando melhor?',
    'Quantos posts publiquei esta semana?',
    'Qual o próximo passo para crescer?',
  ];

  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
      <div className="px-4 pt-4 pb-2 border-b border-gray-50">
        <p className="text-[13px] font-bold text-ink">✦ Pergunte ao CMO</p>
        <p className="text-[11.5px] text-soft">Análise dos seus dados em linguagem natural</p>
      </div>

      <div className="px-4 py-3 max-h-[280px] overflow-y-auto">
        {msgs.length === 0 && (
          <div>
            <p className="text-[12px] text-mut mb-3">Sugestões:</p>
            {sugestoes.map(s => (
              <button key={s} onClick={() => setInput(s)}
                className="block w-full text-left text-[12.5px] px-3 py-2 rounded-xl mb-1.5 font-semibold"
                style={{ background: '#F6F8F8', color: '#3D4451' }}>
                {s}
              </button>
            ))}
          </div>
        )}
        {msgs.map((m, i) => (
          <div key={i} className={`mb-2 flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className="max-w-[85%] px-3 py-2 rounded-2xl text-[13px] leading-relaxed whitespace-pre-line"
              style={{
                background: m.role === 'user' ? '#0E5F66' : '#F6F8F8',
                color: m.role === 'user' ? '#fff' : '#3D4451',
                borderBottomRightRadius: m.role === 'user' ? 4 : undefined,
                borderBottomLeftRadius: m.role === 'cmo' ? 4 : undefined,
              }}>
              {m.text}
            </div>
          </div>
        ))}
        {enviando && (
          <div className="flex justify-start mb-2">
            <div className="px-4 py-2.5 rounded-2xl rounded-bl-sm" style={{ background: '#F6F8F8' }}>
              <span className="inline-flex gap-1 items-center">
                {[0, 1, 2].map(i => (
                  <span key={i} className="w-1.5 h-1.5 rounded-full animate-bounce"
                    style={{ animationDelay: `${i * 0.15}s`, background: '#9CA3AF' }} />
                ))}
              </span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="px-3 pb-3 pt-2 border-t border-gray-50 flex gap-2">
        <input
          ref={inputRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && enviar()}
          placeholder="Pergunte qualquer coisa…"
          className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-[13px] outline-none focus:border-[#0E5F66]"
        />
        <button onClick={enviar} disabled={enviando || !input.trim()}
          className="px-3 py-2 rounded-xl text-white font-bold text-[14px] transition disabled:opacity-40"
          style={{ background: '#0E5F66' }}>
          ↑
        </button>
      </div>
    </div>
  );
}

export default function Painel() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    fetch('/api/painel').then(r => r.ok ? r.json() : null).then(setStats);
  }, []);

  if (!stats) return (
    <main className="px-4 pt-6">
      <p className="text-sm text-mut text-center py-16 animate-pulse">Carregando painel…</p>
    </main>
  );

  const totalCanais = Object.values(stats.porCanal).reduce((a, b) => a + b, 0);
  const taxaPublicacao = stats.totais.posts > 0
    ? Math.round((stats.totais.publicados / stats.totais.posts) * 100)
    : 0;

  return (
    <main className="px-4 pb-8">
      <header className="pt-6 pb-4">
        <p className="text-xs text-soft">Visão geral da sua operação</p>
        <h1 className="font-disp text-[23px] font-bold">Painel</h1>
      </header>

      {/* KPIs linha 1 */}
      <div className="grid grid-cols-2 gap-3 mb-3">
        <div className="bg-white rounded-2xl shadow-sm p-4">
          <p className="text-[12px] text-soft mb-1">Publicados (total)</p>
          <p className="text-[32px] font-bold font-disp" style={{ color: '#17996B' }}>
            {stats.totais.publicados}
          </p>
          <p className="text-[11.5px] text-mut">de {stats.totais.posts} gerados</p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm p-4">
          <p className="text-[12px] text-soft mb-1">Taxa de publicação</p>
          <p className="text-[32px] font-bold font-disp" style={{ color: '#0E5F66' }}>
            {taxaPublicacao}%
          </p>
          <p className="text-[11.5px] text-mut">{stats.campanhas} campanha{stats.campanhas !== 1 ? 's' : ''}</p>
        </div>
      </div>

      {/* KPIs linha 2 */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        {[
          { label: '7 dias', n: stats.ultimos7.publicados, sub: `${stats.ultimos7.gerados} gerados` },
          { label: 'Na fila', n: stats.totais.pendentes + stats.totais.aprovados, sub: 'aguardando' },
          { label: 'Agendados', n: stats.totais.agendados, sub: 'programados' },
        ].map(k => (
          <div key={k.label} className="bg-white rounded-2xl shadow-sm p-3 text-center">
            <p className="text-[11px] text-soft mb-1">{k.label}</p>
            <p className="text-[22px] font-bold font-disp text-ink">{k.n}</p>
            <p className="text-[10.5px] text-mut">{k.sub}</p>
          </div>
        ))}
      </div>

      {/* Sparkline */}
      <div className="rounded-2xl p-4 mb-4" style={{ background: 'linear-gradient(135deg, #0E5F66, #0A3D42)' }}>
        <p className="text-[12px] font-bold text-white/70 mb-2">Posts publicados · últimos 14 dias</p>
        <Sparkline atividade={stats.atividade} />
        <p className="text-[11px] text-white/50 mt-1">
          {stats.ultimos30.publicados} publicados nos últimos 30 dias
        </p>
      </div>

      {/* Por canal */}
      {totalCanais > 0 && (
        <div className="bg-white rounded-2xl shadow-sm p-4 mb-4">
          <p className="text-[13px] font-bold text-ink mb-3">Distribuição por canal</p>
          {Object.entries(stats.porCanal)
            .sort((a, b) => b[1] - a[1])
            .map(([canal, n]) => (
              <BarraCanal key={canal} canal={canal} n={n} total={totalCanais} />
            ))}
        </div>
      )}

      {/* Chat CMO */}
      <PergunteAoCMO stats={stats} />
    </main>
  );
}
