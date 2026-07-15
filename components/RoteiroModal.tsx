'use client';
import { useState } from 'react';
import type { VideoScript } from '@/lib/claude';

const CANAL_LABEL: Record<string, string> = {
  reels: '🎬 Instagram Reels',
  tiktok: '🎵 TikTok',
  shorts: '▶ YouTube Shorts',
};

const DURACAO_COLOR: Record<string, string> = {
  '15s': '#0F6E56', '30s': '#0A66C2', '60s': '#8B2FC9', '90s': '#C97F16',
};

function CopyButton({ text }: { text: string }) {
  const [copiado, setCopiado] = useState(false);
  async function copiar() {
    await navigator.clipboard.writeText(text);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 1800);
  }
  return (
    <button onClick={copiar}
      className="text-[11px] font-semibold px-2.5 py-1 rounded-full transition active:scale-95 flex-shrink-0"
      style={{ background: copiado ? '#E1F5EE' : '#F0E8FA', color: copiado ? '#0F6E56' : '#8B2FC9' }}>
      {copiado ? '✓ Copiado' : 'Copiar'}
    </button>
  );
}

function Secao({ label, children, extra }: {
  label: string; children: React.ReactNode; extra?: React.ReactNode;
}) {
  return (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-1.5">
        <p className="text-[11px] font-bold uppercase tracking-wide text-mut">{label}</p>
        {extra}
      </div>
      {children}
    </div>
  );
}

