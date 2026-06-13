'use client';
import { useEffect, useState } from 'react';
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

const AYRSHARE_URL = 'https://app.ayrshare.com';

function statusLabel(s: string): { text: string; cor: string } {
  if (s === 'success' || s === 'published') return { text: 'Publicado', cor: '#F04E3E' };
  if (s === 'scheduled') return { text: 'Agendado', cor: '#8B2FC9' };
  if (s === 'error' || s === 'failed') return { text: 'Falhou', cor: '#DC2626' };
  return { text: s, cor: '#7B6B8A' };
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

// ── Modal de conexão ──────────────────────────────────────────────────────────

function ModalConectar({
  onVerificar,
  verificando,
  feedbackVerificar,
  onFechar,
}: {
  onVerificar: () => void;
  verificando: boolean;
  feedbackVerificar: string | null;
  onFechar: () => void;
}) {
  const redes = [
    { nome: 'Instagram',  path: 'Social Accounts → Instagram' },
    { nome: 'Facebook',   path: 'Social Accounts → Facebook' },
    { nome: 'LinkedIn',   path: 'Social Accounts → LinkedIn' },
    { nome: 'TikTok',     path: 'Social Accounts → TikTok' },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center"
      style={{ background: 'rgba(23,38,44,.5)' }}
      onClick={e => { if (e.target === e.currentTarget) onFechar(); }}
    >
      <div
        className="bg-fundo rounded-t-[26px] w-full max-w-[430px]"
        style={{ paddingBottom: 'calc(24px + env(safe-area-inset-bottom))' }}
      >
        {/* Handle */}
        <div className="w-[42px] h-[5px] bg-[#D4B8EF] rounded-full mx-auto mt-3 mb-4" />

        {/* Cabeçalho */}
        <div className="flex items-center justify-between px-4 mb-4">
          <h2 className="font-disp text-[17px] font-bold">Conectar conta</h2>
          <button onClick={onFechar} className="text-mut text-[13px] font-semibold">Fechar</button>
        </div>

        <div className="px-4">
          {/* Instrução */}
          <div className="rounded-2xl px-4 py-4 mb-4" style={{ background: '#F0F4F5' }}>
            <p className="text-[13.5px] font-semibold text-ink mb-2">Como conectar uma rede social</p>
            <ol className="space-y-2 text-[13px] text-ink leading-relaxed">
              <li className="flex gap-2">
                <span className="w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold text-white flex-shrink-0 mt-0.5"
                  style={{ background: '#8B2FC9' }}>1</span>
                <span>Toque em <b>"Abrir painel de contas"</b> abaixo</span>
              </li>
              <li className="flex gap-2">
                <span className="w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold text-white flex-shrink-0 mt-0.5"
                  style={{ background: '#8B2FC9' }}>2</span>
                <span>Na nova aba, vá em <b>Social Accounts</b> e conecte a rede desejada</span>
              </li>
              <li className="flex gap-2">
                <span className="w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold text-white flex-shrink-0 mt-0.5"
                  style={{ background: '#8B2FC9' }}>3</span>
                <span>Volte aqui e toque em <b>"Já conectei — verificar"</b></span>
              </li>
            </ol>
          </div>

          {/* Onde cada rede fica */}
          <p className="text-[11.5px] font-semibold text-mut mb-2 px-1">Onde conectar cada rede:</p>
          <div className="grid grid-cols-2 gap-2 mb-4">
            {redes.map(r => (
              <div key={r.nome} className="bg-white rounded-xl px-3 py-2.5"
                style={{ boxShadow: '0 1px 3px rgba(23,38,44,.06)' }}>
                <p className="text-[12.5px] font-bold text-ink">{r.nome}</p>
                <p className="text-[11px] text-soft mt-0.5">{r.path}</p>
              </div>
            ))}
          </div>

          {/* Feedback do verificar */}
          {feedbackVerificar && (
            <div
              className="rounded-xl px-4 py-3 mb-3 text-[13px] font-semibold"
              style={{
                background: feedbackVerificar.startsWith('✓') ? '#E6F4EE' : '#FEF2F2',
                color:      feedbackVerificar.startsWith('✓') ? '#F04E3E' : '#B91C1C',
              }}
            >
              {feedbackVerificar}
            </div>
          )}

          {/* Botões de ação */}
          <div className="flex gap-2">
            <a
              href={AYRSHARE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 py-3.5 rounded-2xl text-center text-[14px] font-semibold transition active:scale-95"
              style={{ background: '#F0E8FA', color: '#8B2FC9' }}
            >
              Abrir painel ↗
            </a>
            <button
              onClick={onVerificar}
              disabled={verificando}
              className="flex-[2] py-3.5 rounded-2xl text-white text-[14px] font-semibold transition active:scale-95 disabled:opacity-60"
              style={{ background: '#8B2FC9' }}
            >
              {verificando ? '↻ Verificando…' : 'Já conectei — verificar'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Página principal ──────────────────────────────────────────────────────────

export default function Canais() {
  const [contas, setContas] = useState<ContaConectada[]>([]);
  const [historico, setHistorico] = useState<HistoricoItem[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [deletando, setDeletando] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [semChave, setSemChave] = useState(false);
  const [modalAberto, setModalAberto] = useState(false);
  const [verificando, setVerificando] = useState(false);
  const [feedbackVerificar, setFeedbackVerificar] = useState<string | null>(null);

  async function carregarContas(): Promise<ContaConectada[]> {
    const r = await fetch('/api/canais/contas');
    if (r.status === 503) { setSemChave(true); return []; }
    if (!r.ok) throw new Error('Falha ao carregar contas');
    return r.json();
  }

  async function carregar() {
    setCarregando(true);
    setErro(null);
    try {
      const [contas, rHist] = await Promise.all([
        carregarContas(),
        fetch('/api/canais/historico'),
      ]);
      setContas(contas);
      if (rHist.ok) setHistorico(await rHist.json());
    } catch {
      setErro('Falha ao carregar dados das contas');
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => { carregar(); }, []);

  async function verificarConexao() {
    setVerificando(true);
    setFeedbackVerificar(null);
    try {
      const novas = await carregarContas();
      setContas(novas);
      if (novas.length === 0) {
        setFeedbackVerificar('Nenhuma conta encontrada ainda. Conecte no painel e tente de novo.');
      } else {
        const conectadas = novas.filter(c => c.status === 'connected');
        setFeedbackVerificar(
          conectadas.length > 0
            ? `✓ ${conectadas.length} conta${conectadas.length > 1 ? 's' : ''} ativa${conectadas.length > 1 ? 's' : ''}: ${conectadas.map(c => PLATAFORMA_LABEL[c.platform] ?? c.platform).join(', ')}`
            : 'Contas encontradas mas com erro de autorização. Reconecte no painel.'
        );
      }
    } catch {
      setFeedbackVerificar('Falha ao verificar. Tente novamente.');
    } finally {
      setVerificando(false);
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
    <>
      {/* Modal de conexão */}
      {modalAberto && (
        <ModalConectar
          onVerificar={verificarConexao}
          verificando={verificando}
          feedbackVerificar={feedbackVerificar}
          onFechar={() => { setModalAberto(false); setFeedbackVerificar(null); }}
        />
      )}

      <main className="px-4 pb-8">
        {/* Header */}
        <header className="pt-6 pb-4 flex items-center gap-3">
          <Link href="/" className="text-[22px] leading-none text-mut active:scale-95 transition">‹</Link>
          <div>
            <p className="text-xs text-soft">Redes conectadas</p>
            <h1 className="font-disp text-[23px] font-bold leading-tight">Canais</h1>
          </div>
          <button
            onClick={carregar}
            className="ml-auto text-[12.5px] font-semibold px-3 py-1.5 rounded-full transition active:scale-95"
            style={{ background: '#F0F4F5', color: '#7B6B8A' }}
          >
            ↻ Atualizar
          </button>
        </header>

        {/* Sem chave configurada */}
        {semChave && (
          <div className="rounded-2xl px-4 py-5 text-center" style={{ background: '#FEF3C7' }}>
            <p className="text-[24px] mb-2">🔑</p>
            <p className="text-[14px] font-semibold text-ink mb-1">Publicação não configurada</p>
            <p className="text-[12.5px] text-mut">
              Configure a chave de integração nas{' '}
              <Link href="/configuracoes" className="underline font-semibold">Configurações → Chaves</Link>.
            </p>
          </div>
        )}

        {!semChave && (
          <>
            {/* Erro */}
            {erro && (
              <div className="rounded-2xl px-4 py-3 mb-4 text-[13px]"
                style={{ background: '#FEF2F2', color: '#B91C1C' }}>
                {erro}
                <button onClick={() => setErro(null)} className="ml-2 underline text-[12px]">fechar</button>
              </div>
            )}

            {/* Contas conectadas */}
            <section className="mb-5">
              <p className="text-[12px] font-bold text-mut uppercase tracking-wider mb-2">Contas conectadas</p>
              <div className="bg-white rounded-2xl overflow-hidden"
                style={{ boxShadow: '0 1px 3px rgba(23,38,44,.06),0 4px 14px rgba(23,38,44,.05)' }}>

                {carregando && (
                  <p className="px-4 py-5 text-[13px] text-mut animate-pulse">Carregando contas…</p>
                )}

                {!carregando && contas.length === 0 && (
                  <div className="px-4 py-6 text-center">
                    <p className="text-[28px] mb-2">📭</p>
                    <p className="text-[13px] font-semibold text-ink mb-1">Nenhuma conta conectada</p>
                    <p className="text-[12px] text-mut max-w-[240px] mx-auto">
                      Toque em "+ Conectar conta" para ver o passo a passo
                    </p>
                  </div>
                )}

                {!carregando && contas.map(conta => {
                  const label = PLATAFORMA_LABEL[conta.platform] ?? conta.platform;
                  const cor   = PLATAFORMA_COR[conta.platform] ?? '#9CA3AF';
                  return (
                    <div key={conta.platform}
                      className="flex items-center gap-3 px-4 py-3.5 border-b border-[#F0F4F5] last:border-0">
                      {conta.avatarUrl ? (
                        <img src={conta.avatarUrl} alt=""
                          className="w-[40px] h-[40px] rounded-full object-cover flex-shrink-0" />
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
                          color:      conta.status === 'connected' ? '#F04E3E' : '#DC2626',
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
                    onClick={() => { setFeedbackVerificar(null); setModalAberto(true); }}
                    className="w-full py-2.5 rounded-xl text-[13px] font-semibold transition active:scale-95"
                    style={{ background: '#8B2FC9', color: '#fff' }}
                  >
                    + Conectar conta
                  </button>
                </div>
              </div>
            </section>

            {/* Histórico */}
            <section>
              <p className="text-[12px] font-bold text-mut uppercase tracking-wider mb-2">
                Histórico de publicações
              </p>

              {!carregando && historico.length === 0 && (
                <div className="rounded-2xl px-4 py-6 text-center" style={{ background: '#FDF8FF' }}>
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

                  <div className="px-4 pb-2 flex flex-wrap gap-1.5">
                    {item.status.map(s => {
                      const { text, cor } = statusLabel(s.status);
                      return (
                        <span key={s.platform}
                          className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
                          style={{ background: `${cor}18`, color: cor }}>
                          {PLATAFORMA_LABEL[s.platform] ?? s.platform}: {text}
                        </span>
                      );
                    })}
                  </div>

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
    </>
  );
}
