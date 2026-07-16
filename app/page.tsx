'use client';
import { useEffect, useState, useRef, useCallback } from 'react';
import PreviewModal from '@/components/PreviewModal';
import type { PreviewPost } from '@/components/PreviewModal';
import RoteiroModal from '@/components/RoteiroModal';
import ArtigoModal from '@/components/ArtigoModal';
import type { VideoScript } from '@/lib/claude';

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
  ayrshareId: string | null;
};

type Campaign = { id: string; name: string; posts: JourneyPost[] };

type PanelStats = {
  totais: { posts: number; publicados: number; pendentes: number; agendados: number };
  ultimos7: { publicados: number };
  porCanal: Record<string, number>;
};

type Perfil = { id: string; displayName: string; avatarColor: string; ativo: boolean };

type AdSettings = {
  monthlyBudget: number; maxCPC: number;
  autoBrake: boolean; boostWinners: boolean;
  metaConnected: boolean;
};

// ─── Helpers ───────────────────────────────────────────────────────────────────

function cleanCampaignName(raw: string): string {
  const lc = raw.trim().toLowerCase();
  // "post para linkedin sobre seguro de saude" → "Seguro de Saúde · Linkedin"
  const m1 = lc.match(/(?:post(?:agem)?\s+)?(?:para\s+(\w+)\s+)?(?:sobre|de)\s+(.+)/);
  if (m1) {
    const canal = m1[1] ? m1[1].charAt(0).toUpperCase() + m1[1].slice(1) : '';
    const tema = m1[2].trim().replace(/\b\w/g, c => c.toUpperCase());
    return canal ? `${tema} · ${canal}` : tema;
  }
  // Fallback: title-case + truncate
  return raw.trim().replace(/\b\w/g, c => c.toUpperCase()).slice(0, 50);
}

// ─── Constants ─────────────────────────────────────────────────────────────────

const CANAL_COR: Record<string, string> = {
  instagram: '#C13584', facebook: '#1877F2', linkedin: '#0A66C2', tiktok: '#000'
};
const CANAL_GRAD: Record<string, string> = {
  instagram: 'linear-gradient(135deg,#833ab4,#fd1d1d,#fcb045)',
  facebook:  'linear-gradient(135deg,#1877F2,#0551B5)',
  linkedin:  'linear-gradient(135deg,#0A66C2,#084B8A)',
  tiktok:    'linear-gradient(135deg,#010101,#69C9D0)',
};
const STAGE_COR: Record<string, { bg: string; text: string }> = {
  atrair:    { bg: '#FEF8DC', text: '#854F0B' },
  educar:    { bg: '#E5F1F0', text: '#0E5F66' },
  conectar:  { bg: '#FBEAF0', text: '#993556' },
  converter: { bg: '#E1F5EE', text: '#0F6E56' },
};

// ─── TopBar ────────────────────────────────────────────────────────────────────