export default function RoteiroModal({
  roteiro,
  onClose,
  onCriarPost,
}: {
  roteiro: VideoScript;
  onClose: () => void;
  onCriarPost?: (legenda: string, hashtags: string, canal: string) => void;
}) {
  const [criando, setCriando] = useState(false);

  async function criarPost() {
    if (!onCriarPost) return;
    setCriando(true);
    const canal = roteiro.canal === 'reels' ? 'instagram'
      : roteiro.canal === 'tiktok' ? 'tiktok'
      : 'instagram';
    onCriarPost(roteiro.legenda, roteiro.hashtags, canal);
    setCriando(false);
    onClose();
  }

  const textoCompleto = [
    `TÍTULO: ${roteiro.titulo}`,
    `CANAL: ${CANAL_LABEL[roteiro.canal] ?? roteiro.canal} · ${roteiro.duracao}`,
    `\nGANCHO (primeiros 3s):\n${roteiro.gancho}`,
    `\nROTEIRO:\n${roteiro.pontos.join('\n')}`,
    `\nCTA FINAL:\n${roteiro.cta}`,
    `\nLEGENDA:\n${roteiro.legenda}`,
    `\nHASHTAGS:\n${roteiro.hashtags}`,
    `\nMÚSICA SUGERIDA:\n${roteiro.musicaSugerida}`,
  ].join('\n');

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ background: 'rgba(23,38,44,.55)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-fundo rounded-[20px] w-full max-w-[480px] max-h-[90vh] overflow-y-auto pb-6">

        {/* Header */}
        <div className="flex items-center justify-between px-4 pt-5 pb-3 border-b" style={{ borderColor: '#EDE6F5' }}>
          <div>
            <h2 className="font-disp text-[17px] font-bold">Roteiro de Vídeo</h2>
            <p className="text-[11.5px] text-mut mt-0.5">
              {CANAL_LABEL[roteiro.canal] ?? roteiro.canal}
              <span className="ml-2 font-bold px-2 py-0.5 rounded-full text-white text-[10px]"
                style={{ background: DURACAO_COLOR[roteiro.duracao] ?? '#8B2FC9' }}>
                {roteiro.duracao}
              </span>
            </p>
          </div>
          <button onClick={onClose} className="text-mut text-[13px] font-semibold">Fechar</button>
        </div>

        <div className="px-4 pt-4">

          {/* Título */}
          <div className="rounded-2xl px-4 py-3 mb-4 flex items-start justify-between gap-3"
            style={{ background: 'linear-gradient(135deg,#F5F0FF,#FDF8FF)', border: '1.5px solid #EDE6F5' }}>
            <p className="font-disp font-bold text-[16px] text-ink leading-snug flex-1">{roteiro.titulo}</p>
            <CopyButton text={roteiro.titulo} />
          </div>

          {/* Gancho */}
          <Secao label="🎣 Gancho — primeiros 3 segundos" extra={<CopyButton text={roteiro.gancho} />}>
            <div className="rounded-2xl px-4 py-3" style={{ background: '#FFF8E6', border: '1.5px solid #FDE68A' }}>
              <p className="text-[13.5px] font-semibold text-ink leading-snug">{roteiro.gancho}</p>
            </div>
          </Secao>

          {/* Roteiro / Pontos */}
          <Secao label="🎬 Roteiro" extra={<CopyButton text={roteiro.pontos.join('\n')} />}>
            <div className="space-y-2">
              {roteiro.pontos.map((p, i) => {
                const [tempo, ...resto] = p.split(':');
                const texto = resto.join(':').trim();
                return (
                  <div key={i} className="flex gap-3 items-start rounded-xl px-3 py-2.5"
                    style={{ background: '#F5F0FF' }}>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 mt-0.5"
                      style={{ background: '#8B2FC9', color: '#fff' }}>{tempo.trim()}</span>
                    <p className="text-[12.5px] text-ink leading-snug">{texto || p}</p>
                  </div>
                );
              })}
            </div>
          </Secao>

          {/* CTA */}
          <Secao label="📢 CTA final" extra={<CopyButton text={roteiro.cta} />}>
            <div className="rounded-2xl px-4 py-3" style={{ background: '#E8F5E9', border: '1.5px solid #A5D6A7' }}>
              <p className="text-[13px] font-semibold" style={{ color: '#1B5E20' }}>{roteiro.cta}</p>
            </div>
          </Secao>

          {/* Legenda */}
          <Secao label="📝 Legenda para publicar" extra={<CopyButton text={roteiro.legenda + '\n\n' + roteiro.hashtags} />}>
            <div className="rounded-2xl px-4 py-3" style={{ background: '#F0F4F5' }}>
              <p className="text-[12.5px] text-ink leading-relaxed" style={{ whiteSpace: 'pre-line' }}>
                {roteiro.legenda}
              </p>
              <p className="text-[11.5px] mt-2" style={{ color: '#0A66C2' }}>{roteiro.hashtags}</p>
            </div>
          </Secao>

          {/* Música */}
          <Secao label="🎵 Música sugerida">
            <div className="rounded-2xl px-4 py-3 flex items-center gap-3" style={{ background: '#FDF8FF' }}>
              <span className="text-[20px]">🎧</span>
              <p className="text-[12.5px] text-mut italic">{roteiro.musicaSugerida}</p>
            </div>
          </Secao>

          {/* Ações */}
          <div className="flex gap-2 mt-2">
            <button
              onClick={() => navigator.clipboard.writeText(textoCompleto)}
              className="flex-1 py-3 rounded-2xl font-semibold text-[13px] transition active:scale-95"
              style={{ background: '#F0E8FA', color: '#8B2FC9' }}
            >
              📋 Copiar tudo
            </button>
            {onCriarPost && (
              <button
                onClick={criarPost}
                disabled={criando}
                className="flex-[2] py-3 rounded-2xl text-white font-semibold text-[13px] transition active:scale-95 disabled:opacity-60"
                style={{ background: 'linear-gradient(135deg,#8B2FC9,#F04E3E)' }}
              >
                {criando ? '…' : '✦ Criar post da legenda'}
              </button>
            )}
          </div>
          <p className="text-[11px] text-soft text-center mt-2">
            Grave o vídeo usando este roteiro, faça upload e publique com a legenda acima.
          </p>

        </div>
      </div>
    </div>
  );
}
