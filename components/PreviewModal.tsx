'use client';
import { useState } from 'react';
import ImagePicker from '@/components/ImagePicker';

export type PreviewPost = {
  id: string; channel: string; title: string; caption: string;
  hashtags: string | null; format: string; mediaUrl: string | null;
};

function IgMockup({ post }: { post: PreviewPost }) {
  return (
    <div className="bg-white rounded-[18px] overflow-hidden mb-4" style={{ boxShadow: '0 1px 3px rgba(23,38,44,.06),0 4px 14px rgba(23,38,44,.05)' }}>
      {/* Header */}
      <div className="flex items-center gap-2.5 px-3 py-2.5">
        <div className="w-[34px] h-[34px] rounded-full flex items-center justify-center text-white font-bold text-[12.5px] font-disp flex-shrink-0"
          style={{ background: 'linear-gradient(135deg,#8B2FC9,#F04E3E)' }}>FD</div>
        <div>
          <b className="text-[13px] block leading-tight">francisco.dabus</b>
          <small className="text-[11px] text-mut">Orlando, Florida</small>
        </div>
        <span className="ml-auto text-mut font-bold tracking-widest">···</span>
      </div>
      {/* Arte */}
      <div className="aspect-square flex flex-col justify-end relative overflow-hidden"
        style={{ background: 'linear-gradient(160deg,#175E68,#0E2E35)' }}>
        {post.mediaUrl && (
          <>
            <img src={post.mediaUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />
            <span className="absolute inset-0" style={{ background: 'linear-gradient(180deg,rgba(10,24,28,.10) 30%,rgba(10,24,28,.84))' }} />
          </>
        )}
        <div className="relative p-5 text-white font-disp font-semibold text-[19px] leading-snug">
          {post.title}
        </div>
        <span className="absolute bottom-[18px] left-5 text-[10.5px] text-white/75 font-bold tracking-[.08em] uppercase z-10">
          @francisco.dabus
        </span>
      </div>
      {/* Ações */}
      <div className="flex gap-3.5 px-3 pt-2 pb-1 items-center">
        <svg viewBox="0 0 24 24" width="23" height="23" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 21s-7.5-4.6-9.8-9C.7 8.6 2.6 4.9 6.2 4.5c2-.2 3.9.8 5.8 3 1.9-2.2 3.8-3.2 5.8-3 3.6.4 5.5 4.1 4 7.5-2.3 4.4-9.8 9-9.8 9z" /></svg>
        <svg viewBox="0 0 24 24" width="23" height="23" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M21 11.5a8.4 8.4 0 0 1-8.5 8.3 8.6 8.6 0 0 1-3.7-.8L3 21l2.1-5.4A8.1 8.1 0 0 1 4 11.5 8.4 8.4 0 0 1 12.5 3.2 8.4 8.4 0 0 1 21 11.5z" /></svg>
        <svg viewBox="0 0 24 24" width="23" height="23" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" /></svg>
        <svg viewBox="0 0 24 24" width="23" height="23" fill="none" stroke="currentColor" strokeWidth="1.8" className="ml-auto"><path d="M19 21l-7-5-7 5V4a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1z" /></svg>
      </div>
      <p className="px-3 pb-1 text-[12.5px] font-semibold">Curtido por você e outras pessoas</p>
      <p className="px-3 pb-3 text-[12.5px]">
        <b>francisco.dabus</b>{' '}
        {post.caption.slice(0, 120)}{post.caption.length > 120 ? '…' : ''}
        {post.hashtags && <span className="text-[#0A66C2]"> {post.hashtags}</span>}
      </p>
    </div>
  );
}

function LiMockup({ post }: { post: PreviewPost }) {
  const capPreview = post.caption.slice(0, 220);
  const truncated = post.caption.length > 220;
  return (
    <div className="bg-white rounded-[18px] overflow-hidden mb-4" style={{ boxShadow: '0 1px 3px rgba(23,38,44,.06),0 4px 14px rgba(23,38,44,.05)' }}>
      <div className="flex gap-2.5 px-3 pt-3 pb-2">
        <div className="w-[40px] h-[40px] rounded-full flex items-center justify-center text-white font-bold text-[13px] font-disp flex-shrink-0"
          style={{ background: 'linear-gradient(135deg,#8B2FC9,#F04E3E)' }}>FD</div>
        <div>
          <b className="text-[13.5px] block">Francisco Dabus</b>
          {process.env.NEXT_PUBLIC_USER_HEADLINE && (
            <small className="text-[11px] text-mut leading-snug block">{process.env.NEXT_PUBLIC_USER_HEADLINE}</small>
          )}
          <small className="text-[11px] text-mut">Agora · 🌐</small>
        </div>
      </div>
      <p className="px-3 pb-2 text-[13px]" style={{ whiteSpace: 'pre-line' }}>
        {capPreview}{truncated && <span className="text-mut">… ver mais</span>}
      </p>
      <div className="mx-3 mb-3 rounded-xl p-4 font-disp font-semibold text-[15px]" style={{ background: '#F2F6F8', color: '#0A3552' }}>
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

type Fase = 'preview' | 'agendar' | 'enviando' | 'ok' | 'erro';

export default function PreviewModal({ post, onClose, onDone }: {
  post: PreviewPost;
  onClose: () => void;
  onDone: (id: string) => void;
}) {
  const [fase, setFase] = useState<Fase>('preview');
  const [dataHora, setDataHora] = useState('');
  const [erroMsg, setErroMsg] = useState('');
  const [caption, setCaption] = useState(post.caption);
  const [mediaUrl, setMediaUrl] = useState(post.mediaUrl);
  const [corrigindo, setCorrigindo] = useState(false);
  const [mostrarPicker, setMostrarPicker] = useState(false);

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
      if (r.ok && data.caption) setCaption(data.caption);
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
        setErroMsg(data.error ?? 'Erro desconhecido do Ayrshare');
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
      className="fixed inset-0 z-50 flex items-end justify-center"
      style={{ background: 'rgba(23,38,44,.5)' }}
      onClick={e => { if (e.target === e.currentTarget && fase !== 'enviando') onClose(); }}
    >
      <div
        className="bg-fundo rounded-t-[26px] w-full max-w-[430px] max-h-[90vh] overflow-y-auto"
        style={{ paddingBottom: 'calc(22px + env(safe-area-inset-bottom))' }}
      >
        {/* Handle */}
        <div className="w-[42px] h-[5px] bg-[#D4B8EF] rounded-full mx-auto mt-3 mb-4" />

        {/* Cabeçalho */}
        {(fase === 'preview' || fase === 'agendar') && (
          <div className="flex items-center justify-between px-4 mb-3">
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
              {post.channel === 'linkedin' ? <LiMockup post={postAtual} /> : <IgMockup post={postAtual} />}

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
                    <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.123.553 4.116 1.524 5.849L0 24l6.293-1.506A11.94 11.94 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.8 9.8 0 0 1-5.031-1.383l-.36-.214-3.733.894.944-3.632-.235-.374A9.818 9.818 0 0 1 2.182 12c0-5.421 4.397-9.818 9.818-9.818 5.421 0 9.818 4.397 9.818 9.818 0 5.421-4.397 9.818-9.818 9.818z"/></svg>
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
              <p className="text-[13px] text-mut mb-4">
                Escolha data e hora para publicar no <b className="text-ink">{post.channel}</b>.
              </p>
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
              <div className="rounded-2xl px-4 py-4 mb-4 border" style={{ background: '#FEF2F2', borderColor: '#FECACA' }}>
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
