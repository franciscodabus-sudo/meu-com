'use client';
import { useState, useEffect, useRef } from 'react';
import ImagePicker from '@/components/ImagePicker';
import { proximoSlot, toDatetimeLocal, formatarSlot } from '@/lib/cadencia';

export type PreviewPost = {
  id: string; channel: string; title: string; caption: string;
  hashtags: string | null; format: string; mediaUrl: string | null;
};

type ProfileHint = { handle: string; name: string };

function getInitials(name: string): string {
  return name.split(/\s+/).map(w => w[0]?.toUpperCase() ?? '').join('').slice(0, 2) || 'MP';
}

// ─── Instagram mockup ────────────────────────────────────────────────────────

function IgMockup({ post, p }: { post: PreviewPost; p: ProfileHint }) {
  // Imagem composta (gerada pelo pipeline sharp+SVG) já tem gradiente e texto embutidos
  const isComposed = post.mediaUrl?.includes('/composed-');
  return (
    <div className="bg-white rounded-[18px] overflow-hidden mb-3"
      style={{ boxShadow: '0 1px 3px rgba(23,38,44,.06),0 4px 14px rgba(23,38,44,.05)' }}>
      {/* Header */}
      <div className="flex items-center gap-2.5 px-3 py-2.5">
        <div className="w-[34px] h-[34px] rounded-full flex items-center justify-center text-white font-bold text-[12.5px] font-disp flex-shrink-0"
          style={{ background: 'linear-gradient(135deg,#8B2FC9,#F04E3E)' }}>{getInitials(p.name)}</div>
        <div>
          <b className="text-[13px] block leading-tight">{p.handle}</b>
        </div>
        <span className="ml-auto text-mut font-bold tracking-widest">···</span>
      </div>
      {/* Arte: 4:5 se composta (texto já embutido), 1:1 se Pexels direto */}
      {isComposed ? (
        <div className="relative overflow-hidden w-full" style={{ aspectRatio: '4/5' }}>
          <img src={post.mediaUrl!} alt={post.title}
            className="absolute inset-0 w-full h-full object-cover" />
        </div>
      ) : (
        <div className="aspect-square flex flex-col justify-end relative overflow-hidden"
          style={{ background: 'linear-gradient(160deg,#175E68,#0E2E35)' }}>
          {post.mediaUrl && (
            <>
              <img src={post.mediaUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />
              <span className="absolute inset-0"
                style={{ background: 'linear-gradient(180deg,rgba(10,24,28,.10) 30%,rgba(10,24,28,.84))' }} />
            </>
          )}
          <div className="relative p-5 text-white font-disp font-semibold text-[19px] leading-snug">
            {post.title}
          </div>
        </div>
      )}
      {/* Ações */}
      <div className="flex gap-3.5 px-3 pt-2 pb-1 items-center">
        <svg viewBox="0 0 24 24" width="23" height="23" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M12 21s-7.5-4.6-9.8-9C.7 8.6 2.6 4.9 6.2 4.5c2-.2 3.9.8 5.8 3 1.9-2.2 3.8-3.2 5.8-3 3.6.4 5.5 4.1 4 7.5-2.3 4.4-9.8 9-9.8 9z" />
        </svg>
        <svg viewBox="0 0 24 24" width="23" height="23" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M21 11.5a8.4 8.4 0 0 1-8.5 8.3 8.6 8.6 0 0 1-3.7-.8L3 21l2.1-5.4A8.1 8.1 0 0 1 4 11.5 8.4 8.4 0 0 1 12.5 3.2 8.4 8.4 0 0 1 21 11.5z" />
        </svg>
        <svg viewBox="0 0 24 24" width="23" height="23" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
        </svg>
        <svg viewBox="0 0 24 24" width="23" height="23" fill="none" stroke="currentColor" strokeWidth="1.8" className="ml-auto">
          <path d="M19 21l-7-5-7 5V4a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1z" />
        </svg>
      </div>
      {/* Curtidas + legenda COMPLETA */}
      <p className="px-3 pb-1 text-[12.5px] font-semibold">Curtido por você e outras pessoas</p>
      <div className="px-3 pb-4 text-[12.5px]" style={{ whiteSpace: 'pre-line' }}>
        <b>{p.handle}</b>{' '}
        {post.caption}
        {post.hashtags && (
          <span className="text-[#0A66C2]"> {post.hashtags}</span>
        )}
      </div>
    </div>
  );
}

// ─── TikTok mockup ───────────────────────────────────────────────────────────

function TikTokMockup({ post, p }: { post: PreviewPost; p: ProfileHint }) {
  return (
    <div className="flex justify-center mb-3">
      {/* Frame 9:16 */}
      <div className="relative rounded-[22px] overflow-hidden flex flex-col"
        style={{ width: 220, height: 391, background: '#010101' }}>
        {/* Foto/fundo */}
        {post.mediaUrl
          ? <>
              <img src={post.mediaUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />
              <span className="absolute inset-0"
                style={{ background: 'linear-gradient(180deg,rgba(0,0,0,.20) 0%,rgba(0,0,0,.05) 30%,rgba(0,0,0,.70) 65%)' }} />
            </>
          : <div className="absolute inset-0" style={{ background: 'linear-gradient(160deg,#010101 60%,#1a1a2e)' }} />
        }

        {/* Ícones à direita */}
        <div className="absolute right-2 bottom-16 flex flex-col items-center gap-3.5 z-10">
          {/* Avatar */}
          <div className="relative">
            <div className="w-8 h-8 rounded-full border-2 border-white flex items-center justify-center text-white font-bold text-[10px]"
              style={{ background: 'linear-gradient(135deg,#8B2FC9,#F04E3E)' }}>{getInitials(p.name)}</div>
            <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-[#FE2C55] flex items-center justify-center text-white text-[9px] font-bold">+</span>
          </div>
          {/* Curtir */}
          <div className="flex flex-col items-center gap-0.5">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="white">
              <path d="M12 21s-7.5-4.6-9.8-9C.7 8.6 2.6 4.9 6.2 4.5c2-.2 3.9.8 5.8 3 1.9-2.2 3.8-3.2 5.8-3 3.6.4 5.5 4.1 4 7.5-2.3 4.4-9.8 9-9.8 9z" />
            </svg>
            <span className="text-white text-[9px] font-semibold">1,2 mil</span>
          </div>
          {/* Comentar */}
          <div className="flex flex-col items-center gap-0.5">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="white">
              <path d="M21 11.5a8.4 8.4 0 0 1-8.5 8.3 8.6 8.6 0 0 1-3.7-.8L3 21l2.1-5.4A8.1 8.1 0 0 1 4 11.5 8.4 8.4 0 0 1 12.5 3.2 8.4 8.4 0 0 1 21 11.5z" />
            </svg>
            <span className="text-white text-[9px] font-semibold">48</span>
          </div>
          {/* Compartilhar */}
          <div className="flex flex-col items-center gap-0.5">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="white">
              <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
            </svg>
            <span className="text-white text-[9px] font-semibold">Salvar</span>
          </div>
          {/* Disco de música */}
          <div className="w-8 h-8 rounded-full border-2 border-white/30 flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg,#333,#111)' }}>
            <span className="text-[11px]">♪</span>
          </div>
        </div>

        {/* Info à esquerda/baixo */}
        <div className="absolute left-3 bottom-12 right-14 z-10">
          <p className="text-white font-bold text-[10.5px] mb-1">@{p.handle}</p>
          <p className="text-white text-[10px] leading-snug mb-1.5" style={{
            display: '-webkit-box', WebkitLineClamp: 4,
            WebkitBoxOrient: 'vertical', overflow: 'hidden', whiteSpace: 'pre-line',
          }}>
            {post.caption}
          </p>
          {post.hashtags && (
            <p className="text-white/80 text-[9px] font-semibold">{post.hashtags}</p>
          )}
        </div>

        {/* Barra de música (rodapé) */}
        <div className="absolute bottom-0 left-0 right-0 flex items-center gap-2 px-3 py-2 z-10"
          style={{ background: 'linear-gradient(0deg,rgba(0,0,0,.6),transparent)' }}>
          <span className="text-[10px]">🎵</span>
          <p className="text-white text-[9px] truncate flex-1">Som original · {p.handle}</p>
          <div className="w-6 h-6 rounded-full border border-white/30 flex items-center justify-center"
            style={{ background: '#111' }}>
            <span className="text-[8px]">♪</span>
          </div>
        </div>

        {/* Borda */}
        <div className="absolute inset-0 rounded-[22px] pointer-events-none"
          style={{ border: '1.5px solid rgba(255,255,255,.08)' }} />
      </div>
    </div>
  );
}

// ─── Instagram Story mockup (9:16) ───────────────────────────────────────────

function StoryMockup({ post, p }: { post: PreviewPost; p: ProfileHint }) {
  return (
    <div className="flex justify-center mb-3">
      {/* Frame 9:16 — largura fixa 220px, altura 391px */}
      <div className="relative rounded-[22px] overflow-hidden flex flex-col"
        style={{ width: 220, height: 391, background: 'linear-gradient(160deg,#1A0A2E,#3D2070)' }}>
        {/* Foto de fundo */}
        {post.mediaUrl && (
          <>
            <img src={post.mediaUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />
            <span className="absolute inset-0"
              style={{ background: 'linear-gradient(180deg,rgba(10,10,20,.45) 0%,rgba(10,10,20,.10) 40%,rgba(10,10,20,.75) 75%)' }} />
          </>
        )}

        {/* Barra de progresso (decorativa) */}
        <div className="relative flex gap-[3px] px-2.5 pt-2.5 z-10">
          {[1, 2, 3].map(i => (
            <div key={i} className="flex-1 h-[2.5px] rounded-full"
              style={{ background: i === 1 ? '#fff' : 'rgba(255,255,255,.35)' }} />
          ))}
        </div>

        {/* Header */}
        <div className="relative flex items-center gap-1.5 px-2.5 pt-2 pb-1 z-10">
          <div className="w-[22px] h-[22px] rounded-full flex items-center justify-center text-white font-bold text-[8px] flex-shrink-0"
            style={{ background: 'linear-gradient(135deg,#8B2FC9,#F04E3E)' }}>{getInitials(p.name)}</div>
          <span className="text-white font-semibold text-[9.5px]">{p.handle}</span>
          <span className="text-white/60 text-[9px] ml-0.5">· Agora</span>
        </div>

        {/* Conteúdo central */}
        <div className="relative flex-1 flex flex-col justify-end px-3 pb-8 z-10">
          <p className="text-white font-disp font-bold text-[15px] leading-snug mb-1.5">
            {post.title}
          </p>
          {post.caption && (
            <p className="text-white/90 text-[10px] leading-relaxed" style={{ whiteSpace: 'pre-line' }}>
              {post.caption}
            </p>
          )}
          {post.hashtags && (
            <p className="text-white/70 text-[9px] mt-1">{post.hashtags}</p>
          )}
        </div>

        {/* Deslize para cima */}
        <div className="absolute bottom-3 left-0 right-0 flex flex-col items-center z-10">
          <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="white" strokeWidth="2.5">
            <polyline points="18 15 12 9 6 15" />
          </svg>
          <span className="text-white/80 text-[8.5px] font-semibold mt-0.5">Deslize para cima</span>
        </div>

        {/* Borda de frame de telefone */}
        <div className="absolute inset-0 rounded-[22px] pointer-events-none"
          style={{ border: '1.5px solid rgba(255,255,255,.12)' }} />
      </div>
    </div>
  );
}

// ─── Artigo mockup (LinkedIn Article / blog) ──────────────────────────────────

function ArtigoMockup({ post, p }: { post: PreviewPost; p: ProfileHint }) {
  const sections = post.caption.split(/\n## |\n# /).filter(Boolean);
  return (
    <div className="bg-white rounded-[18px] overflow-hidden mb-3"
      style={{ boxShadow: '0 1px 3px rgba(23,38,44,.06),0 4px 14px rgba(23,38,44,.05)' }}>
      {/* Cover strip */}
      <div className="h-[64px] flex items-center justify-center text-[28px]"
        style={{ background: 'linear-gradient(135deg,#8B2FC9,#0A66C2)' }}>
        📄
      </div>
      <div className="px-4 pt-3 pb-4">
        {/* Author */}
        <div className="flex gap-2 items-center mb-3">
          <div className="w-[32px] h-[32px] rounded-full flex items-center justify-center text-white text-[11px] font-bold"
            style={{ background: 'linear-gradient(135deg,#8B2FC9,#F04E3E)' }}>{getInitials(p.name)}</div>
          <div>
            <p className="text-[12px] font-semibold leading-none">{p.name}</p>
            <p className="text-[10px] text-mut">Artigo · LinkedIn</p>
          </div>
        </div>
        {/* Title */}
        <h2 className="font-disp font-bold text-[16px] text-ink leading-snug mb-1">{post.title}</h2>
        {/* Body preview (first 2 sections) */}
        <div className="text-[12px] text-mut leading-relaxed line-clamp-6 mb-2"
          style={{ whiteSpace: 'pre-line' }}>
          {sections.slice(0, 2).join('\n\n')}
        </div>
        {sections.length > 2 && (
          <p className="text-[11px]" style={{ color: '#0A66C2' }}>… mais {sections.length - 2} seções</p>
        )}
        {/* Hashtags */}
        {post.hashtags && (
          <p className="text-[11px] mt-2" style={{ color: '#0A66C2' }}>{post.hashtags}</p>
        )}
      </div>
    </div>
  );
}

// ─── LinkedIn mockup ──────────────────────────────────────────────────────────

function LiMockup({ post, p }: { post: PreviewPost; p: ProfileHint }) {
  return (
    <div className="bg-white rounded-[18px] overflow-hidden mb-3"
      style={{ boxShadow: '0 1px 3px rgba(23,38,44,.06),0 4px 14px rgba(23,38,44,.05)' }}>
      <div className="flex gap-2.5 px-3 pt-3 pb-2">
        <div className="w-[40px] h-[40px] rounded-full flex items-center justify-center text-white font-bold text-[13px] font-disp flex-shrink-0"
          style={{ background: 'linear-gradient(135deg,#8B2FC9,#F04E3E)' }}>{getInitials(p.name)}</div>
        <div>
          <b className="text-[13.5px] block">{p.name}</b>
          {process.env.NEXT_PUBLIC_USER_HEADLINE && (
            <small className="text-[11px] text-mut leading-snug block">{process.env.NEXT_PUBLIC_USER_HEADLINE}</small>
          )}
          <small className="text-[11px] text-mut">Agora · 🌐</small>
        </div>
      </div>
      {/* Legenda COMPLETA */}
      <div className="px-3 pb-2 text-[13px]" style={{ whiteSpace: 'pre-line' }}>
        {post.caption}
        {post.hashtags && (
          <span className="text-[#0A66C2]"> {post.hashtags}</span>
        )}
      </div>
      <div className="mx-3 mb-3 rounded-xl p-4 font-disp font-semibold text-[15px]"
        style={{ background: '#F2F6F8', color: '#0A3552' }}>
        {post.title}
        <small className="block font-sans font-normal text-[11px] text-mut mt-1.5">{post.format}</small>
      </div>
      <div className="flex justify-between px-3 pb-2 text-[11.5px] text-mut">
        <span>👍💡❤️ 12</span><span>3 comentários</span>
      </div>
      <div className="flex border-t border-[#EDF1F2]">
        {['👍 Gostei', '💬 Comentar', '↗ Compartilhar'].map(a => (
          <span key={a} className="flex-1 text-center py-2.5 text-[12px] font-semibold text-mut">{a}</span>
        ))}
      </div>
    </div>
  );
}

// ─── Modal principal ──────────────────────────────────────────────────────────

type Fase = 'preview' | 'agendar' | 'enviando' | 'ok' | 'erro';

export default function PreviewModal({ post, onClose, onDone, profile }: {
  post: PreviewPost;
  onClose: () => void;
  onDone: (id: string) => void;
  profile?: ProfileHint;
}) {
  const p: ProfileHint = profile ?? { handle: 'meu.perfil', name: 'Perfil' };
  const [fase, setFase]               = useState<Fase>('preview');
  const [dataHora, setDataHora]       = useState('');
  const [erroMsg, setErroMsg]         = useState('');
  const [caption, setCaption]         = useState(post.caption);
  const [mediaUrl, setMediaUrl]       = useState(post.mediaUrl);
  const [corrigindo, setCorrigindo]   = useState(false);
  const [mostrarPicker, setMostrarPicker] = useState(false);
  const [slotSugerido, setSlotSugerido]   = useState<Date | null>(null);
  const [editandoCaption, setEditandoCaption] = useState(false);
  const [captionRascunho, setCaptionRascunho] = useState(caption);
  const [salvandoCaption, setSalvandoCaption] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    fetch('/api/configuracoes')
      .then(r => r.ok ? r.json() : null)
      .then(cfg => {
        if (!cfg?.publicacaoHorarios) return;
        const horarios: string[] = JSON.parse(cfg.publicacaoHorarios);
        const slot = proximoSlot(horarios);
        if (slot) setSlotSugerido(slot);
      })
      .catch(() => {});
  }, []);

  // Auto-resize do textarea
  useEffect(() => {
    if (editandoCaption && textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
      textareaRef.current.focus();
    }
  }, [editandoCaption]);

  const temVerificar = caption.includes('[verificar]');
  const postAtual = { ...post, caption, mediaUrl };

  async function trocarImagem(url: string) {
    setMediaUrl(url);
    setMostrarPicker(false);
    await fetch('/api/posts', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: post.id, action: 'updateMedia', mediaUrl: url }),
    });
  }

  function abrirEdicao() {
    setCaptionRascunho(caption);
    setEditandoCaption(true);
  }

  async function salvarCaption() {
    setSalvandoCaption(true);
    try {
      await fetch('/api/posts', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: post.id, action: 'caption', caption: captionRascunho }),
      });
      setCaption(captionRascunho);
      setEditandoCaption(false);
    } finally {
      setSalvandoCaption(false);
    }
  }

  const minDataHora = new Date(Date.now() + 5 * 60 * 1000).toISOString().slice(0, 16);

  async function corrigirComIA() {
    setCorrigindo(true);
    try {
      const r = await fetch('/api/corrigir-post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId: post.id })
      });
      const data = await r.json();
      if (r.ok && data.caption) {
        setCaption(data.caption);
        setCaptionRascunho(data.caption);
      }
    } finally {
      setCorrigindo(false);
    }
  }

  async function publicar(scheduleDate?: string) {
    setFase('enviando');
    try {
      const r = await fetch('/api/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId: post.id, agora: !scheduleDate, scheduleDate })
      });
      const data = await r.json();
      if (!r.ok) {
        setErroMsg(data.error ?? 'Erro desconhecido');
        setFase('erro');
      } else {
        setFase('ok');
      }
    } catch {
      setErroMsg('Falha de conexão. Verifique sua internet e tente novamente.');
      setFase('erro');
    }
  }

  const dataHoraFormatada = dataHora
    ? new Date(dataHora).toLocaleString('pt-BR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
    : '';

  return (
    <>
      {mostrarPicker && (
        <ImagePicker
          queryInicial={post.title}
          onSelect={trocarImagem}
          onClose={() => setMostrarPicker(false)}
        />
      )}
      <div
        className="fixed inset-0 z-50 flex items-center justify-center px-4"
        style={{ background: 'rgba(23,38,44,.5)' }}
        onClick={e => { if (e.target === e.currentTarget && fase !== 'enviando') onClose(); }}
      >
        <div className="bg-fundo rounded-[20px] w-full max-w-[480px] max-h-[90vh] overflow-y-auto pb-6">

          {/* Cabeçalho */}
          {(fase === 'preview' || fase === 'agendar') && (
            <div className="flex items-center justify-between px-4 pt-5 pb-3">
              <h2 className="font-disp text-[17px] font-bold">
                {fase === 'preview' ? `Prévia · ${post.channel}` : 'Agendar publicação'}
              </h2>
              <button onClick={onClose} className="text-mut text-[13px] font-semibold">Fechar</button>
            </div>
          )}

          <div className="px-4">

            {/* ── PREVIEW ── */}
            {fase === 'preview' && (
              <>
                {/* Mockup (legenda completa dentro) */}
                {post.format === 'artigo'
                  ? <ArtigoMockup post={postAtual} p={p} />
                  : post.channel === 'linkedin'
                    ? <LiMockup post={postAtual} p={p} />
                    : post.channel === 'tiktok'
                      ? <TikTokMockup post={postAtual} p={p} />
                      : post.format === 'story'
                        ? <StoryMockup post={postAtual} p={p} />
                        : <IgMockup post={postAtual} p={p} />
                }

                {/* Edição de legenda */}
                {!editandoCaption ? (
                  <button
                    onClick={abrirEdicao}
                    className="w-full py-2.5 rounded-xl text-[13px] font-semibold mb-3 transition active:scale-95 flex items-center justify-center gap-2"
                    style={{ background: '#F5F0FF', color: '#8B2FC9' }}
                  >
                    ✏️ Editar texto
                  </button>
                ) : (
                  <div className="mb-3 rounded-2xl overflow-hidden border" style={{ borderColor: '#C4A8E8' }}>
                    <textarea
                      ref={textareaRef}
                      value={captionRascunho}
                      onChange={e => {
                        setCaptionRascunho(e.target.value);
                        e.target.style.height = 'auto';
                        e.target.style.height = e.target.scrollHeight + 'px';
                      }}
                      className="w-full px-4 pt-3 pb-2 text-[13.5px] leading-relaxed font-sans outline-none resize-none"
                      style={{ background: '#FDF8FF', color: '#17283A', minHeight: '120px' }}
                      placeholder="Legenda do post…"
                    />
                    <div className="flex gap-2 px-3 pb-3 bg-[#FDF8FF]">
                      <button
                        onClick={() => setEditandoCaption(false)}
                        className="flex-1 py-2 rounded-xl text-[13px] font-semibold"
                        style={{ background: '#EDE6F5', color: '#7B6B8A' }}
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={salvarCaption}
                        disabled={salvandoCaption}
                        className="flex-[2] py-2 rounded-xl text-[13px] font-semibold text-white transition active:scale-95 disabled:opacity-60"
                        style={{ background: '#8B2FC9' }}
                      >
                        {salvandoCaption ? 'Salvando…' : '✓ Salvar edição'}
                      </button>
                    </div>
                  </div>
                )}

                {/* Trocar imagem */}
                <button
                  onClick={() => setMostrarPicker(true)}
                  className="w-full py-2.5 rounded-xl text-[13px] font-semibold mb-3 transition active:scale-95"
                  style={{ background: '#F0F4F5', color: '#37575D' }}
                >
                  🖼 Trocar imagem
                </button>

                {/* CTA WhatsApp — só mostra quando o caption tem link wa.me */}
                {(() => {
                  const waMatch = caption.match(/https?:\/\/wa\.me\/[\d+]+/);
                  if (!waMatch) return null;
                  return (
                    <a
                      href={waMatch[0]}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-[13px] font-semibold mb-3 transition active:scale-95"
                      style={{ background: '#25D366', color: '#fff' }}
                    >
                      <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                        <path d="M12 0C5.373 0 0 5.373 0 12c0 2.123.553 4.116 1.524 5.849L0 24l6.293-1.506A11.94 11.94 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.8 9.8 0 0 1-5.031-1.383l-.36-.214-3.733.894.944-3.632-.235-.374A9.818 9.818 0 0 1 2.182 12c0-5.421 4.397-9.818 9.818-9.818 5.421 0 9.818 4.397 9.818 9.818 0 5.421-4.397 9.818-9.818 9.818z"/>
                      </svg>
                      Abrir no WhatsApp
                    </a>
                  );
                })()}

                {/* Aviso [verificar] */}
                {temVerificar && (
                  <div className="rounded-2xl px-4 py-3 mb-3 border"
                    style={{ background: '#FFFBEB', borderColor: '#FDE68A' }}>
                    <p className="text-[13px] font-semibold mb-0.5" style={{ color: '#92400E' }}>
                      ⚠️ Este post tem um dado não verificado
                    </p>
                    <p className="text-[12px] mb-2" style={{ color: '#B45309' }}>
                      O texto contém <b>[verificar]</b>. Corrija antes de publicar.
                    </p>
                    <button
                      onClick={corrigirComIA}
                      disabled={corrigindo}
                      className="w-full py-2 rounded-xl text-[13px] font-semibold transition disabled:opacity-60"
                      style={{ background: '#F59E0B', color: '#fff' }}
                    >
                      {corrigindo ? '✦ Corrigindo…' : '✦ Corrigir com IA'}
                    </button>
                  </div>
                )}

                {/* Publicar / Agendar */}
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={() => publicar()}
                    disabled={temVerificar}
                    className="flex-[2] py-3.5 rounded-2xl text-white font-semibold text-[14px] active:scale-95 transition disabled:opacity-40 disabled:cursor-not-allowed"
                    style={{ background: 'var(--brand-gradient)' }}
                  >
                    🚀 Publicar agora
                  </button>
                  <button
                    onClick={() => setFase('agendar')}
                    disabled={temVerificar}
                    className="flex-1 py-3.5 rounded-2xl font-semibold text-[14px] active:scale-95 transition disabled:opacity-40 disabled:cursor-not-allowed"
                    style={{ background: '#F0E8FA', color: '#8B2FC9' }}
                  >
                    📅 Agendar
                  </button>
                </div>
              </>
            )}

            {/* ── AGENDAR ── */}
            {fase === 'agendar' && (
              <>
                <p className="text-[13px] text-mut mb-3">
                  Escolha data e hora para publicar no <b className="text-ink">{post.channel}</b>.
                </p>

                {slotSugerido && !dataHora && (
                  <button
                    onClick={() => setDataHora(toDatetimeLocal(slotSugerido))}
                    className="w-full flex items-center gap-2.5 px-4 py-3 rounded-2xl mb-3 text-left transition active:scale-95"
                    style={{ background: '#F0E8FA', border: '1.5px solid #D4B8EF' }}
                  >
                    <span className="text-[18px]">✦</span>
                    <div>
                      <p className="text-[12px] font-bold" style={{ color: '#8B2FC9' }}>Próximo slot sugerido</p>
                      <p className="text-[13px] font-semibold text-ink">{formatarSlot(slotSugerido)}</p>
                    </div>
                    <span className="ml-auto text-[12px] font-semibold" style={{ color: '#8B2FC9' }}>Usar →</span>
                  </button>
                )}

                <input
                  type="datetime-local"
                  min={minDataHora}
                  value={dataHora}
                  onChange={e => setDataHora(e.target.value)}
                  className="w-full border border-[#E0E8EA] rounded-2xl px-4 py-3.5 text-[14px] mb-4 font-sans font-semibold outline-none focus:border-brand"
                  style={{ background: '#FDF8FF', color: '#8B2FC9' }}
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => setFase('preview')}
                    className="flex-1 py-3.5 rounded-2xl font-semibold text-[14px] text-mut"
                    style={{ background: '#EDE6F5' }}
                  >
                    ← Voltar
                  </button>
                  <button
                    disabled={!dataHora}
                    onClick={() => publicar(new Date(dataHora).toISOString())}
                    className="flex-[2] py-3.5 rounded-2xl text-white font-semibold text-[14px] disabled:opacity-40 active:scale-95 transition"
                    style={{ background: '#8B2FC9' }}
                  >
                    Confirmar agendamento
                  </button>
                </div>
              </>
            )}

            {/* ── ENVIANDO ── */}
            {fase === 'enviando' && (
              <div className="py-16 text-center">
                <p className="text-[36px] mb-3 animate-pulse">✦</p>
                <p className="text-[15px] font-semibold text-ink">Enviando para o {post.channel}…</p>
                <p className="text-[12px] text-mut mt-1">Isso leva alguns segundos</p>
              </div>
            )}

            {/* ── OK ── */}
            {fase === 'ok' && (
              <div className="py-12 text-center">
                <p className="text-[52px] mb-3">🎉</p>
                <p className="font-disp text-[22px] font-bold text-ink mb-2">
                  {dataHora ? 'Agendado!' : 'Publicado!'}
                </p>
                <p className="text-[13px] text-mut mb-8">
                  {dataHora
                    ? `Será publicado em ${dataHoraFormatada} no ${post.channel}.`
                    : `Seu post foi ao ar agora no ${post.channel}.`}
                </p>
                <button
                  onClick={() => { onDone(post.id); onClose(); }}
                  className="w-full py-3.5 rounded-2xl text-white font-semibold text-[15px] active:scale-95 transition"
                  style={{ background: '#F04E3E' }}
                >
                  Ótimo ✓
                </button>
              </div>
            )}

            {/* ── ERRO ── */}
            {fase === 'erro' && (
              <>
                <div className="rounded-2xl px-4 py-4 mb-4 border"
                  style={{ background: '#FEF2F2', borderColor: '#FECACA' }}>
                  <p className="font-semibold mb-1 text-[14px]" style={{ color: '#991B1B' }}>Falha ao publicar</p>
                  <p className="text-[13px]" style={{ color: '#B91C1C' }}>{erroMsg}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setFase('preview')}
                    className="flex-1 py-3.5 rounded-2xl font-semibold text-[14px] text-mut"
                    style={{ background: '#EDE6F5' }}
                  >
                    ← Voltar
                  </button>
                  <button
                    onClick={() => publicar(dataHora ? new Date(dataHora).toISOString() : undefined)}
                    className="flex-[2] py-3.5 rounded-2xl text-white font-semibold text-[14px] active:scale-95 transition"
                    style={{ background: '#F04E3E' }}
                  >
                    Tentar novamente
                  </button>
                </div>
              </>
            )}

          </div>
        </div>
      </div>
    </>
  );
}
