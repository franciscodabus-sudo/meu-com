'use client';
import { useEffect, useRef, useState } from 'react';

type PexelsPhoto = {
  id: number;
  src: { large: string; medium: string; tiny: string };
  alt: string;
  photographer: string;
};

type MediaAsset = {
  id: string;
  url: string;
  source: string;
  tags: string | null;
  createdAt: string;
};

type Aba = 'buscar' | 'salvos' | 'upload';

async function salvarMidia(url: string, tags?: string) {
  await fetch('/api/imagens/salvar', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url, tags, source: 'pexels' }),
  });
}

export default function ImagePicker({
  queryInicial,
  onSelect,
  onClose,
}: {
  queryInicial?: string;
  onSelect: (url: string) => void;
  onClose: () => void;
}) {
  const [aba, setAba] = useState<Aba>('buscar');
  const [query, setQuery] = useState(queryInicial ?? '');
  const [fotos, setFotos] = useState<PexelsPhoto[]>([]);
  const [buscando, setBuscando] = useState(false);
  const [erroBusca, setErroBusca] = useState<string | null>(null);
  const [salvos, setSalvos] = useState<MediaAsset[]>([]);
  const [carregandoSalvos, setCarregandoSalvos] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [erroUpload, setErroUpload] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (queryInicial) buscar(queryInicial);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (aba === 'salvos') carregarSalvos();
  }, [aba]);

  async function buscar(q?: string) {
    const termo = (q ?? query).trim();
    if (!termo) return;
    setBuscando(true);
    setErroBusca(null);
    try {
      const r = await fetch(`/api/imagens?q=${encodeURIComponent(termo)}&page=1`);
      if (!r.ok) {
        const d = await r.json();
        setErroBusca(d.error ?? 'Erro ao buscar imagens');
        setFotos([]);
      } else {
        const d = await r.json();
        setFotos(d.photos ?? []);
        if (d.photos?.length === 0) setErroBusca('Nenhuma imagem encontrada para esse termo');
      }
    } catch {
      setErroBusca('Falha de conexão');
    } finally {
      setBuscando(false);
    }
  }

  async function carregarSalvos() {
    setCarregandoSalvos(true);
    try {
      const r = await fetch('/api/imagens/salvar');
      if (r.ok) setSalvos(await r.json());
    } finally {
      setCarregandoSalvos(false);
    }
  }

  async function escolherPexels(foto: PexelsPhoto) {
    await salvarMidia(foto.src.large, foto.alt);
    onSelect(foto.src.large);
  }

  async function fazerUpload(file: File) {
    setUploading(true);
    setErroUpload(null);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const r = await fetch('/api/imagens/upload', { method: 'POST', body: fd });
      const d = await r.json();
      if (!r.ok) { setErroUpload(d.error ?? 'Erro ao enviar'); return; }
      onSelect(d.url);
    } catch {
      setErroUpload('Falha ao enviar. Tente novamente.');
    } finally {
      setUploading(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center"
      style={{ background: 'rgba(23,38,44,.55)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="bg-fundo rounded-t-[26px] w-full max-w-[430px] max-h-[88vh] flex flex-col"
        style={{ paddingBottom: 'calc(16px + env(safe-area-inset-bottom))' }}
      >
        {/* Handle */}
        <div className="w-[42px] h-[5px] bg-[#CDD8DB] rounded-full mx-auto mt-3 mb-3 flex-shrink-0" />

        {/* Header */}
        <div className="flex items-center justify-between px-4 mb-3 flex-shrink-0">
          <h2 className="font-disp text-[17px] font-bold">Trocar imagem</h2>
          <button onClick={onClose} className="text-mut text-[13px] font-semibold">Fechar</button>
        </div>

        {/* Abas */}
        <div className="flex gap-1 px-4 mb-3 flex-shrink-0">
          {([['buscar', 'Buscar'], ['salvos', 'Salvos'], ['upload', 'Enviar']] as [Aba, string][]).map(([a, label]) => (
            <button
              key={a}
              onClick={() => setAba(a)}
              className="flex-1 py-2 rounded-xl text-[13px] font-semibold transition"
              style={{
                background: aba === a ? '#0E5F66' : '#F0F4F5',
                color: aba === a ? '#fff' : '#6B7E85',
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-4">

          {/* ── BUSCAR ── */}
          {aba === 'buscar' && (
            <>
              <div className="flex gap-2 mb-3">
                <input
                  type="search"
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && buscar()}
                  placeholder="Ex: seguro de vida, família, casa..."
                  className="flex-1 border border-[#E0E8EA] rounded-xl px-3.5 py-2.5 text-[13.5px] outline-none focus:border-brand"
                  style={{ background: '#F6F8F8' }}
                />
                <button
                  onClick={() => buscar()}
                  disabled={buscando || !query.trim()}
                  className="px-4 rounded-xl text-white text-[13px] font-semibold disabled:opacity-50 transition active:scale-95"
                  style={{ background: '#0E5F66' }}
                >
                  {buscando ? '…' : 'Buscar'}
                </button>
              </div>

              {erroBusca && (
                <p className="text-[12.5px] text-center py-4" style={{ color: '#B91C1C' }}>{erroBusca}</p>
              )}

              {buscando && (
                <p className="text-[13px] text-mut text-center py-8 animate-pulse">Buscando imagens…</p>
              )}

              {!buscando && fotos.length > 0 && (
                <div className="grid grid-cols-2 gap-2 pb-4">
                  {fotos.map(foto => (
                    <button
                      key={foto.id}
                      onClick={() => escolherPexels(foto)}
                      className="rounded-xl overflow-hidden aspect-video relative group active:scale-95 transition"
                    >
                      <img
                        src={foto.src.medium}
                        alt={foto.alt}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                      <span className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition flex items-center justify-center">
                        <span className="opacity-0 group-hover:opacity-100 text-white text-[11px] font-semibold bg-black/60 px-2 py-1 rounded-full transition">
                          Usar esta
                        </span>
                      </span>
                    </button>
                  ))}
                </div>
              )}

              {!buscando && fotos.length === 0 && !erroBusca && (
                <div className="text-center py-10">
                  <p className="text-[28px] mb-2">🔍</p>
                  <p className="text-[13px] text-mut">Digite um termo e toque em Buscar</p>
                </div>
              )}
            </>
          )}

          {/* ── SALVOS ── */}
          {aba === 'salvos' && (
            <>
              {carregandoSalvos && (
                <p className="text-[13px] text-mut text-center py-8 animate-pulse">Carregando…</p>
              )}
              {!carregandoSalvos && salvos.length === 0 && (
                <div className="text-center py-10">
                  <p className="text-[28px] mb-2">📁</p>
                  <p className="text-[13px] text-mut">Nenhuma imagem salva ainda</p>
                  <p className="text-[12px] text-soft mt-1">Busque e escolha imagens — elas aparecerão aqui</p>
                </div>
              )}
              {!carregandoSalvos && salvos.length > 0 && (
                <div className="grid grid-cols-2 gap-2 pb-4">
                  {salvos.map(asset => (
                    <button
                      key={asset.id}
                      onClick={() => onSelect(asset.url)}
                      className="rounded-xl overflow-hidden aspect-video relative group active:scale-95 transition"
                    >
                      <img
                        src={asset.url}
                        alt={asset.tags ?? ''}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                      <span className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition flex items-center justify-center">
                        <span className="opacity-0 group-hover:opacity-100 text-white text-[11px] font-semibold bg-black/60 px-2 py-1 rounded-full transition">
                          Usar esta
                        </span>
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </>
          )}

          {/* ── UPLOAD ── */}
          {aba === 'upload' && (
            <div className="pb-4">
              {erroUpload && (
                <div className="rounded-xl px-4 py-3 mb-3 text-[13px]" style={{ background: '#FEF2F2', color: '#B91C1C' }}>
                  {erroUpload}
                </div>
              )}
              <input
                ref={inputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={e => {
                  const file = e.target.files?.[0];
                  if (file) fazerUpload(file);
                }}
              />
              <button
                onClick={() => inputRef.current?.click()}
                disabled={uploading}
                className="w-full border-2 border-dashed rounded-2xl py-12 flex flex-col items-center gap-2 text-mut transition active:scale-95 disabled:opacity-60"
                style={{ borderColor: '#CDD8DB', background: '#F6F8F8' }}
              >
                {uploading ? (
                  <>
                    <span className="text-[28px] animate-pulse">⏫</span>
                    <span className="text-[13px] font-semibold">Enviando…</span>
                  </>
                ) : (
                  <>
                    <span className="text-[36px]">📷</span>
                    <span className="text-[14px] font-semibold text-ink">Toque para escolher foto</span>
                    <span className="text-[12px]">JPG, PNG ou WebP · até 10 MB</span>
                  </>
                )}
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
