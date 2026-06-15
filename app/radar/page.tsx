'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

type RadarItem = {
  id: string; kind: string; title: string;
  summary: string | null; sourceUrl: string | null;
  sourceName: string | null; heat: number;
  usedAt: string | null; createdAt: string;
};

type AutoStatus = {
  lastAt: string;
  resultado: { novosItens: number; postsGerados: number; erros: string[] } | null;
  intervalHoras: string;
  maxPosts: string;
  proximaRodada: string | null;
};

function isNovo(createdAt: string) {
  return Date.now() - new Date(createdAt).getTime() < 48 * 60 * 60 * 1000;
}

function tempoAtras(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const min  = Math.floor(diff / 60_000);
  if (min < 1)   return 'agora mesmo';
  if (min < 60)  return `há ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24)    return `há ${h}h`;
  return `há ${Math.floor(h / 24)}d`;
}

const INTERVALOS = [
  { label: 'A cada 4h',  value: '4'  },
  { label: 'A cada 6h',  value: '6'  },
  { label: 'A cada 12h', value: '12' },
  { label: 'Diário',     value: '24' },
  { label: 'Desligado',  value: '0'  },
];

// ---------- sub-componente: Automação ----------
function AutoRadar({ onPostsGerados }: { onPostsGerados: () => void }) {
  const [status, setStatus] = useState<AutoStatus | null>(null);
  const [rodando, setRodando] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [aberto, setAberto] = useState(false);

  async function carregar() {
    const r = await fetch('/api/radar/auto');
    if (r.ok) setStatus(await r.json());
  }

  useEffect(() => { carregar(); }, []);

  async function rodarAgora() {
    setRodando(true);
    const r = await fetch('/api/radar/auto', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ rodar: true }) });
    const data = await r.json();
    setRodando(false);
    if (r.ok && data.postsGerados > 0) onPostsGerados();
    carregar();
  }

  async function salvarIntervalo(valor: string) {
    setSalvando(true);
    await fetch('/api/radar/auto', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ intervalHoras: valor }),
    });
    setSalvando(false);
    carregar();
  }

  const intervaloAtual = status?.intervalHoras ?? '6';
  const ligado = intervaloAtual !== '0';

  return (
    <div className="mb-5">
      <button
        onClick={() => setAberto(!aberto)}
        className="w-full flex items-center justify-between px-4 py-3 rounded-2xl text-[14px] font-semibold"
        style={{ background: ligado ? '#F0E8FA' : '#FDF8FF', color: ligado ? '#8B2FC9' : '#7B6B8A' }}
      >
        <span>
          {ligado ? '🤖 Radar automático · ' : '⏸ Radar automático · '}
          {ligado
            ? (INTERVALOS.find(i => i.value === intervaloAtual)?.label ?? `a cada ${intervaloAtual}h`)
            : 'desligado'}
        </span>
        <span className="text-soft">{aberto ? '▲' : '▼'}</span>
      </button>

      {aberto && (
        <div className="mt-2 bg-white rounded-2xl overflow-hidden" style={{ boxShadow: '0 1px 3px rgba(23,38,44,.06),0 4px 14px rgba(23,38,44,.05)' }}>
          {/* Último resultado */}
          {status?.lastAt && (
            <div className="px-4 pt-4 pb-3 border-b border-[#F0F4F5]">
              <p className="text-[12.5px] text-mut">
                Última varredura: <b className="text-ink">{tempoAtras(status.lastAt)}</b>
                {status.resultado && (
                  <> · <span style={{ color: '#F04E3E', fontWeight: 600 }}>
                    {status.resultado.postsGerados} post{status.resultado.postsGerados !== 1 ? 's' : ''} gerado{status.resultado.postsGerados !== 1 ? 's' : ''}
                  </span></>
                )}
              </p>
              {status.proximaRodada && ligado && (
                <p className="text-[12px] text-soft mt-0.5">
                  Próxima: {new Date(status.proximaRodada).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  {' '}({tempoAtras(status.proximaRodada).replace('há ', 'em ')})
                </p>
              )}
            </div>
          )}

          {/* Frequência */}
          <div className="px-4 py-3 border-b border-[#F0F4F5]">
            <p className="text-[12px] font-semibold text-mut mb-2">Frequência de varredura</p>
            <div className="flex gap-1.5 flex-wrap">
              {INTERVALOS.map(op => (
                <button
                  key={op.value}
                  disabled={salvando}
                  onClick={() => salvarIntervalo(op.value)}
                  className="px-3 py-1.5 rounded-full text-[12px] font-semibold transition"
                  style={{
                    background: intervaloAtual === op.value ? '#8B2FC9' : '#F0F4F5',
                    color: intervaloAtual === op.value ? '#fff' : '#7B6B8A',
                  }}
                >
                  {op.label}
                </button>
              ))}
            </div>
          </div>

          {/* Rodar agora */}
          <div className="px-4 py-3">
            <button
              onClick={rodarAgora}
              disabled={rodando}
              className="w-full py-2.5 rounded-xl text-[13px] font-semibold text-white transition active:scale-95 disabled:opacity-60"
              style={{ background: '#8B2FC9' }}
            >
              {rodando ? '✦ Varrendo e gerando posts…' : '▶ Rodar agora'}
            </button>
            <p className="text-[11.5px] text-soft mt-2 text-center">
              Busca notícias novas e gera até {status?.maxPosts ?? '2'} posts automaticamente — vão para a fila de aprovação.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------- componente principal ----------
export default function Radar() {
  const [itens, setItens] = useState<RadarItem[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [atualizando, setAtualizando] = useState(false);
  const [gerando, setGerando] = useState<string | null>(null);
  const [deletando, setDeletando] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState<string | null>(null);
  const [erroGerar, setErroGerar] = useState<string | null>(null);
  const router = useRouter();

  async function buscar(mostrarSpin = false) {
    if (mostrarSpin) setAtualizando(true);
    else setCarregando(true);
    try {
      const r = await fetch('/api/radar');
      if (r.ok) setItens(await r.json());
    } finally {
      setCarregando(false);
      setAtualizando(false);
    }
  }

  useEffect(() => { buscar(); }, []);

  async function deletarItem(id: string) {
    setDeletando(id);
    try {
      await fetch('/api/radar', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      setItens(prev => prev.filter(i => i.id !== id));
    } finally {
      setDeletando(null);
    }
  }

  async function gerarPost(item: RadarItem) {
    setGerando(item.id);
    setSucesso(null);
    setErroGerar(null);
    try {
      const r = await fetch('/api/radar/gerar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ radarItemId: item.id })
      });
      const data = await r.json();
      if (!r.ok) {
        setErroGerar(data.error ?? 'Erro ao gerar post');
      } else {
        setSucesso(item.id);
        setItens(prev => prev.map(i =>
          i.id === item.id ? { ...i, usedAt: new Date().toISOString() } : i
        ));
      }
    } catch {
      setErroGerar('Falha de conexão. Tente novamente.');
    } finally {
      setGerando(null);
    }
  }

  return (
    <main className="px-4">
      {/* Header */}
      <header className="pt-6 pb-4 flex items-center justify-between gap-2">
        <div>
          <p className="text-xs text-soft">Monitoramento em tempo real</p>
          <h1 className="font-disp text-[23px] font-bold">Radar</h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => buscar(true)}
            disabled={atualizando}
            className="text-[13px] font-semibold px-3.5 py-1.5 rounded-full transition active:scale-95"
            style={{ background: '#F0E8FA', color: '#8B2FC9' }}
          >
            {atualizando ? '…' : '↻ Atualizar'}
          </button>
          <Link
            href="/configuracoes"
            className="w-9 h-9 flex items-center justify-center rounded-full text-mut hover:text-brand transition"
            style={{ background: '#F0F4F5' }}
            title="Configurações"
          >
            ⚙️
          </Link>
        </div>
      </header>

      {/* Banner sucesso */}
      {sucesso && (
        <div className="rounded-2xl px-4 py-3 mb-4 flex items-center gap-3"
          style={{ background: '#E6F4EE' }}>
          <span className="text-[18px]">✓</span>
          <div className="flex-1">
            <p className="text-[13px] font-semibold" style={{ color: '#F04E3E' }}>
              {sucesso === 'auto' ? 'Posts gerados automaticamente e na fila!' : 'Post gerado e na fila!'}
            </p>
            <button onClick={() => router.push('/')}
              className="text-[12px] underline font-semibold" style={{ color: '#F04E3E' }}>
              Aprovar em Hoje →
            </button>
          </div>
          <button onClick={() => setSucesso(null)} className="text-[18px] opacity-50">×</button>
        </div>
      )}

      {/* Banner erro */}
      {erroGerar && (
        <div className="rounded-2xl px-4 py-3 mb-4 border text-sm"
          style={{ background: '#FEF2F2', borderColor: '#FECACA', color: '#991B1B' }}>
          <p className="font-semibold mb-0.5">Não foi possível gerar o post</p>
          <p style={{ color: '#B91C1C' }}>{erroGerar}</p>
        </div>
      )}

      {/* Automação */}
      <AutoRadar onPostsGerados={() => { setSucesso('auto'); buscar(true); }} />

      {/* Loading */}
      {carregando && (
        <p className="text-sm text-mut text-center py-12 animate-pulse">📡 Varrendo os feeds…</p>
      )}

      {/* Vazio */}
      {!carregando && itens.length === 0 && (
        <div className="text-center text-mut py-12">
          <p className="text-4xl mb-2">📭</p>
          <p className="font-disp font-semibold text-ink">Nenhuma notícia encontrada</p>
          <p className="text-[13px] mt-1 max-w-[260px] mx-auto">
            Adicione fontes acima e toque em <b>Atualizar</b>.
          </p>
        </div>
      )}

      {/* Lista */}
      {!carregando && itens.length > 0 && (
        <>
          <p className="text-[13px] font-semibold text-mut mb-3 px-1">
            <b className="text-ink">Notícias detectadas</b> · {itens.length}
          </p>

          {itens.map(item => (
            <div key={item.id} className="bg-white rounded-card shadow-sm p-3.5 mb-3">
              <div className="flex items-start gap-2.5">
                <div className="flex-shrink-0 mt-0.5">
                  {!item.usedAt && isNovo(item.createdAt) && (
                    <span className="text-[10.5px] font-bold px-2 py-1 rounded-full block"
                      style={{ background: '#FBF1DE', color: '#C97F16' }}>🔥 Novo</span>
                  )}
                  {item.usedAt && (
                    <span className="text-[10.5px] font-bold px-2 py-1 rounded-full block"
                      style={{ background: '#E6F4EE', color: '#F04E3E' }}>✓ Usado</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] font-semibold text-ink leading-snug">{item.title}</p>
                  {item.summary && (
                    <p className="text-[12.5px] text-mut mt-1 leading-relaxed" style={{
                      display: '-webkit-box', WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical', overflow: 'hidden'
                    }}>
                      {item.summary}
                    </p>
                  )}
                  <p className="text-[11.5px] text-soft mt-1.5">
                    {item.sourceName}{item.sourceName && ' · '}
                    {new Date(item.createdAt).toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' })}
                  </p>
                </div>
              </div>

              <div className="flex gap-2 mt-3">
                <button
                  onClick={() => gerarPost(item)}
                  disabled={gerando === item.id}
                  className="flex-[2] text-white font-semibold rounded-xl py-2.5 text-[13px] active:scale-95 transition disabled:opacity-60"
                  style={{ background: gerando === item.id ? '#A89CB5' : '#8B2FC9' }}
                >
                  {gerando === item.id ? '✦ Gerando…' : '✦ Gerar minha versão'}
                </button>
                {item.sourceUrl && (
                  <a href={item.sourceUrl} target="_blank" rel="noopener noreferrer"
                    className="flex-1 flex items-center justify-center text-mut font-semibold rounded-xl py-2.5 text-[13px]"
                    style={{ background: '#FDF8FF' }}>
                    Ver fonte ↗
                  </a>
                )}
                <button
                  onClick={() => deletarItem(item.id)}
                  disabled={deletando === item.id}
                  title="Descartar pauta"
                  className="w-[42px] flex items-center justify-center rounded-xl text-[16px] transition active:scale-95 disabled:opacity-40"
                  style={{ background: '#FEF2F2', color: '#DC2626' }}
                >
                  {deletando === item.id ? '…' : '🗑'}
                </button>
              </div>
            </div>
          ))}

          <p className="text-center text-[12px] text-soft mt-2">
            ✦ Toque em "Gerar minha versão" para criar um post — vai direto para a fila de aprovação.
          </p>
        </>
      )}
    </main>
  );
}
