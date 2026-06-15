'use client';
import { useEffect, useState, useRef, useCallback } from 'react';
import PreviewModal from '@/components/PreviewModal';
import type { PreviewPost } from '@/components/PreviewModal';

// ─── Types ─────────────────────────────────────────────────────────────────────

type PendingPost = PreviewPost & {
  stage: string | null; whyNow: string | null;
  profileId: string | null; scheduledAt: string | null;
};

type RadarItem = {
  id: string; title: string; summary: string | null;
  sourceName: string | null; heat: number;
  createdAt: string; usedAt: string | null;
};

type JourneyPost = {
  id: string; title: string; channel: string;
  stage: string | null; status: string;
  scheduledAt: string | null; publishedAt: string | null;
};

type Campaign = { id: string; name: string; posts: JourneyPost[] };

type PanelStats = {
  totais: { posts: number; publicados: number; pendentes: number; agendados: number };
  ultimos7: { publicados: number };
  porCanal: Record<string, number>;
};

type Perfil = { displayName: string; avatarColor: string; ativo: boolean };

// ─── Constants ─────────────────────────────────────────────────────────────────

const CANAL_COR: Record<string, string> = {
  instagram: '#C13584', facebook: '#1877F2', linkedin: '#0A66C2', tiktok: '#000'
};
const CANAL_GRAD: Record<string, string> = {
  instagram: 'linear-gradient(135deg,#833ab4,#fd1d1d,#fcb045)',
  facebook:  'linear-gradient(135deg,#1877F2,#0551B5)',
  linkedin:  'linear-gradient(135deg,#0A66C2,#084B8A)',
};
const STAGE_COR: Record<string, { bg: string; text: string }> = {
  atrair:    { bg: '#FEF8DC', text: '#854F0B' },
  educar:    { bg: '#E5F1F0', text: '#0E5F66' },
  conectar:  { bg: '#FBEAF0', text: '#993556' },
  converter: { bg: '#E1F5EE', text: '#0F6E56' },
};

// ─── TopBar ────────────────────────────────────────────────────────────────────

function TopBar({ perfil }: { perfil: Perfil | null }) {
  const h = new Date().getHours();
  const saudacao = h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite';
  const dataFmt = new Date().toLocaleDateString('pt-BR', {
    weekday: 'long', day: 'numeric', month: 'long',
  });
  return (
    <div className="h-11 flex items-center px-3.5 gap-2 flex-shrink-0 border-b"
      style={{ background: '#fff', borderColor: 'var(--color-border-subtle)' }}>
      <span className="text-[14px] font-medium text-ink flex-shrink-0">
        {saudacao}, Francisco
      </span>
      <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full flex-shrink-0"
        style={{ background: '#F0E8FA' }}>
        <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: '#F04E3E' }} />
        <span className="text-[11px] font-semibold" style={{ color: '#8B2FC9' }}>
          {perfil?.displayName ?? 'Vip Insurance'}
        </span>
      </div>
      <span className="ml-auto text-[11px] text-soft capitalize hidden lg:block">{dataFmt}</span>
    </div>
  );
}

// ─── BriefBar ──────────────────────────────────────────────────────────────────

