'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

type RadarItem = {
  id: string; kind: string; title: string;
  summary: string | null; sourceUrl: string | null;
  sourceName: string | null; heat: number;
  usedAt: string | null; createdAt: string;
};

type RadarSource = {
  id: string; url: string; kind: string;
  name: string; active: boolean; createdAt: string;
};

function isNovo(createdAt: string) {
  return Date.now() - new Date(createdAt).getTime() < 48 * 60 * 60 * 1000;
}

// ---------- sub-componente: Gerenciar fontes ----------
function GerenciarFontes() {
  const [fontes, setFontes] = useState<RadarSource[]>([]);
  const [aberto, setAberto] = useState(false);
  const [url, setUrl] = useState('');
  const [name, setName] = useState('');
  const [kind, setKind] = useState<'rss' | 'website' | 'instagram'>('website');
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');

  useEffect(() => {
    fetch('/api/radar/fontes').then(r => r.ok ? r.json() : []).then(setFontes);
  }, []);

  // auto-detecta tipo pelo URL
  function handleUrl(val: string) {
    setUrl(val);
    if (val.includes('instagram.com')) setKind('instagram');
    else if (val.endsWith('.xml') || val.endsWith('/rss') || val.endsWith('/feed')) setKind('rss');
    else setKind('website');
  }

  async function salvar() {
    if (!url.trim() || !name.trim()) { setErro('Preencha URL e nome'); return; }
    setSalvando(true); setErro('');
    try {
      const r = await fetch('/api/radar/fontes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim(), name: name.trim(), kind })
      });
      const data = await r.json();
      if (!r.ok) { setErro(data.error ?? 'Erro'); return; }
      setFontes(prev => [...prev.filter(f => f.url !== data.url), data]);
      setUrl(''); setName(''); setKind('website');
    } catch { setErro('Falha de conexão'); }
    finally { setSalvando(false); }
  }

  async function remover(id: string) {
    await fetch('/api/radar/fontes', {
      method: 'DELETE', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id })
    });
    setFontes(prev => prev.filter(f => f.id !== id));
  }

  const kindLabel = { rss: '📰 RSS', website: '🌐 Site', instagram: '📸 Instagram' };
  const kindColor = { rss: '#E5F1F0', website: '#EEF2FF', instagram: '#FDF2FA' };
  const kindText  = { rss: '#0E5F66', website: '#4338CA', instagram: '#A21CAF' };

  return (
    <div className="mt-5 mb-6">
      <button
        onClick={() => setAberto(!aberto)}
        className="w-full flex items-center justify-between px-4 py-3 rounded-2xl text-[14px] font-semibold"
        style={{ background: '#F6F8F8', color: '#3D4451' }}
      >
        <span>⚙️ Fontes monitoradas · {fontes.length}</span>
        <span className="text-soft">{aberto ? '▲' : '▼'}</span>
      </button>

      {aberto && (
        <div className="mt-2 bg-white rounded-2xl shadow-sm overflow-hidden">
          {/* Lista existente */}
          {fontes.length > 0 && (
            <div className="divide-y divide-gray-50">
              {fontes.map(f => (
                <div key={f.id} className="flex items-center gap-3 px-4 py-3">
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full flex-shrink-0"
                    style={{ background: kindColor[f.kind as keyof typeof kindColor] ?? '#F6F8F8',
                             color: kindText[f.kind as keyof typeof kindText] ?? '#555' }}>
                    {kindLabel[f.kind as keyof typeof kindLabel] ?? f.kind}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold text-ink truncate">{f.name}</p>
                    <p className="text-[11.5px] text-soft truncate">{f.url}</p>
                  </div>
                  <button
                    onClick={() => remover(f.id)}
                    className="text-soft text-[18px] hover:text-red-400 transition flex-shrink-0"
                    title="Remover"
                  >×</button>
                </div>
              ))}
            </div>
          )}

          {/* Aviso Instagram */}
          {kind === 'instagram' && (
            <div className="mx-4 mt-3 mb-1 rounded-xl p-3 text-[12px]"
              style={{ background: '#FDF2FA', color: '#831843' }}>
              <p className="font-semibold mb-0.5">Instagram não tem RSS nativo.</p>
              <p>Use o <b>RSS.app</b> (rss.app) para criar um feed do perfil gratuitamente, e adicione a URL gerada como tipo <b>RSS</b>.</p>
            </div>
          )}

          {/* Formulário adicionar */}
          <div className="px-4 pb-4 pt-3 border-t border-gray-50">
            <p className="text-[12px] font-semibold text-soft mb-2">+ Adicionar fonte</p>
            <input
              value={name} onChange={e => setName(e.target.value)}
              placeholder="Nome (ex: Blog Seguro de Auto Florida)"
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-[13px] mb-2 outline-none focus:border-[#0E5F66]"
            />
            <input
              value={url} onChange={e => handleUrl(e.target.value)}
              placeholder="URL do site, feed RSS ou perfil Instagram"
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-[13px] mb-2 outline-none focus:border-[#0E5F66]"
            />
            <div className="flex gap-2 mb-3">
              {(['website', 'rss', 'instagram'] as const).map(k => (
                <button key={k}
                  onClick={() => setKind(k)}
                  className="flex-1 py-1.5 rounded-xl text-[12px] font-semibold transition"
                  style={{
                    background: kind === k ? kindColor[k] : '#F6F8F8',
                    color: kind === k ? kindText[k] : '#9CA3AF'
                  }}
                >
                  {kindLabel[k]}
                </button>
              ))}
            </div>
            {erro && <p className="text-[12px] text-red-500 mb-2">{erro}</p>}
            <button
              onClick={salvar} disabled={salvando}
              className="w-full py-2.5 rounded-xl text-[13px] font-semibold text-white transition active:scale-95 disabled:opacity-60"
              style={{ background: '#0E5F66' }}
            >
              {salvando ? 'Salvando…' : 'Salvar fonte'}
            </button>
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
    <main className="px-4 pb-8">
      {/* Header */}
      <header className="pt-6 pb-4 flex items-center justify-between">
        <div>
          <p className="text-xs text-soft">Monitoramento em tempo real</p>
          <h1 className="font-disp text-[23px] font-bold">Radar</h1>
        </div>
        <button
          onClick={() => buscar(true)}
          disabled={atualizando}
          className="text-[13px] font-semibold px-3.5 py-1.5 rounded-full transition active:scale-95"
          style={{ background: '#E5F1F0', color: '#0E5F66' }}
        >
          {atualizando ? '…' : '↻ Atualizar'}
        </button>
      </header>

      {/* Banner sucesso */}
      {sucesso && (
        <div className="rounded-2xl px-4 py-3 mb-4 flex items-center gap-3"
          style={{ background: '#E6F4EE' }}>
          <span className="text-[18px]">✓</span>
          <div className="flex-1">
            <p className="text-[13px] font-semibold" style={{ color: '#17996B' }}>Post gerado e na fila!</p>
            <button onClick={() => router.push('/')}
              className="text-[12px] underline font-semibold" style={{ color: '#17996B' }}>
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

      {/* Gerenciar fontes */}
      <GerenciarFontes />

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
                      style={{ background: '#E6F4EE', color: '#17996B' }}>✓ Usado</span>
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
                  style={{ background: gerando === item.id ? '#9DAFB5' : '#0E5F66' }}
                >
                  {gerando === item.id ? '✦ Gerando…' : '✦ Gerar minha versão'}
                </button>
                {item.sourceUrl && (
                  <a href={item.sourceUrl} target="_blank" rel="noopener noreferrer"
                    className="flex-1 flex items-center justify-center text-mut font-semibold rounded-xl py-2.5 text-[13px]"
                    style={{ background: '#F6F8F8' }}>
                    Ver fonte ↗
                  </a>
                )}
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
