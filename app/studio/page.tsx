'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';

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

async function salvarNoBanco(url: string, tags: string) {
  await fetch('/api/imagens/salvar', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url, tags, source: 'pexels' }),
  });
}

type Aba = 'buscar' | 'salvos';

export default function Studio() {
  const [aba, setAba] = useState<Aba>('buscar');
  const [query, setQuery] = useState('');
  const [fotos, setFotos] = useState<PexelsPhoto[]>([]);
  const [buscando, setBuscando] = useState(false);
  const [erroBusca, setErroBusca] = useState<string | null>(null);
  const [salvos, setSalvos] = useState<MediaAsset[]>([]);
  const [carregandoSalvos, setCarregandoSalvos] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [erroUpload, setErroUpload] = useState<string | null>(null);
  const [salvandoFoto, setSalvandoFoto] = useState<number | null>(null);
  const [salvoSucesso, setSalvoSucesso] = useState<number | null>(null);
  const [fotoPreview, setFotoPreview] = useState<PexelsPhoto | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (aba === 'salvos') carregarSalvos();
  }, [aba]);

  async function buscar() {
    const termo = query.trim();
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
        if (d.photos?.length === 0) setErroBusca('Nenhuma imagem para esse termo');
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

  async function salvarFoto(foto: PexelsPhoto) {
    setSalvandoFoto(foto.id);
    await salvarNoBanco(foto.src.large, foto.alt);
    setSalvandoFoto(null);
    setSalvoSucesso(foto.id);
    setTimeout(() => setSalvoSucesso(null), 2000);
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
      // Refresh saved list
      if (aba === 'salvos') carregarSalvos();
      else {
        setAba('salvos');
      }
    } catch {
      setErroUpload('Falha ao enviar. Tente novamente.');
    } finally {
      setUploading(false);
    }
  }

  return (
    <>
    {/* Modal de preview de foto — permite verificar orientação antes de salvar */}
    {fotoPreview && (
      <div
        className="fixed inset-0 z-50 flex flex-col items-center justify-center px-4"
        style={{ background: 'rgba(10,10,20,.85)' }}
        onClick={() => setFotoPreview(null)}
      >
        <div className="w-full max-w-[520px]" onClick={e => e.stopPropagation()}>
          {/* Imagem grande para verificar orientação */}
          <img
            src={fotoPreview.src.large}
            alt={fotoPreview.alt}
            className="w-full rounded-2xl object-contain"
            style={{ maxHeight: '65vh' }}
          />
          <div className="mt-3 flex items-center gap-2">
            <div className="flex-1">
              <p className="text-white text-[12px] leading-snug line-clamp-2">{fotoPreview.alt}</p>
              <p className="text-white/50 text-[11px] mt-0.5">📷 {fotoPreview.photographer}</p>
            </div>
            <button
              onClick={() => setFotoPreview(null)}
              className="px-4 py-2.5 rounded-2xl text-[13px] font-semibold"
              style={{ background: 'rgba(255,255,255,.12)', color: '#fff' }}
            >
              Fechar
            </button>
            <button
              onClick={() => { salvarFoto(fotoPreview); setFotoPreview(null); }}
              disabled={salvandoFoto === fotoPreview.id}
              className="px-4 py-2.5 rounded-2xl text-white text-[13px] font-semibold disabled:opacity-60"
              style={{ background: '#8B2FC9' }}
            >
              {salvoSucesso === fotoPreview.id ? '✓ Salvo' : '+ Salvar'}
            </button>
          </div>
        </div>
      </div>
    )}
    <main className="px-4">
      {/* Header */}
      <header className="pt-6 pb-4 flex items-center justify-between">
        <div>
          <p className="text-xs text-soft">Banco de imagens</p>
          <h1 className="font-disp text-[23px] font-bold">Studio</h1>
        </div>
        <Link
          href="/canais"
          className="text-[13px] font-semibold px-3.5 py-1.5 rounded-full transition active:scale-95"
          style={{ background: '#F0E8FA', color: '#8B2FC9' }}
        >
          📡 Canais →
        </Link>
      </header>

      {/* Abas */}
      <div className="flex gap-1.5 mb-4">
        {([['buscar', '🔍 Buscar'], ['salvos', '📁 Salvos']] as [Aba, string][]).map(([a, label]) => (
          <button
            key={a}
            onClick={() => setAba(a)}
            className="flex-1 py-2.5 rounded-2xl text-[13.5px] font-semibold transition"
            style={{
              background: aba === a ? '#8B2FC9' : '#F0F4F5',
              color: aba === a ? '#fff' : '#6B7E85',
            }}
          >
            {label}
          </button>
        ))}
        <button
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="px-4 py-2.5 rounded-2xl text-[13.5px] font-semibold transition active:scale-95 disabled:opacity-60"
          style={{ background: '#F0F4F5', color: '#6B7E85' }}
        >
          {uploading ? '⏫…' : '⬆ Enviar'}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={e => { const f = e.target.files?.[0]; if (f) fazerUpload(f); }}
        />
      </div>

      {/* Erro upload */}
      {erroUpload && (
        <div className="rounded-xl px-4 py-3 mb-3 text-[13px]" style={{ background: '#FEF2F2', color: '#B91C1C' }}>
          {erroUpload}
        </div>
      )}

      {/* ── BUSCAR ── */}
      {aba === 'buscar' && (
        <>
          <div className="flex gap-2 mb-4">
            <input
              type="search"
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && buscar()}
              placeholder="Ex: seguro, família, casa, carro..."
              className="flex-1 border border-[#E0E8EA] rounded-xl px-3.5 py-2.5 text-[13.5px] outline-none focus:border-brand"
              style={{ background: '#F6F8F8' }}
            />
            <button
              onClick={buscar}
              disabled={buscando || !query.trim()}
              className="px-5 rounded-xl text-white text-[13px] font-semibold disabled:opacity-50 active:scale-95 transition"
              style={{ background: '#8B2FC9' }}
            >
              {buscando ? '…' : 'Buscar'}
            </button>
          </div>

          {erroBusca && (
            <p className="text-center text-[13px] py-4" style={{ color: '#B91C1C' }}>{erroBusca}</p>
          )}

          {buscando && (
            <p className="text-center text-mut text-[13px] py-12 animate-pulse">Buscando imagens…</p>
          )}

          {!buscando && fotos.length === 0 && !erroBusca && (
            <div className="text-center py-12">
              <p className="text-[36px] mb-2">🔍</p>
              <p className="text-[13px] text-mut">Busque imagens pelo tema do post</p>
              <p className="text-[12px] text-soft mt-1">Todas as imagens são de uso livre</p>
            </div>
          )}

          {!buscando && fotos.length > 0 && (
            <div className="grid grid-cols-2 gap-2">
              {fotos.map(foto => {
                const salvo = salvoSucesso === foto.id;
                const salvando = salvandoFoto === foto.id;
                return (
                  <div key={foto.id} className="rounded-xl overflow-hidden relative cursor-pointer"
                    onClick={() => setFotoPreview(foto)}>
                    <img
                      src={foto.src.medium}
                      alt={foto.alt}
                      className="w-full aspect-video object-cover"
                      loading="lazy"
                    />
                    <button
                      onClick={e => { e.stopPropagation(); salvarFoto(foto); }}
                      disabled={salvando || salvo}
                      className="absolute bottom-1.5 right-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full transition active:scale-95 disabled:opacity-70"
                      style={{
                        background: salvo ? '#17996B' : '#8B2FC9',
                        color: '#fff',
                      }}
                    >
                      {salvo ? '✓ Salvo' : salvando ? '…' : '+ Salvar'}
                    </button>
                    <p className="absolute bottom-1.5 left-1.5 text-[9px] text-white/70 leading-tight">
                      {foto.photographer}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* ── SALVOS ── */}
      {aba === 'salvos' && (
        <>
          {carregandoSalvos && (
            <p className="text-center text-mut text-[13px] py-12 animate-pulse">Carregando…</p>
          )}

          {!carregandoSalvos && salvos.length === 0 && (
            <div className="text-center py-12">
              <p className="text-[36px] mb-2">📁</p>
              <p className="text-[13px] font-semibold text-ink mb-1">Banco de mídia vazio</p>
              <p className="text-[12px] text-mut max-w-[240px] mx-auto">
                Busque imagens na aba Buscar e salve as que gostar — elas ficam aqui para reuso.
              </p>
            </div>
          )}

          {!carregandoSalvos && salvos.length > 0 && (
            <>
              <p className="text-[12px] text-mut mb-3">{salvos.length} {salvos.length === 1 ? 'imagem salva' : 'imagens salvas'}</p>
              <div className="grid grid-cols-2 gap-2">
                {salvos.map(asset => (
                  <div key={asset.id} className="rounded-xl overflow-hidden relative">
                    <img
                      src={asset.url}
                      alt={asset.tags ?? ''}
                      className="w-full aspect-video object-cover"
                      loading="lazy"
                    />
                    <span
                      className="absolute top-1.5 left-1.5 text-[9px] font-bold px-2 py-0.5 rounded-full"
                      style={{ background: 'rgba(0,0,0,.45)', color: '#fff' }}
                    >
                      {asset.source}
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
        </>
      )}
    </main>
    </>
  );
}
