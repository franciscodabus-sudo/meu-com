'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';

type ContaConectada = {
  platform: string;
  username?: string;
  displayName?: string;
  avatarUrl?: string;
  status: 'connected' | 'error' | 'disconnected';
  error?: string;
};

type StatusItem = {
  platform: string;
  status: string;
  postUrl?: string;
  error?: string;
};

type HistoricoItem = {
  id: string;
  caption: string;
  platforms: string[];
  createdAt: string;
  status: StatusItem[];
};

const PLATAFORMA_LABEL: Record<string, string> = {
  instagram: 'Instagram',
  facebook:  'Facebook',
  linkedin:  'LinkedIn',
  tiktok:    'TikTok',
  twitter:   'Twitter / X',
  youtube:   'YouTube',
};

const PLATAFORMA_COR: Record<string, string> = {
  instagram: '#E4405F',
  facebook:  '#1877F2',
  linkedin:  '#0A66C2',
  tiktok:    '#010101',
  twitter:   '#1DA1F2',
  youtube:   '#FF0000',
};

function statusLabel(s: string): { text: string; cor: string } {
  if (s === 'success' || s === 'published') return { text: 'Publicado', cor: '#17996B' };
  if (s === 'scheduled') return { text: 'Agendado', cor: '#0E5F66' };
  if (s === 'error' || s === 'failed') return { text: 'Falhou', cor: '#DC2626' };
  return { text: s, cor: '#6B7E85' };
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

export default function Canais() {
  const [contas, setContas] = useState<ContaConectada[]>([]);
  const [historico, setHistorico] = useState<HistoricoItem[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [conectando, setConectando] = useState(false);
  const [deletando, setDeletando] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [semChave, setSemChave] = useState(false);
  const popupRef = useRef<Window | null>(null);

  async function carregar() {
    setCarregando(true);
    setErro(null);
    try {
      const [rContas, rHist] = await Promise.all([
        fetch('/api/canais/contas'),
        fetch('/api/canais/historico'),
      ]);

      if (rContas.status === 503) { setSemChave(true); return; }
      if (rContas.ok) setContas(await rContas.json());
      if (rHist.ok)  setHistorico(await rHist.json());
    } catch {
      setErro('Falha ao carregar dados das contas');
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => { carregar(); }, []);

  async function conectarConta() {
    setConectando(true);
    try {
      const r = await fetch('/api/canais/conectar');
      const d = await r.json();
      popupRef.current = window.open(d.url, 'conectar-conta', 'width=600,height=720,left=200,top=100');
      // recarrega contas quando popup fechar
      const timer = setInterval(() => {
        if (popupRef.current?.closed) {
          clearInterval(timer);
          setConectando(false);
          carregar();
        }
      }, 800);
    } catch {
      setConectando(false);
    }
  }

  async function deletarPost(id: string) {
    setDeletando(id);
    try {
      const r = await fetch('/api/posts', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      if (r.ok) {
        setHistorico(prev => prev.filter(h => h.id !== id));
      } else {
        const d = await r.json();
        setErro(d.error ?? 'Não foi possível remover o post');
      }
    } finally {
      setDeletando(null);
    }
  }

  return (
    <main className="px-4 pb-8">
      {/* Header */}
      <header className="pt-6 pb-4 flex items-center gap-3">
        <Link href="/" className="text-[22px] leading-none text-mut active:scale-95 transition">‹</Link>
        <div>
          <p className="text-xs text-soft">Redes conectadas</p>
          <h1 className="font-disp text-[23px] font-bold leading-tight">Canais</h1>
        </div>
      </header>

      {/* Sem chave configurada */}
      {semChave && (
        <div className="rounded-2xl px-4 py-5 text-center" style={{ background: '#FEF3C7' }}>
          <p className="text-[24px] mb-2">🔑</p>
          <p className="text-[14px] font-semibold text-ink mb-1">Publicação não configurada</p>
          <p className="text-[12.5px] text-mut">
            Configure a chave de integração nas <Link href="/configuracoes" className="underline font-semibold">Configurações → Chaves</Link>.
          </p>
        </div>
      )}

      {!semChave && (
        <>
          {/* Erro */}
          {erro && (
            <div className="rounded-2xl px-4 py-3 mb-4 text-[13px]" style={{ background: '#FEF2F2', color: '#B91C1C' }}>
              {erro}
              <button onClick={() => setErro(null)} className="ml-2 underline text-[12px]">fechar</button>
            </div>
          )}

          {/* Contas conectadas */}
          <section className="mb-5">
            <p className="text-[12px] font-bold text-mut uppercase tracking-wider mb-2">Contas conectadas</p>
            <div className="bg-white rounded-2xl overflow-hidden" style={{ boxShadow: '0 1px 3px rgba(23,38,44,.06),0 4px 14px rgba(23,38,44,.05)' }}>
              {carregando && (
                <p className="px-4 py-5 text-[13px] text-mut animate-pulse">Carregando contas…</p>
              )}

              {!carregando && contas.length === 0 && (
                <div className="px-4 py-6 text-center">
                  <p className="text-[28px] mb-2">📭</p>
                  <p className="text-[13px] font-semibold text-ink mb-1">Nenhuma conta conectada</p>
                  <p className="text-[12px] text-mut">Toque em "Conectar conta" para adicionar uma rede social</p>
                </div>
              )}

              {!carregando && contas.map(conta => {
                const label = PLATAFORMA_LABEL[conta.platform] ?? conta.platform;
                const cor   = PLATAFORMA_COR[conta.platform] ?? '#9CA3AF';
                return (
                  <div key={conta.platform} className="flex items-center gap-3 px-4 py-3.5 border-b border-[#F0F4F5] last:border-0">
                    {conta.avatarUrl ? (
                      <img src={conta.avatarUrl} alt="" className="w-[40px] h-[40px] rounded-full object-cover flex-shrink-0" />
                    ) : (
                      <div className="w-[40px] h-[40px] rounded-full flex items-center justify-center text-white font-bold text-[15px] flex-shrink-0"
                        style={{ background: cor }}>
                        {label[0]}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-[14px] font-semibold text-ink leading-tight">{label}</p>
                      {conta.username && (
                        <p className="text-[12px] text-mut">@{conta.username}</p>
                      )}
                      {conta.error && (
                        <p className="text-[11.5px] mt-0.5" style={{ color: '#DC2626' }}>{conta.error}</p>
                      )}
                    </div>
                    <span
                      className="text-[11px] font-bold px-2.5 py-1 rounded-full flex-shrink-0"
                      style={{
                        background: conta.status === 'connected' ? '#E6F4EE' : '#FEF2F2',
                        color:      conta.status === 'connected' ? '#17996B' : '#DC2626',
                      }}
                    >
                      {conta.status === 'connected' ? '● Ativa' : '● Erro'}
                    </span>
                  </div>
                );
              })}

              {/* Botão conectar */}
              <div className="px-4 py-3 border-t border-[#F0F4F5]">
                <button
                  onClick={conectarConta}
                  disabled={conectando}
                  className="w-full py-2.5 rounded-xl text-[13px] font-semibold transition active:scale-95 disabled:opacity-60"
                  style={{ background: '#0E5F66', color: '#fff' }}
                >
                  {conectando ? 'Aguardando…' : '+ Conectar conta'}
                </button>
                {conectando && (
                  <p className="text-[11.5px] text-mut text-center mt-1.5">
                    Uma janela foi aberta — conecte a conta e feche para continuar
                  </p>
                )}
              </div>
            </div>
          </section>

          {/* Histórico */}
          <section>
            <p className="text-[12px] font-bold text-mut uppercase tracking-wider mb-2">Histórico de publicações</p>

            {!carregando && historico.length === 0 && (
              <div className="rounded-2xl px-4 py-6 text-center" style={{ background: '#F6F8F8' }}>
                <p className="text-[13px] text-mut">Nenhuma publicação ainda</p>
              </div>
            )}

            {historico.map(item => (
              <div key={item.id} className="bg-white rounded-2xl mb-3 overflow-hidden"
                style={{ boxShadow: '0 1px 3px rgba(23,38,44,.06),0 4px 14px rgba(23,38,44,.05)' }}>
                <div className="px-4 pt-3 pb-2">
                  <p className="text-[13px] text-ink leading-snug" style={{
                    display: '-webkit-box', WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical', overflow: 'hidden'
                  }}>
                    {item.caption}
                  </p>
                  <p className="text-[11.5px] text-soft mt-1">
                    {item.platforms.map(p => PLATAFORMA_LABEL[p] ?? p).join(' · ')}
                    {' · '}{tempoAtras(item.createdAt)}
                  </p>
                </div>

                {/* Status por plataforma */}
                <div className="px-4 pb-2 flex flex-wrap gap-1.5">
                  {item.status.map(s => {
                    const { text, cor } = statusLabel(s.status);
                    return (
                      <span key={s.platform} className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
                        style={{ background: `${cor}18`, color: cor }}>
                        {PLATAFORMA_LABEL[s.platform] ?? s.platform}: {text}
                      </span>
                    );
                  })}
                </div>

                {/* Ações */}
                <div className="flex border-t border-[#F0F4F5]">
                  {item.status.some(s => s.postUrl) && (
                    <a
                      href={item.status.find(s => s.postUrl)?.postUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 py-2.5 text-center text-[12.5px] font-semibold text-mut border-r border-[#F0F4F5]"
                    >
                      Ver publicação ↗
                    </a>
                  )}
                  <button
                    onClick={() => deletarPost(item.id)}
                    disabled={deletando === item.id}
                    className="flex-1 py-2.5 text-center text-[12.5px] font-semibold transition disabled:opacity-50"
                    style={{ color: '#DC2626' }}
                  >
                    {deletando === item.id ? 'Removendo…' : 'Remover'}
                  </button>
                </div>
              </div>
            ))}
          </section>
        </>
      )}
    </main>
  );
}