function TopBar({ perfil, allPerfis, onSwitch }: {
  perfil: Perfil | null;
  allPerfis: Perfil[];
  onSwitch: (id: string) => void;
}) {
  const [showPopover, setShowPopover] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);
  const h = new Date().getHours();
  const saudacao = h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite';
  const dataFmt = new Date().toLocaleDateString('pt-BR', {
    weekday: 'long', day: 'numeric', month: 'long',
  });

  useEffect(() => {
    if (!showPopover) return;
    function close(e: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setShowPopover(false);
      }
    }
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [showPopover]);

  return (
    <div className="h-11 flex items-center px-3.5 gap-2 flex-shrink-0 border-b"
      style={{ background: '#fff', borderColor: 'var(--color-border-subtle)' }}>
      <span className="text-[14px] font-medium text-ink flex-shrink-0">
        {saudacao}, Francisco
      </span>
      <div className="relative flex-shrink-0" ref={popoverRef}>
        <button
          className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full transition"
          style={{ background: '#F0E8FA' }}
          onClick={() => setShowPopover(v => !v)}>
          <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: '#F04E3E' }} />
          <span className="text-[11px] font-semibold" style={{ color: '#8B2FC9' }}>
            {perfil?.displayName ?? ''}
          </span>
          {allPerfis.length > 1 && (
            <span className="text-[9px] leading-none" style={{ color: '#8B2FC9' }}>▾</span>
          )}
        </button>
        {showPopover && allPerfis.length > 1 && (
          <div className="absolute top-full left-0 mt-1 w-[192px] bg-white rounded-2xl shadow-lg z-50 overflow-hidden"
            style={{ border: '1px solid var(--color-border-subtle)' }}>
            {allPerfis.map(p => {
              const initials = (p.displayName ?? '').split(/\s+/).map((w: string) => w[0]).slice(0, 2).join('').toUpperCase();
              const isF = (p.displayName ?? '').toLowerCase().includes('francisco');
              const isV = (p.displayName ?? '').toLowerCase().includes('vip');
              const avatarBg = isF ? 'linear-gradient(135deg,#8B2FC9,#F04E3E)' : isV ? '#1D9E75' : (p.avatarColor || '#8B2FC9');
              return (
                <button key={p.id}
                  onClick={() => { onSwitch(p.id); setShowPopover(false); }}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 text-left transition hover:bg-[#FDF8FF]"
                  style={{ borderBottom: '1px solid var(--color-border-subtle)' }}>
                  <div className="w-7 h-7 rounded-lg flex-shrink-0 flex items-center justify-center text-white text-[11px] font-bold"
                    style={{ background: avatarBg }}>
                    {initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-semibold text-ink truncate">{p.displayName}</p>
                    {p.ativo && <p className="text-[9.5px] font-medium" style={{ color: '#0F6E56' }}>● Ativo</p>}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
      <span className="ml-auto text-[11px] text-soft capitalize hidden lg:block">{dataFmt}</span>
    </div>
  );
}

// ─── BriefBar ──────────────────────────────────────────────────────────────────

const CANAL_LABEL: Record<string, string> = {
  instagram: 'IG', facebook: 'FB', linkedin: 'LI', tiktok: 'TT',
};

function BriefBar({ onGerar, onRoteiro, onArtigo, gerando, canaisAtivos }: {
  onGerar: (b: string, canal?: string) => Promise<void>;
  onRoteiro: (b: string) => Promise<void>;
  onArtigo: (b: string) => void;
  gerando: boolean;
  canaisAtivos: string[];
}) {
  const [brief, setBrief] = useState('');
  const [gerandoRoteiro, setGerandoRoteiro] = useState(false);
  const [canalPin, setCanalPin] = useState<string | null>(null);

  async function submit() {
    if (!brief.trim() || gerando) return;
    const b = brief;
    setBrief('');
    await onGerar(b, canalPin ?? undefined);
  }

  async function submitRoteiro() {
    if (!brief.trim() || gerandoRoteiro) return;
    const b = brief;
    setBrief('');
    setGerandoRoteiro(true);
    try { await onRoteiro(b); } finally { setGerandoRoteiro(false); }
  }

  function submitArtigo() {
    if (!brief.trim()) return;
    const b = brief;
    setBrief('');
    onArtigo(b);
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
          disabled={gerando || gerandoRoteiro}
        />
        {/* Botão artigo */}
        <button
          onClick={submitArtigo}
          disabled={gerando || gerandoRoteiro || !brief.trim()}
          title="Escrever artigo longo com pesquisa real"
          className="flex-shrink-0 px-2.5 py-1.5 rounded-xl text-[13px] font-semibold transition disabled:opacity-40 active:scale-95"
          style={{ background: '#E8F4FF', color: '#0A66C2' }}
        >
          📄
        </button>
        {/* Botão roteiro */}
        <button
          onClick={submitRoteiro}
          disabled={gerandoRoteiro || gerando || !brief.trim()}
          title="Gerar roteiro de vídeo"
          className="flex-shrink-0 px-2.5 py-1.5 rounded-xl text-[13px] font-semibold transition disabled:opacity-40 active:scale-95"
          style={{ background: '#F0E8FA', color: '#8B2FC9' }}
        >
          {gerandoRoteiro ? '…' : '🎬'}
        </button>
        {/* Botão posts */}
        <button
          onClick={submit}
          disabled={gerando || gerandoRoteiro || !brief.trim()}
          className="flex-shrink-0 px-3 py-1.5 rounded-xl text-white text-[13px] font-semibold transition disabled:opacity-40 active:scale-95"
          style={{ background: 'linear-gradient(135deg,#8B2FC9,#F04E3E)' }}
        >
          {gerando ? '…' : '→'}
        </button>
      </div>
      <div className="flex items-center gap-1.5 mt-1.5 justify-center">
        <span className="text-[10px] text-soft">→ posts</span>
        {canaisAtivos.length > 1 && (
          <>
            <span className="text-[10px] text-soft">·</span>
            {canaisAtivos.map(c => (
              <button key={c}
                onClick={() => setCanalPin(prev => prev === c ? null : c)}
                className="text-[9.5px] font-bold px-2 py-0.5 rounded-full transition"
                style={{
                  background: canalPin === c ? (CANAL_COR[c] ?? '#8B2FC9') : 'var(--color-bg-tertiary)',
                  color: canalPin === c ? '#fff' : (CANAL_COR[c] ?? '#9CA3AF'),
                }}>
                {CANAL_LABEL[c] ?? c}
              </button>
            ))}
            {canalPin && (
              <button onClick={() => setCanalPin(null)}
                className="text-[9px] text-soft underline leading-none">
                auto
              </button>
            )}
          </>
        )}
        <span className="text-[10px] text-soft">· <span className="font-semibold">🎬</span> roteiro · <span className="font-semibold">📄</span> artigo</span>
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
        <span className="absolute top-2 left-2 flex items-center gap-1 text-white text-[9px] font-bold px-2 py-0.5 rounded-full uppercase z-10"
          style={{ background: 'rgba(0,0,0,.45)' }}>
          {post.format === 'story' && <span>📱</span>}
          {post.channel}{post.format === 'story' ? ' · Story' : ''}
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

function RadarCard({ item, perfilNome, canaisAtivos, onGerar }: {
  item: RadarItem; perfilNome?: string; canaisAtivos: string[];
  onGerar: (canal: string) => void;
}) {
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [canal, setCanal] = useState<string>(() => canaisAtivos[0] ?? 'instagram');

  async function handle() {
    setLoading(true);
    await onGerar(canal);
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
        <p className="text-[10px] text-soft mt-0.5">
          {item.sourceName}{item.sourceName && perfilNome ? ' · ' : ''}
          {perfilNome && (
            <span className="font-semibold" style={{ color: '#8B2FC9' }}>via Radar · {perfilNome}</span>
          )}
        </p>
        {canaisAtivos.length > 1 && !done && (
          <div className="flex gap-1 mt-1.5">
            {canaisAtivos.map(c => (
              <button key={c} onClick={() => setCanal(c)}
                className="text-[9px] font-bold px-1.5 py-0.5 rounded-full transition"
                style={{
                  background: canal === c ? (CANAL_COR[c] ?? '#8B2FC9') : 'var(--color-bg-tertiary)',
                  color: canal === c ? '#fff' : (CANAL_COR[c] ?? '#9CA3AF'),
                }}>
                {CANAL_LABEL[c] ?? c}
              </button>
            ))}
          </div>
        )}
      </div>
      <button onClick={handle} disabled={loading || done || canaisAtivos.length === 0}
        className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold transition active:scale-95 disabled:opacity-60"
        style={{ background: done ? '#E6F4EE' : '#F0E8FA', color: done ? '#17996B' : '#8B2FC9', fontSize: 14 }}>
        {loading ? '…' : done ? '✓' : '✦'}
      </button>
    </div>
  );
}

// ─── Column A ──────────────────────────────────────────────────────────────────

function ColumnA({ posts, radarItems, perfilNome, canaisAtivos, onAprovar, onSkip, onGerarDoRadar, gerando }: {
  posts: PendingPost[];
  radarItems: RadarItem[];
  perfilNome?: string;
  canaisAtivos: string[];
  onAprovar: (p: PendingPost) => void;
  onSkip: (id: string) => void;
  onGerarDoRadar: (id: string, canal: string) => Promise<void>;
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
              perfilNome={perfilNome}
              canaisAtivos={canaisAtivos}
              onGerar={(canal) => onGerarDoRadar(item.id, canal)}
            />
          ))}
        </>
      )}
    </div>
  );
}

// ─── Column B ──────────────────────────────────────────────────────────────────

function ColumnB({ campaign, onDeletar }: {
  campaign: Campaign | null;
  onDeletar: (postId: string) => Promise<void>;
}) {
  const [verificando, setVerificando] = useState(false);
  const [verificarMsg, setVerificarMsg] = useState<{ ok: boolean; texto: string } | null>(null);
  const [deletandoId, setDeletandoId] = useState<string | null>(null);

  async function verificarStatus() {
    setVerificando(true);
    setVerificarMsg(null);
    try {
      const r = await fetch('/api/posts/verificar', { method: 'POST' });
      const data = await r.json() as { verificados?: number; fantasmas?: number; error?: string };
      if (!r.ok) {
        setVerificarMsg({ ok: false, texto: data.error ?? 'Erro ao verificar' });
        return;
      }
      const v = data.verificados ?? 0;
      const f = data.fantasmas ?? 0;
      setVerificarMsg({
        ok: true,
        texto: v === 0
          ? 'Nenhum post publicado para verificar'
          : f > 0
            ? `${f} removido${f > 1 ? 's' : ''} externamente (de ${v} verificado${v > 1 ? 's' : ''})`
            : `${v} post${v > 1 ? 's' : ''} verificado${v > 1 ? 's' : ''} — tudo ok`,
      });
      if (f > 0) window.dispatchEvent(new Event('cenario-changed'));
    } catch {
      setVerificarMsg({ ok: false, texto: 'Falha de conexão' });
    } finally {
      setVerificando(false);
      setTimeout(() => setVerificarMsg(null), 6000);
    }
  }

  async function handleDeletar(postId: string, titulo: string) {
    if (!window.confirm(`Apagar "${titulo}" das redes sociais?\n\nEsta ação não pode ser desfeita.`)) return;
    setDeletandoId(postId);
    try {
      await onDeletar(postId);
    } finally {
      setDeletandoId(null);
    }
  }

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

  const posts = campaign.posts.filter(p => p.status !== 'skipped' && p.status !== 'deleted');
  const publicados = posts.filter(p => p.status === 'published').length;
  const pct = posts.length > 0 ? Math.round((publicados / posts.length) * 100) : 0;

  return (
    <div className="overflow-y-auto p-3.5 border-r no-scrollbar"
      style={{ borderColor: 'var(--color-border-subtle)', background: 'var(--color-bg-tertiary)' }}>

      {/* Campaign header */}
      <div className="rounded-2xl p-3.5 mb-3"
        style={{ background: 'linear-gradient(135deg,#8B2FC9,#F04E3E)' }}>
        <p className="text-[9.5px] font-semibold mb-0.5" style={{ color: 'rgba(255,255,255,.75)' }}>
          Campanha ativa
        </p>
        <p className="text-[13px] font-medium text-white mb-2.5 leading-snug">{cleanCampaignName(campaign.name)}</p>
        <div className="h-[4px] rounded-full mb-1.5" style={{ background: 'rgba(255,255,255,.2)' }}>
          <div className="h-full rounded-full" style={{ width: `${pct}%`, background: 'rgba(255,255,255,.8)' }} />
        </div>
        <p className="text-[10px]" style={{ color: 'rgba(255,255,255,.7)' }}>
          {publicados} de {posts.length} publicados · {pct}% concluído
        </p>
      </div>

      {/* Verificar status */}
      <div className="flex items-center gap-2 mb-3.5">
        <button
          onClick={verificarStatus}
          disabled={verificando}
          className="text-[10px] font-semibold px-2.5 py-1 rounded-full transition disabled:opacity-50"
          style={{ background: '#F3F0F9', color: '#8B2FC9' }}>
          {verificando ? 'Verificando…' : '↻ Verificar status'}
        </button>
        {verificarMsg && (
          <span className="text-[10px] font-medium" style={{ color: verificarMsg.ok ? '#0F6E56' : '#F04E3E' }}>
            {verificarMsg.texto}
          </span>
        )}
      </div>

      {/* Journey timeline */}
      {posts.map((p, idx) => {
        const isDelExt = p.status === 'deleted_externally';
        const isDone   = p.status === 'published';
        const isNow    = p.status === 'pending' || p.status === 'approved';
        const isLast   = idx === posts.length - 1;
        const dt = p.scheduledAt ?? p.publishedAt;
        const dtLabel = dt
          ? new Date(dt).toLocaleDateString('pt-BR', {
              weekday: 'short', day: 'numeric',
              hour: '2-digit', minute: '2-digit'
            })
          : null;
        const stage = STAGE_COR[p.stage ?? ''] ?? { bg: '#F3F0F9', text: '#9CA3AF' };
        const dotBorder = isDelExt ? '#D1D5DB' : isDone ? '#1D9E75' : isNow ? '#F04E3E' : '#D1D5DB';
        const dotBg     = isDelExt ? '#F9FAFB' : isDone ? '#1D9E75' : isNow ? 'rgba(240,78,62,.1)' : '#fff';

        return (
          <div key={p.id} className="flex gap-2">
            {/* Dot + line */}
            <div className="flex flex-col items-center flex-shrink-0">
              <div className="w-[14px] h-[14px] rounded-full border-2 flex items-center justify-center"
                style={{ borderColor: dotBorder, background: dotBg }}>
                {isDone   && <span className="text-[7px] text-white font-bold">✓</span>}
                {isNow    && <span className="w-[4px] h-[4px] rounded-full block" style={{ background: '#F04E3E' }} />}
                {isDelExt && <span className="text-[7px] font-bold" style={{ color: '#9CA3AF' }}>✕</span>}
              </div>
              {!isLast && <div className="w-px flex-1 mt-0.5" style={{ background: '#E5E7EB' }} />}
            </div>

            {/* Content */}
            <div className="flex-1 pb-3 pt-0.5 min-w-0">
              <div className="flex items-center gap-1 mb-0.5 flex-wrap">
                {p.stage && !isDelExt && (
                  <span className="text-[8.5px] font-bold px-1.5 py-0.5 rounded-full"
                    style={{ background: stage.bg, color: stage.text }}>
                    {p.stage}
                  </span>
                )}
                {isDelExt && (
                  <span className="text-[8.5px] font-semibold px-1.5 py-0.5 rounded-full"
                    style={{ background: '#FEF8DC', color: '#854F0B' }}>
                    Removido no Instagram
                  </span>
                )}
                {!isDelExt && (
                  <span className="text-[8.5px] font-semibold capitalize"
                    style={{ color: CANAL_COR[p.channel] ?? '#9CA3AF' }}>
                    {p.channel}
                  </span>
                )}
              </div>
              <p className={`text-[12px] font-semibold leading-snug line-clamp-2 ${isDelExt ? 'line-through opacity-50' : 'text-ink'}`}>
                {p.title}
              </p>
              <p className="text-[10px] text-mut mt-0.5">
                {isDelExt
                  ? 'Removido manualmente fora do app'
                  : dtLabel ?? (isNow ? 'Aguardando aprovação' : 'Sem data')}
              </p>
            </div>

            {/* Botão apagar — só para posts publicados com ayrshareId */}
            {isDone && p.ayrshareId && (
              <button
                onClick={() => handleDeletar(p.id, p.title)}
                disabled={deletandoId === p.id}
                title="Apagar publicação"
                className="flex-shrink-0 mt-1 w-[22px] h-[22px] rounded-full flex items-center justify-center transition hover:bg-red-50 disabled:opacity-40"
                style={{ color: '#D1D5DB', fontSize: 11 }}>
                {deletandoId === p.id ? '…' : '🗑'}
              </button>
            )}
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

  // Verba tab state
  const [adSettings, setAdSettings] = useState<AdSettings | null>(null);
  const [adLoading, setAdLoading] = useState(false);
  const [adSaved, setAdSaved] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Agenda tab state
  const [agendaPosts, setAgendaPosts] = useState<JourneyPost[] | null>(null);
  const [agendaLoading, setAgendaLoading] = useState(false);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMsgs]);

  useEffect(() => {
    if (tab === 'verba' && !adSettings && !adLoading) {
      setAdLoading(true);
      fetch('/api/ads-settings')
        .then(r => r.ok ? r.json() : null)
        .then(d => { if (d) setAdSettings(d); })
        .finally(() => setAdLoading(false));
    }
  }, [tab, adSettings, adLoading]);

  useEffect(() => {
    if (tab !== 'agenda') return;
    setAgendaLoading(true);
    const hoje = new Date();
    const from = hoje.toISOString().slice(0, 10);
    const to = new Date(hoje.getTime() + 6 * 86_400_000).toISOString().slice(0, 10);
    fetch(`/api/agenda?from=${from}&to=${to}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (d) setAgendaPosts(
          (d.posts as JourneyPost[]).filter((p: JourneyPost) => p.scheduledAt || p.publishedAt)
        );
      })
      .finally(() => setAgendaLoading(false));
  }, [tab]);

  function showSaved() {
    setAdSaved(true);
    setTimeout(() => setAdSaved(false), 2000);
  }

  function handleSlider(field: 'monthlyBudget' | 'maxCPC', value: number) {
    setAdSettings(s => s ? { ...s, [field]: value } : s);
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      fetch('/api/ads-settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: value }),
      }).then(r => r.ok && showSaved());
    }, 800);
  }

  async function handleToggle(field: 'autoBrake' | 'boostWinners', value: boolean) {
    setAdSettings(s => s ? { ...s, [field]: value } : s);
    const r = await fetch('/api/ads-settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ [field]: value }),
    });
    if (r.ok) showSaved();
  }

  async function enviarChat(textoOverride?: string) {
    const q = (textoOverride ?? chatInput).trim();
    if (!q || enviando) return;
    if (!textoOverride) setChatInput('');
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

          {/* KPI 2×2 — dados reais + placeholders honestos */}
          <div className="grid grid-cols-2 gap-2 mb-3">
            <div className="rounded-xl p-2.5" style={{ background: 'var(--color-bg-tertiary)' }}>
              <p className="text-[9.5px] text-mut mb-1">Posts publicados</p>
              <p className="text-[20px] font-bold font-disp text-ink leading-none">
                {stats?.totais.publicados ?? '—'}
              </p>
              <p className="text-[9px] mt-0.5 font-semibold" style={{ color: '#1D9E75' }}>
                ↑{stats?.ultimos7.publicados ?? 0} esta semana
              </p>
            </div>
            <div className="rounded-xl p-2.5" style={{ background: 'var(--color-bg-tertiary)' }}>
              <p className="text-[9.5px] text-mut mb-1">Na fila</p>
              <p className="text-[20px] font-bold font-disp text-ink leading-none">
                {(stats?.totais.pendentes ?? 0) + (stats?.totais.agendados ?? 0)}
              </p>
              <p className="text-[9px] mt-0.5 font-semibold text-soft">pendentes + agendados</p>
            </div>
            <div className="col-span-2 rounded-xl p-2.5" style={{ background: 'var(--color-bg-tertiary)' }}>
              <p className="text-[9.5px] text-mut mb-1">ROAS · Custo/lead · Verba</p>
              <p className="text-[11px] text-soft">
                Requer Meta Ads — configure META_ACCESS_TOKEN no .env para ativar.
              </p>
            </div>
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
              {canaisBars.length === 1 && (
                <p className="text-[9.5px] text-soft text-center italic mt-1.5">Único canal ativo até agora</p>
              )}
            </div>
          )}

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
                    <button key={s} onClick={() => enviarChat(s)}
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
              <button onClick={() => enviarChat()} disabled={enviando || !chatInput.trim()}
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
        <div className="flex-1 p-3 overflow-y-auto no-scrollbar">
          <p className="text-[11.5px] font-semibold text-mut mb-3 uppercase tracking-wide">Esta semana</p>

          {agendaLoading && (
            <p className="text-[12px] text-mut text-center py-8 animate-pulse">Carregando…</p>
          )}

          {!agendaLoading && [0, 1, 2, 3, 4, 5, 6].map(i => {
            const d = new Date(); d.setDate(d.getDate() + i);
            const isoKey = d.toISOString().slice(0, 10);
            const isHoje = i === 0;
            const dayPosts = (agendaPosts ?? []).filter(p => {
              const dt = p.scheduledAt ?? p.publishedAt;
              return dt ? dt.slice(0, 10) === isoKey : false;
            });
            return (
              <div key={i} className="flex items-start gap-2.5 py-2 border-b last:border-0"
                style={{ borderColor: 'var(--color-border-subtle)' }}>
                {/* Coluna da data */}
                <div className="flex flex-col items-center flex-shrink-0 w-8 pt-0.5">
                  <span className="text-[9px] text-soft capitalize">
                    {d.toLocaleDateString('pt-BR', { weekday: 'short' })}
                  </span>
                  <span className={`text-[14px] font-bold leading-none mt-0.5 ${isHoje ? 'text-brand' : 'text-ink'}`}>
                    {d.getDate()}
                  </span>
                </div>
                {/* Posts do dia */}
                <div className="flex-1 min-w-0">
                  {dayPosts.length === 0 ? (
                    <span className="text-[10.5px] text-soft leading-[2.2]">—</span>
                  ) : (
                    <>
                      {dayPosts.slice(0, 3).map(p => (
                        <div key={p.id} className="flex items-center gap-1.5 mb-0.5 last:mb-0">
                          <span className="w-[5px] h-[5px] rounded-full flex-shrink-0"
                            style={{ background: CANAL_COR[p.channel] ?? '#9CA3AF' }} />
                          <p className="text-[10.5px] text-ink font-medium leading-snug truncate">
                            {p.title}
                          </p>
                        </div>
                      ))}
                      {dayPosts.length > 3 && (
                        <p className="text-[9.5px] text-mut mt-0.5">+{dayPosts.length - 3} mais</p>
                      )}
                    </>
                  )}
                </div>
              </div>
            );
          })}

          {agendaPosts !== null && agendaPosts.length === 0 && !agendaLoading && (
            <p className="text-[10.5px] text-mut mt-2 text-center leading-relaxed">
              Nenhum post agendado esta semana.<br />
              <span style={{ color: '#8B2FC9' }}>Agende na fila de aprovação.</span>
            </p>
          )}
        </div>
      )}

      {/* ── Verba ── */}
      {tab === 'verba' && (
        <div className="flex-1 p-3 overflow-y-auto no-scrollbar">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[11.5px] font-semibold text-mut uppercase tracking-wide">Controle de verba</p>
            {adSaved && (
              <span className="text-[10px] font-semibold" style={{ color: '#0F6E56' }}>✓ Salvo</span>
            )}
          </div>

          {adLoading && (
            <p className="text-[12px] text-mut text-center py-8 animate-pulse">Carregando…</p>
          )}

          {adSettings && !adLoading && (
            <>
              {/* Teto mensal */}
              <div className="mb-4">
                <div className="flex justify-between mb-1.5">
                  <span className="text-[11px] font-semibold text-ink">Teto mensal</span>
                  <span className="text-[11px] font-bold" style={{ color: '#8B2FC9' }}>
                    ${adSettings.monthlyBudget.toFixed(0)}
                  </span>
                </div>
                <input type="range" min={100} max={2000} step={50}
                  value={adSettings.monthlyBudget}
                  onChange={e => handleSlider('monthlyBudget', Number(e.target.value))}
                  className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
                  style={{
                    background: `linear-gradient(to right, #8B2FC9 ${((adSettings.monthlyBudget - 100) / 1900) * 100}%, #EDE6F5 0%)`,
                    accentColor: '#8B2FC9',
                  }}
                />
                <div className="flex justify-between text-[9px] text-soft mt-0.5">
                  <span>$100</span><span>$2.000</span>
                </div>
              </div>

              {/* CPC máximo */}
              <div className="mb-4">
                <div className="flex justify-between mb-1.5">
                  <span className="text-[11px] font-semibold text-ink">CPC máximo</span>
                  <span className="text-[11px] font-bold" style={{ color: '#8B2FC9' }}>
                    ${adSettings.maxCPC.toFixed(2)}
                  </span>
                </div>
                <input type="range" min={0.5} max={6} step={0.1}
                  value={adSettings.maxCPC}
                  onChange={e => handleSlider('maxCPC', Number(e.target.value))}
                  className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
                  style={{
                    background: `linear-gradient(to right, #8B2FC9 ${((adSettings.maxCPC - 0.5) / 5.5) * 100}%, #EDE6F5 0%)`,
                    accentColor: '#8B2FC9',
                  }}
                />
                <div className="flex justify-between text-[9px] text-soft mt-0.5">
                  <span>$0,50</span><span>$6,00</span>
                </div>
              </div>

              {/* Toggles */}
              <div className="border-t pt-3" style={{ borderColor: 'var(--color-border-subtle)' }}>
                {[
                  {
                    field: 'autoBrake' as const,
                    label: 'Freio automático',
                    desc: 'Para os anúncios ao atingir o teto mensal',
                    value: adSettings.autoBrake,
                  },
                  {
                    field: 'boostWinners' as const,
                    label: 'Impulsionar vencedores',
                    desc: 'Posts com 2× engajamento médio viram anúncios automaticamente',
                    value: adSettings.boostWinners,
                  },
                ].map(item => (
                  <div key={item.field} className="flex items-center justify-between py-3 border-b last:border-0"
                    style={{ borderColor: 'var(--color-border-subtle)' }}>
                    <div className="flex-1 min-w-0 mr-3">
                      <p className="text-[11px] font-semibold text-ink">{item.label}</p>
                      <p className="text-[10px] text-mut leading-snug">{item.desc}</p>
                    </div>
                    <button
                      onClick={() => handleToggle(item.field, !item.value)}
                      className="relative w-[38px] h-[22px] rounded-full transition-colors flex-shrink-0"
                      style={{ background: item.value ? '#8B2FC9' : '#D4B8EF' }}>
                      <span className="absolute top-[2px] w-[18px] h-[18px] rounded-full bg-white shadow transition-all"
                        style={{ left: item.value ? '18px' : '2px' }} />
                    </button>
                  </div>
                ))}
              </div>

              {/* Status Meta Ads */}
              <div className="mt-3 rounded-xl p-3"
                style={{ background: adSettings.metaConnected ? '#E1F5EE' : '#FEF8DC' }}>
                <p className="text-[10.5px] font-bold mb-0.5"
                  style={{ color: adSettings.metaConnected ? '#0F6E56' : '#854F0B' }}>
                  {adSettings.metaConnected ? '✓ Meta Ads conectado' : '⚠ Meta Ads não conectado'}
                </p>
                {!adSettings.metaConnected && (
                  <p className="text-[10px] leading-relaxed" style={{ color: '#7B6B8A' }}>
                    Adicione META_ACCESS_TOKEN e META_AD_ACCOUNT_ID no .env para ativar o controle de verba real.
                  </p>
                )}
              </div>
            </>
          )}
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
  const [allPerfis, setAllPerfis] = useState<Perfil[]>([]);
  const [canaisAtivos, setCanaisAtivos] = useState<string[]>([]);
  const [gerando, setGerando] = useState(false);
  const [erroGerar, setErroGerar] = useState<string | null>(null);
  const [previewPost, setPreviewPost] = useState<PendingPost | null>(null);
  const [roteiro, setRoteiro] = useState<VideoScript | null>(null);
  const [artigoId, setArtigoId] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    // Fetch profiles + other data in parallel first
    const [postsR, agendaR, painelR, perfisR, canaisR] = await Promise.allSettled([
      fetch('/api/posts?status=pending').then(r => r.ok ? r.json() : []),
      fetch('/api/agenda').then(r => r.ok ? r.json() : null),
      fetch('/api/painel').then(r => r.ok ? r.json() : null),
      fetch('/api/perfis').then(r => r.ok ? r.json() : []),
      fetch('/api/canais/contas').then(r => r.ok ? r.json() : []),
    ]);

    let activeProfileId: string | undefined;
    if (perfisR.status === 'fulfilled') {
      const lista = perfisR.value as Perfil[];
      setAllPerfis(lista);
      const ativo = lista.find(p => p.ativo);
      if (ativo) { setPerfil(ativo); activeProfileId = ativo.id; }
    }

    if (postsR.status === 'fulfilled') setPendingPosts(postsR.value);
    if (agendaR.status === 'fulfilled' && agendaR.value?.campaigns?.[0]) {
      setCampaign(agendaR.value.campaigns[0]);
    }
    if (painelR.status === 'fulfilled') setStats(painelR.value);
    if (canaisR.status === 'fulfilled' && Array.isArray(canaisR.value)) {
      setCanaisAtivos(
        (canaisR.value as { platform: string; status: string }[])
          .filter(c => c.status === 'connected')
          .map(c => c.platform)
      );
    }

    // Fetch radar with the active profile's id so we get only relevant pautas
    const radarUrl = activeProfileId ? `/api/radar?profileId=${activeProfileId}` : '/api/radar';
    const radarData = await fetch(radarUrl).then(r => r.ok ? r.json() : []).catch(() => []);
    setRadarItems((radarData as RadarItem[]).slice(0, 5));
  }, []);

  useEffect(() => {
    fetchData();
    window.addEventListener('cenario-changed', fetchData);
    return () => window.removeEventListener('cenario-changed', fetchData);
  }, [fetchData]);

  async function switchPerfil(id: string) {
    await fetch('/api/perfis', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    await fetchData();
  }

  async function gerarPosts(brief: string, canal?: string) {
    setGerando(true);
    setErroGerar(null);
    try {
      const r = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brief, canal }),
      });
      if (r.ok) {
        const novos = await fetch('/api/posts?status=pending').then(r => r.ok ? r.json() : []);
        setPendingPosts(Array.isArray(novos) ? novos : []);
      } else {
        let errMsg = `Erro ${r.status}`;
        try { const d = await r.json(); errMsg = d.error ?? errMsg; } catch { /* ignora */ }
        setErroGerar(errMsg);
      }
    } catch (err) {
      setErroGerar(err instanceof Error ? err.message : 'Falha de conexão.');
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

  async function gerarRoteiro(brief: string) {
    setErroGerar(null);
    try {
      const r = await fetch('/api/roteiro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brief, profileId: perfil?.id }),
      });
      if (r.ok) {
        const data = await r.json();
        setRoteiro(data);
      } else {
        let errMsg = `Erro ${r.status}`;
        try { const d = await r.json(); errMsg = d.error ?? errMsg; } catch { /* ignora */ }
        setErroGerar(errMsg);
      }
    } catch (err) {
      setErroGerar(err instanceof Error ? err.message : 'Falha de conexão.');
    }
  }

  async function aprovarPost(post: PendingPost) {
    await fetch('/api/posts', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: post.id, action: 'approve' }),
    });
    setPreviewPost(post);
  }

  async function criarPostDoRoteiro(legenda: string, hashtags: string, canal: string) {
    const r = await fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ brief: legenda, canal, formato: 'reel' }),
    });
    if (r.ok) {
      const novos = await fetch('/api/posts?status=pending').then(res => res.json());
      setPendingPosts(novos);
    }
  }

  function iniciarArtigo(brief: string) {
    fetch('/api/artigo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ brief, profileId: perfil?.id }),
    })
      .then(r => r.json())
      .then(d => { if (d.articleId) setArtigoId(d.articleId); })
      .catch(() => setErroGerar('Erro ao iniciar pipeline de artigo.'));
  }

  async function deletarPublicado(postId: string) {
    const r = await fetch('/api/posts', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: postId }),
    });
    if (r.ok) {
      await fetchData();
    } else {
      const d = await r.json() as { error?: string };
      setErroGerar(d.error ?? 'Erro ao apagar publicação.');
    }
  }

  async function gerarDoRadar(itemId: string, canal: string) {
    await fetch('/api/radar/gerar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ radarItemId: itemId, profileId: perfil?.id, canal }),
    });
    const novos = await fetch('/api/posts?status=pending').then(r => r.json());
    setPendingPosts(novos);
  }

  return (
    <>
      {/* Single render — CSS controls desktop vs mobile layout */}
      <div className="lg:flex lg:flex-col lg:h-full lg:overflow-hidden pb-28 lg:pb-0">
        <TopBar perfil={perfil} allPerfis={allPerfis} onSwitch={switchPerfil} />

        {erroGerar && (
          <div className="px-3 py-2 text-[12px] font-medium flex-shrink-0 border-b"
            style={{ background: '#FDE8E7', color: '#F04E3E', borderColor: '#FECACA' }}>
            {erroGerar} <button onClick={() => setErroGerar(null)} className="ml-2 opacity-50">×</button>
          </div>
        )}

        <BriefBar onGerar={gerarPosts} onRoteiro={gerarRoteiro} onArtigo={iniciarArtigo} gerando={gerando} canaisAtivos={canaisAtivos} />

        {/* Content: grid on desktop, stack on mobile */}
        <div
          className="flex-1 lg:overflow-hidden lg:grid"
          style={{ gridTemplateColumns: '1fr 1fr 320px' }}
        >
          <ColumnA
            posts={pendingPosts}
            radarItems={radarItems}
            perfilNome={perfil?.displayName}
            canaisAtivos={canaisAtivos}
            onAprovar={aprovarPost}
            onSkip={skipPost}
            onGerarDoRadar={gerarDoRadar}
            gerando={gerando}
          />
          <ColumnB campaign={campaign} onDeletar={deletarPublicado} />
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

      {roteiro && (
        <RoteiroModal
          roteiro={roteiro}
          onClose={() => setRoteiro(null)}
          onCriarPost={criarPostDoRoteiro}
        />
      )}

      {artigoId && (
        <ArtigoModal
          articleId={artigoId}
          onClose={() => setArtigoId(null)}
          onAprovado={() => {
            setArtigoId(null);
            fetch('/api/posts?status=pending').then(r => r.json()).then(setPendingPosts);
          }}
        />
      )}
    </>
  );
}