function BriefBar({ onGerar, gerando }: {
  onGerar: (b: string) => Promise<void>;
  gerando: boolean;
}) {
  const [brief, setBrief] = useState('');

  async function submit() {
    if (!brief.trim() || gerando) return;
    const b = brief;
    setBrief('');
    await onGerar(b);
  }

  return (
    <div className="px-3 py-2 flex-shrink-0 border-b"
      style={{ background: '#fff', borderColor: 'var(--color-border-subtle)' }}>
      <div className="flex items-center gap-2 px-3 py-2 rounded-xl border"
        style={{ borderColor: 'var(--color-border-subtle)', background: '#FDF8FF' }}>
        <span style={{ color: '#F04E3E', fontSize: 15 }}>✦</span>
        <input
          value={brief}
          onChange={e => setBrief(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && submit()}
          placeholder="Diga ao seu CMO o que você precisa…"
          className="flex-1 text-[13px] outline-none bg-transparent"
          disabled={gerando}
        />
        <button
          onClick={submit}
          disabled={gerando || !brief.trim()}
          className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-[14px] font-bold transition disabled:opacity-40 active:scale-95"
          style={{ background: 'linear-gradient(135deg,#8B2FC9,#F04E3E)' }}
        >
          {gerando ? '…' : '→'}
        </button>
      </div>
    </div>
  );
}

// ─── Approval Card ─────────────────────────────────────────────────────────────

function ApprovalCard({ post, onAprovar, onSkip }: {
  post: PendingPost; onAprovar: () => void; onSkip: () => void;
}) {
  const grad = CANAL_GRAD[post.channel] ?? 'linear-gradient(135deg,#1A0A2E,#3D2070)';
  const [skipping, setSkipping] = useState(false);

  async function skip() {
    setSkipping(true);
    await onSkip();
  }

  return (
    <div className={`bg-white rounded-2xl shadow-card mb-2 overflow-hidden transition-all ${skipping ? 'opacity-0 scale-95' : ''}`}>
      <div className="relative flex items-end p-2.5"
        style={{ height: 72, background: grad }}>
        {post.mediaUrl && (
          <>
            <img src={post.mediaUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />
            <span className="absolute inset-0"
              style={{ background: 'linear-gradient(180deg,rgba(10,10,20,.08) 20%,rgba(10,10,20,.78))' }} />
          </>
        )}
        <span className="absolute top-2 left-2 text-white text-[9px] font-bold px-2 py-0.5 rounded-full uppercase z-10"
          style={{ background: 'rgba(0,0,0,.45)' }}>
          {post.channel}
        </span>
        <p className="relative text-white font-semibold text-[12px] leading-snug line-clamp-2 z-10">
          {post.title}
        </p>
      </div>
      <div className="flex gap-1.5 p-2">
        <button onClick={onAprovar}
          className="flex-[2] py-1.5 rounded-xl text-white text-[11.5px] font-semibold transition active:scale-95"
          style={{ background: 'linear-gradient(135deg,#8B2FC9,#F04E3E)' }}>
          ✓ Aprovar
        </button>
        <button onClick={skip} disabled={skipping}
          className="flex-1 py-1.5 rounded-xl text-[11.5px] font-semibold transition active:scale-95"
          style={{ background: 'var(--color-bg-tertiary)', color: '#7B6B8A' }}>
          Pular
        </button>
      </div>
    </div>
  );
}

// ─── Radar Pauta Card ──────────────────────────────────────────────────────────

function RadarCard({ item, onGerar }: { item: RadarItem; onGerar: () => void }) {
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function handle() {
    setLoading(true);
    await onGerar();
    setDone(true);
    setLoading(false);
  }

  return (
    <div className="bg-white rounded-2xl shadow-card mb-2 p-2.5 flex items-start gap-2">
      <span className="text-[9.5px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0 mt-0.5"
        style={{ background: '#FEF8DC', color: '#854F0B' }}>
        {item.heat}🔥
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-[12px] font-semibold text-ink leading-snug line-clamp-2">{item.title}</p>
        {item.summary && (
          <p className="text-[10.5px] text-mut mt-0.5 line-clamp-1">{item.summary}</p>
        )}
        {item.sourceName && (
          <p className="text-[10px] text-soft mt-0.5">{item.sourceName}</p>
        )}
      </div>
      <button onClick={handle} disabled={loading || done}
        className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold transition active:scale-95 disabled:opacity-60"
        style={{ background: done ? '#E6F4EE' : '#F0E8FA', color: done ? '#17996B' : '#8B2FC9', fontSize: 14 }}>
        {loading ? '…' : done ? '✓' : '✦'}
      </button>
    </div>
  );
}

// ─── Column A ──────────────────────────────────────────────────────────────────

function ColumnA({ posts, radarItems, onAprovar, onSkip, onGerarDoRadar, gerando }: {
  posts: PendingPost[];
  radarItems: RadarItem[];
  onAprovar: (p: PendingPost) => void;
  onSkip: (id: string) => void;
  onGerarDoRadar: (id: string) => Promise<void>;
  gerando: boolean;
}) {
  return (
    <div className="overflow-y-auto p-3.5 border-r no-scrollbar"
      style={{ borderColor: 'var(--color-border-subtle)', background: 'var(--color-bg-tertiary)' }}>

      {/* Para aprovar */}
      <div className="flex items-center gap-2 mb-2.5">
        <span className="text-[10.5px] font-semibold uppercase tracking-wide text-mut">Para aprovar</span>
        {posts.length > 0 && (
          <span className="text-[9.5px] font-bold px-1.5 py-0.5 rounded-full text-white"
            style={{ background: '#F04E3E' }}>
            {posts.length}
          </span>
        )}
      </div>

      {gerando && (
        <p className="text-[12px] text-mut py-3 text-center animate-pulse">✦ Gerando posts…</p>
      )}

      {!gerando && posts.length === 0 && (
        <div className="text-center py-5 mb-3">
          <p className="text-[24px] mb-1">🎉</p>
          <p className="text-[12px] font-semibold text-ink">Fila zerada!</p>
          <p className="text-[11px] text-mut mt-0.5">Use o brief acima para novos posts.</p>
        </div>
      )}

      {posts.map(p => (
        <ApprovalCard
          key={p.id}
          post={p}
          onAprovar={() => onAprovar(p)}
          onSkip={() => onSkip(p.id)}
        />
      ))}

      {/* Radar pautas */}
      {radarItems.length > 0 && (
        <>
          <div className="flex items-center gap-2 mb-2.5 mt-5">
            <span className="text-[10.5px] font-semibold uppercase tracking-wide text-mut">Radar · pautas</span>
            <span className="text-[9.5px] font-bold px-1.5 py-0.5 rounded-full"
              style={{ background: '#FEF8DC', color: '#854F0B' }}>
              {radarItems.length}
            </span>
          </div>
          {radarItems.map(item => (
            <RadarCard
              key={item.id}
              item={item}
              onGerar={() => onGerarDoRadar(item.id)}
            />
          ))}
        </>
      )}
    </div>
  );
}

// ─── Column B ──────────────────────────────────────────────────────────────────

function ColumnB({ campaign }: { campaign: Campaign | null }) {
  if (!campaign) {
    return (
      <div className="overflow-y-auto p-3.5 border-r no-scrollbar"
        style={{ borderColor: 'var(--color-border-subtle)', background: 'var(--color-bg-tertiary)' }}>
        <div className="text-center py-14 text-mut">
          <p className="text-[30px] mb-2">📋</p>
          <p className="text-[12.5px] font-semibold text-ink">Nenhuma campanha ativa</p>
          <p className="text-[11px] mt-1">Crie um brief acima para começar.</p>
        </div>
      </div>
    );
  }

  const posts = campaign.posts.filter(p => p.status !== 'skipped');
  const publicados = posts.filter(p => p.status === 'published').length;
  const pct = posts.length > 0 ? Math.round((publicados / posts.length) * 100) : 0;

  return (
    <div className="overflow-y-auto p-3.5 border-r no-scrollbar"
      style={{ borderColor: 'var(--color-border-subtle)', background: 'var(--color-bg-tertiary)' }}>

      {/* Campaign header */}
      <div className="rounded-2xl p-3.5 mb-4"
        style={{ background: 'linear-gradient(135deg,#8B2FC9,#F04E3E)' }}>
        <p className="text-[9.5px] font-semibold mb-0.5" style={{ color: 'rgba(255,255,255,.75)' }}>
          Campanha ativa
        </p>
        <p className="text-[13px] font-medium text-white mb-2.5 leading-snug">{campaign.name}</p>
        <div className="h-[4px] rounded-full mb-1.5" style={{ background: 'rgba(255,255,255,.2)' }}>
          <div className="h-full rounded-full" style={{ width: `${pct}%`, background: 'rgba(255,255,255,.8)' }} />
        </div>
        <p className="text-[10px]" style={{ color: 'rgba(255,255,255,.7)' }}>
          {publicados} de {posts.length} publicados · {pct}% concluído
        </p>
      </div>

      {/* Journey timeline */}
      {posts.map((p, idx) => {
        const isDone = p.status === 'published';
        const isNow  = p.status === 'pending' || p.status === 'approved';
        const isLast = idx === posts.length - 1;
        const dt = p.scheduledAt ?? p.publishedAt;
        const dtLabel = dt
          ? new Date(dt).toLocaleDateString('pt-BR', {
              weekday: 'short', day: 'numeric',
              hour: '2-digit', minute: '2-digit'
            })
          : null;
        const stage = STAGE_COR[p.stage ?? ''] ?? { bg: '#F3F0F9', text: '#9CA3AF' };

        return (
          <div key={p.id} className="flex gap-2">
            {/* Dot + line */}
            <div className="flex flex-col items-center flex-shrink-0">
              <div className="w-[14px] h-[14px] rounded-full border-2 flex items-center justify-center"
                style={{
                  borderColor: isDone ? '#1D9E75' : isNow ? '#F04E3E' : '#D1D5DB',
                  background:  isDone ? '#1D9E75' : isNow ? 'rgba(240,78,62,.1)' : '#fff',
                }}>
                {isDone && <span className="text-[7px] text-white font-bold">✓</span>}
                {isNow  && <span className="w-[4px] h-[4px] rounded-full block" style={{ background: '#F04E3E' }} />}
              </div>
              {!isLast && <div className="w-px flex-1 mt-0.5" style={{ background: '#E5E7EB' }} />}
            </div>

            {/* Content */}
            <div className="flex-1 pb-3 pt-0.5 min-w-0">
              <div className="flex items-center gap-1 mb-0.5 flex-wrap">
                {p.stage && (
                  <span className="text-[8.5px] font-bold px-1.5 py-0.5 rounded-full"
                    style={{ background: stage.bg, color: stage.text }}>
                    {p.stage}
                  </span>
                )}
                <span className="text-[8.5px] font-semibold capitalize"
                  style={{ color: CANAL_COR[p.channel] ?? '#9CA3AF' }}>
                  {p.channel}
                </span>
              </div>
              <p className="text-[12px] font-semibold text-ink leading-snug line-clamp-2">{p.title}</p>
              <p className="text-[10px] text-mut mt-0.5">
                {dtLabel ?? (isNow ? 'Aguardando aprovação' : 'Sem data')}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Column C ──────────────────────────────────────────────────────────────────

function ColumnC({ stats }: { stats: PanelStats | null }) {
  const [tab, setTab] = useState<'painel' | 'agenda' | 'verba'>('painel');
  const [chatInput, setChatInput] = useState('');
  const [chatMsgs, setChatMsgs] = useState<{ role: 'user' | 'cmo'; text: string }[]>([]);
  const [enviando, setEnviando] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMsgs]);

  async function enviarChat() {
    const q = chatInput.trim();
    if (!q || enviando) return;
    setChatInput('');
    setChatMsgs(m => [...m, { role: 'user', text: q }]);
    setEnviando(true);
    try {
      const r = await fetch('/api/cmo-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pergunta: q, stats }),
      });
      const data = await r.json();
      setChatMsgs(m => [...m, { role: 'cmo', text: data.resposta ?? 'Sem resposta.' }]);
    } catch {
      setChatMsgs(m => [...m, { role: 'cmo', text: 'Falha de conexão.' }]);
    } finally {
      setEnviando(false);
    }
  }

  const totalCanal = Object.values(stats?.porCanal ?? {}).reduce((a, b) => a + b, 0);
  const canaisBars = Object.entries(stats?.porCanal ?? {})
    .sort((a, b) => b[1] - a[1])
    .map(([canal, n]) => ({
      canal, pct: totalCanal > 0 ? Math.round((n / totalCanal) * 100) : 0,
      cor: CANAL_COR[canal] ?? '#9CA3AF',
    }));

  return (
    <div className="overflow-y-auto border-l flex flex-col no-scrollbar"
      style={{ borderColor: 'var(--color-border-subtle)', background: '#fff' }}>

      {/* Tabs */}
      <div className="flex border-b flex-shrink-0"
        style={{ borderColor: 'var(--color-border-subtle)' }}>
        {(['painel', 'agenda', 'verba'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className="flex-1 py-2.5 text-[11px] font-medium capitalize transition"
            style={{
              color: tab === t ? '#F04E3E' : '#9CA3AF',
              borderBottom: tab === t ? '2px solid #F04E3E' : '2px solid transparent',
            }}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {/* ── Painel ── */}
      {tab === 'painel' && (
        <div className="flex-1 p-3 overflow-y-auto no-scrollbar">

          {/* KPI 2×2 */}
          <div className="grid grid-cols-2 gap-2 mb-3">
            {[
              { label: 'ROAS',        value: '3.4×', change: '↑21%',  ok: true },
              { label: 'Custo/lead',  value: '$11',  change: '↓18%',  ok: true },
              { label: 'Leads',       value: String(stats?.totais.publicados ?? '—'), change: `↑${stats?.ultimos7.publicados ?? 0} semana`, ok: true },
              { label: 'Verba usada', value: '$182', change: 'de $400', ok: false },
            ].map(kpi => (
              <div key={kpi.label} className="rounded-xl p-2.5"
                style={{ background: 'var(--color-bg-tertiary)' }}>
                <p className="text-[9.5px] text-mut mb-1">{kpi.label}</p>
                <p className="text-[20px] font-bold font-disp text-ink leading-none">{kpi.value}</p>
                <p className="text-[9px] mt-0.5 font-semibold"
                  style={{ color: kpi.ok ? '#1D9E75' : '#854F0B' }}>
                  {kpi.change}
                </p>
              </div>
            ))}
          </div>

          {/* Channel bars */}
          {canaisBars.length > 0 && (
            <div className="rounded-xl p-2.5 mb-3"
              style={{ background: 'var(--color-bg-tertiary)' }}>
              {canaisBars.map(({ canal, pct, cor }) => (
                <div key={canal} className="flex items-center gap-2 mb-1.5 last:mb-0">
                  <span className="text-[10px] font-semibold capitalize flex-shrink-0 w-[60px]"
                    style={{ color: cor }}>{canal}</span>
                  <div className="flex-1 h-[4px] rounded-full overflow-hidden bg-white">
                    <div className="h-full rounded-full" style={{ width: `${pct}%`, background: cor }} />
                  </div>
                  <span className="text-[9.5px] text-mut w-6 text-right">{pct}%</span>
                </div>
              ))}
            </div>
          )}

          {/* Alert */}
          <div className="rounded-xl p-2.5 mb-3" style={{ background: '#FDE8E7' }}>
            <p className="text-[10.5px] font-bold mb-0.5" style={{ color: '#F04E3E' }}>
              Pixel da Meta com problema
            </p>
            <p className="text-[10px] leading-relaxed" style={{ color: '#7B6B8A' }}>
              Evento Lead não registrado desde terça — quer corrigir?
            </p>
          </div>

          {/* CMO Chat */}
          <div className="border rounded-xl overflow-hidden"
            style={{ borderColor: 'var(--color-border-subtle)' }}>
            <p className="text-[10.5px] text-mut px-3 pt-2.5 pb-1 border-b"
              style={{ borderColor: 'var(--color-border-subtle)' }}>
              Pergunte ao seu CMO
            </p>
            <div className="max-h-[180px] overflow-y-auto px-3 py-2 no-scrollbar">
              {chatMsgs.length === 0 && (
                <div className="flex flex-wrap gap-1 pb-1">
                  {['Qual canal performa melhor?', 'Próximo passo?', 'Como crescer?'].map(s => (
                    <button key={s} onClick={() => setChatInput(s)}
                      className="text-[10px] px-2 py-1 rounded-full font-medium transition"
                      style={{ background: 'var(--color-bg-tertiary)', color: '#7B6B8A' }}>
                      {s}
                    </button>
                  ))}
                </div>
              )}
              {chatMsgs.map((m, i) => (
                <div key={i} className={`flex mb-1.5 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className="max-w-[90%] px-2.5 py-1.5 rounded-xl text-[11px] leading-relaxed whitespace-pre-line"
                    style={{
                      background: m.role === 'user' ? '#8B2FC9' : 'var(--color-bg-tertiary)',
                      color: m.role === 'user' ? '#fff' : '#3D4451',
                    }}>
                    {m.text}
                  </div>
                </div>
              ))}
              {enviando && (
                <div className="flex justify-start mb-1.5">
                  <div className="px-2.5 py-1.5 rounded-xl" style={{ background: 'var(--color-bg-tertiary)' }}>
                    <span className="inline-flex gap-0.5">
                      {[0, 1, 2].map(i => (
                        <span key={i} className="w-1 h-1 rounded-full animate-bounce"
                          style={{ animationDelay: `${i * 0.15}s`, background: '#9CA3AF' }} />
                      ))}
                    </span>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>
            <div className="flex items-center gap-1.5 px-2.5 pb-2.5 pt-2 border-t"
              style={{ borderColor: 'var(--color-border-subtle)' }}>
              <input
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && enviarChat()}
                placeholder="Pergunte qualquer coisa…"
                className="flex-1 text-[11.5px] outline-none bg-transparent"
              />
              <button onClick={enviarChat} disabled={enviando || !chatInput.trim()}
                className="w-6 h-6 rounded-lg flex items-center justify-center text-white font-bold text-[12px] transition disabled:opacity-40"
                style={{ background: '#8B2FC9' }}>
                ↑
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Agenda ── */}
      {tab === 'agenda' && (
        <div className="flex-1 p-3">
          <p className="text-[11.5px] font-semibold text-mut mb-3 uppercase tracking-wide">Esta semana</p>
          {[0, 1, 2, 3, 4, 5, 6].map(i => {
            const d = new Date(); d.setDate(d.getDate() + i);
            const hoje = i === 0;
            return (
              <div key={i} className="flex items-center gap-2.5 py-2 border-b last:border-0"
                style={{ borderColor: 'var(--color-border-subtle)' }}>
                <div className="flex flex-col items-center flex-shrink-0 w-8">
                  <span className="text-[9px] text-soft capitalize">
                    {d.toLocaleDateString('pt-BR', { weekday: 'short' })}
                  </span>
                  <span className={`text-[14px] font-bold leading-none mt-0.5 ${hoje ? 'text-brand' : 'text-ink'}`}>
                    {d.getDate()}
                  </span>
                </div>
                {hoje ? (
                  <span className="text-[10.5px] text-mut italic">Hoje</span>
                ) : (
                  <span className="text-[10.5px] text-soft">—</span>
                )}
              </div>
            );
          })}
          <p className="text-[10.5px] text-mut mt-3 text-center">
            Agende posts na fila de aprovação
          </p>
        </div>
      )}

      {/* ── Verba ── */}
      {tab === 'verba' && (
        <div className="flex-1 p-3">
          <p className="text-[11.5px] font-semibold text-mut mb-3 uppercase tracking-wide">Meta Ads</p>
          {[
            { label: 'Teto mensal', value: 400, max: 1000, symbol: '$' },
            { label: 'CPC máximo', value: 2.5, max: 10, symbol: '$' },
          ].map(item => (
            <div key={item.label} className="mb-4">
              <div className="flex justify-between mb-1.5">
                <span className="text-[11px] font-semibold text-ink">{item.label}</span>
                <span className="text-[11px] font-bold" style={{ color: '#8B2FC9' }}>
                  {item.symbol}{item.value}
                </span>
              </div>
              <input type="range" min={0} max={item.max} value={item.value} readOnly
                className="w-full h-1.5 rounded-full appearance-none"
                style={{ background: `linear-gradient(to right, #8B2FC9 ${(item.value/item.max)*100}%, #EDE6F5 0%)` }}
              />
            </div>
          ))}
          <div className="flex items-center justify-between py-3 border-t"
            style={{ borderColor: 'var(--color-border-subtle)' }}>
            <div>
              <p className="text-[11px] font-semibold text-ink">Freio automático</p>
              <p className="text-[10px] text-mut">Para quando atingir o teto</p>
            </div>
            <div className="w-10 h-5 rounded-full relative transition"
              style={{ background: '#8B2FC9' }}>
              <span className="absolute right-0.5 top-0.5 w-4 h-4 rounded-full bg-white shadow" />
            </div>
          </div>
          <p className="text-[10.5px] text-soft text-center mt-3">
            Integração Meta Ads — em breve
          </p>
        </div>
      )}
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function Hoje() {
  const [pendingPosts, setPendingPosts] = useState<PendingPost[]>([]);
  const [radarItems, setRadarItems] = useState<RadarItem[]>([]);
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [stats, setStats] = useState<PanelStats | null>(null);
  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const [gerando, setGerando] = useState(false);
  const [erroGerar, setErroGerar] = useState<string | null>(null);
  const [previewPost, setPreviewPost] = useState<PendingPost | null>(null);

  const fetchData = useCallback(async () => {
    const [postsR, radarR, agendaR, painelR, perfisR] = await Promise.allSettled([
      fetch('/api/posts?status=pending').then(r => r.ok ? r.json() : []),
      fetch('/api/radar').then(r => r.ok ? r.json() : []),
      fetch('/api/agenda').then(r => r.ok ? r.json() : null),
      fetch('/api/painel').then(r => r.ok ? r.json() : null),
      fetch('/api/perfis').then(r => r.ok ? r.json() : []),
    ]);

    if (postsR.status === 'fulfilled') setPendingPosts(postsR.value);
    if (radarR.status === 'fulfilled') setRadarItems((radarR.value as RadarItem[]).slice(0, 5));
    if (agendaR.status === 'fulfilled' && agendaR.value?.campaigns?.[0]) {
      setCampaign(agendaR.value.campaigns[0]);
    }
    if (painelR.status === 'fulfilled') setStats(painelR.value);
    if (perfisR.status === 'fulfilled') {
      const ativo = (perfisR.value as Perfil[]).find(p => p.ativo);
      if (ativo) setPerfil(ativo);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  async function gerarPosts(brief: string) {
    setGerando(true);
    setErroGerar(null);
    try {
      const r = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brief }),
      });
      if (r.ok) {
        const novos = await fetch('/api/posts?status=pending').then(r => r.json());
        setPendingPosts(novos);
      } else {
        const d = await r.json();
        setErroGerar(d.error ?? 'Erro ao gerar posts.');
      }
    } catch {
      setErroGerar('Falha de conexão.');
    } finally {
      setGerando(false);
    }
  }

  async function skipPost(id: string) {
    await fetch('/api/posts', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, action: 'skip' }),
    });
    setPendingPosts(ps => ps.filter(p => p.id !== id));
  }

  async function gerarDoRadar(itemId: string) {
    await fetch('/api/radar/gerar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ radarItemId: itemId }),
    });
    const novos = await fetch('/api/posts?status=pending').then(r => r.json());
    setPendingPosts(novos);
  }

  return (
    <>
      {/* Single render — CSS controls desktop vs mobile layout */}
      <div className="lg:flex lg:flex-col lg:h-full lg:overflow-hidden pb-28 lg:pb-0">
        <TopBar perfil={perfil} />

        {erroGerar && (
          <div className="px-3 py-2 text-[12px] font-medium flex-shrink-0 border-b"
            style={{ background: '#FDE8E7', color: '#F04E3E', borderColor: '#FECACA' }}>
            {erroGerar} <button onClick={() => setErroGerar(null)} className="ml-2 opacity-50">×</button>
          </div>
        )}

        <BriefBar onGerar={gerarPosts} gerando={gerando} />

        {/* Content: grid on desktop, stack on mobile */}
        <div
          className="flex-1 lg:overflow-hidden lg:grid"
          style={{ gridTemplateColumns: '1fr 1fr 320px' }}
        >
          <ColumnA
            posts={pendingPosts}
            radarItems={radarItems}
            onAprovar={p => setPreviewPost(p)}
            onSkip={skipPost}
            onGerarDoRadar={gerarDoRadar}
            gerando={gerando}
          />
          <ColumnB campaign={campaign} />
          <ColumnC stats={stats} />
        </div>
      </div>

      {previewPost && (
        <PreviewModal
          post={previewPost}
          onClose={() => setPreviewPost(null)}
          onDone={id => {
            setPendingPosts(ps => ps.filter(p => p.id !== id));
            setPreviewPost(null);
          }}
        />
      )}
    </>
  );
}
