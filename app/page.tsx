'use client';
import { useEffect, useState } from 'react';
import PostCard, { type Post } from '@/components/PostCard';
import PreviewModal from '@/components/PreviewModal';

type Publicado = {
  id: string; channel: string; title: string;
  status: string; publishedAt: string | null; scheduledAt: string | null;
  ayrshareId: string | null;
};

const CANAL_COR: Record<string, string> = {
  instagram: '#C13584', facebook: '#1877F2', linkedin: '#0A66C2'
};

export default function Hoje() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [publicados, setPublicados] = useState<Publicado[]>([]);
  const [brief, setBrief] = useState('');
  const [gerando, setGerando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [aba, setAba] = useState<'fila' | 'publicados'>('fila');
  const [previewPost, setPreviewPost] = useState<Post | null>(null);
  const [excluindo, setExcluindo] = useState<string | null>(null);
  const [confirmarExcluir, setConfirmarExcluir] = useState<Publicado | null>(null);

  async function carregar() {
    const r = await fetch('/api/posts?status=pending');
    setPosts(await r.json());
  }

  async function carregarPublicados() {
    const r = await fetch('/api/posts?status=published,scheduled');
    setPublicados(await r.json());
  }

  useEffect(() => { carregar(); }, []);

  useEffect(() => {
    if (aba === 'publicados') carregarPublicados();
  }, [aba]);

  async function excluirPost(p: Publicado) {
    setExcluindo(p.id);
    try {
      await fetch('/api/posts', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: p.id })
      });
      setPublicados(ps => ps.filter(x => x.id !== p.id));
    } finally {
      setExcluindo(null);
      setConfirmarExcluir(null);
    }
  }

  async function gerar() {
    if (!brief.trim()) return;
    setGerando(true);
    setErro(null);
    try {
      const r = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brief })
      });
      const data = await r.json();
      if (!r.ok) {
        setErro(data.error ?? 'Erro ao gerar posts. Tente novamente.');
      } else {
        setBrief('');
        carregar();
      }
    } catch {
      setErro('Falha de conexão. Verifique sua internet e tente novamente.');
    } finally {
      setGerando(false);
    }
  }

  return (
    <>
      <main className="px-4">
        <header className="pt-6 pb-3 flex items-center justify-between gap-3">
          <div>
            <p className="text-xs text-soft">{new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
            <h1 className="font-disp text-[23px] font-bold">Bom dia, Francisco</h1>
          </div>
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-[14px] font-disp flex-shrink-0"
            style={{ background: 'linear-gradient(135deg,#0E5F66,#17996B)' }}
          >FD</div>
        </header>

        <div className="bg-white rounded-full flex items-center gap-2 px-4 py-1.5 mb-4" style={{ boxShadow: '0 1px 3px rgba(23,38,44,.06),0 4px 14px rgba(23,38,44,.05)' }}>
          <span className="text-brand">✦</span>
          <input
            value={brief}
            onChange={e => setBrief(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && gerar()}
            placeholder="Diga ao seu CMO o que você precisa…"
            className="flex-1 py-2.5 text-sm outline-none bg-transparent"
          />
          {brief && (
            <button onClick={gerar} disabled={gerando} className="text-brand font-bold text-sm">
              {gerando ? '…' : '→'}
            </button>
          )}
        </div>

        {erro && (
          <div className="rounded-2xl px-4 py-3 mb-4 text-sm border" style={{ background: '#FEF2F2', borderColor: '#FECACA', color: '#991B1B' }}>
            <p className="font-semibold mb-0.5">Não foi possível gerar os posts</p>
            <p style={{ color: '#B91C1C' }}>{erro}</p>
          </div>
        )}

        {/* Segmented control */}
        <div className="flex bg-[#E8EDEE] rounded-2xl p-1 mb-4">
          {(['fila', 'publicados'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setAba(tab)}
              className={`flex-1 text-[13px] font-semibold py-2.5 rounded-xl transition-all ${aba === tab ? 'bg-white text-ink shadow-sm' : 'text-mut'}`}
            >
              {tab === 'fila'
                ? `Para aprovar${posts.length > 0 ? ` · ${posts.length}` : ''}`
                : 'Publicados'}
            </button>
          ))}
        </div>

        {/* ── ABA FILA ── */}
        {aba === 'fila' && (
          <>
            {posts.length > 0 && !gerando && (
              <div className="flex justify-between items-center text-[13px] font-semibold text-mut mx-1 mt-1 mb-3">
                <span><b className="text-ink">Para aprovar</b> · 1 toque</span>
                <span>{posts.length} {posts.length === 1 ? 'post' : 'posts'}</span>
              </div>
            )}
            {gerando && <p className="text-sm text-mut px-1 py-3 animate-pulse">✦ Seu CMO está criando os posts…</p>}

            {posts.map(p => (
              <PostCard
                key={p.id}
                post={p}
                onAprovar={p => setPreviewPost(p)}
                onDone={id => setPosts(ps => ps.filter(x => x.id !== id))}
              />
            ))}

            {!gerando && posts.length === 0 && !erro && (
              <div className="text-center text-mut py-14">
                <p className="text-4xl mb-2">🎉</p>
                <p className="font-disp font-semibold text-ink">Fila zerada!</p>
                <p className="text-[13px] mt-1">Escreva um brief acima para gerar os próximos posts.</p>
              </div>
            )}
          </>
        )}

        {/* ── ABA PUBLICADOS ── */}
        {aba === 'publicados' && (
          <>
            {publicados.length === 0 ? (
              <div className="text-center text-mut py-14">
                <p className="text-4xl mb-2">📭</p>
                <p className="font-disp font-semibold text-ink">Nada publicado ainda</p>
                <p className="text-[13px] mt-1">Aprove um post e publique ou agende — ele aparece aqui.</p>
              </div>
            ) : (
              publicados.map(p => {
                const data = p.publishedAt ?? p.scheduledAt;
                const dataFmt = data
                  ? new Date(data).toLocaleString('pt-BR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
                  : '—';
                return (
                  <div key={p.id} className="bg-white rounded-card shadow-sm p-3.5 mb-3 flex items-center gap-3">
                    <span
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ background: CANAL_COR[p.channel] ?? '#6B7E85' }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-[13.5px] font-semibold text-ink truncate">{p.title}</p>
                      <p className="text-[12px] text-mut mt-0.5 capitalize">
                        {p.channel} · {p.status === 'published' ? `Publicado ${dataFmt}` : `Agendado ${dataFmt}`}
                      </p>
                    </div>
                    <span
                      className="text-[11px] font-bold px-2.5 py-1 rounded-full flex-shrink-0"
                      style={p.status === 'published'
                        ? { background: '#E6F4EE', color: '#17996B' }
                        : { background: '#E5F1F0', color: '#0E5F66' }}
                    >
                      {p.status === 'published' ? '✓ Publicado' : '⏰ Agendado'}
                    </span>
                    <button
                      onClick={() => setConfirmarExcluir(p)}
                      className="text-soft hover:text-red-400 transition text-[18px] leading-none flex-shrink-0"
                      title="Excluir post"
                    >🗑</button>
                  </div>
                );
              })
            )}
          </>
        )}
      </main>

      {previewPost && (
        <PreviewModal
          post={previewPost}
          onClose={() => setPreviewPost(null)}
          onDone={id => {
            setPosts(ps => ps.filter(x => x.id !== id));
            setPreviewPost(null);
            if (aba === 'publicados') carregarPublicados();
          }}
        />
      )}

      {/* Modal confirmação excluir */}
      {confirmarExcluir && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center"
          style={{ background: 'rgba(23,38,44,.5)' }}
          onClick={e => { if (e.target === e.currentTarget) setConfirmarExcluir(null); }}
        >
          <div className="bg-fundo rounded-t-[26px] w-full max-w-[430px] px-4 pt-4 pb-8">
            <div className="w-[42px] h-[5px] bg-[#CDD8DB] rounded-full mx-auto mb-5" />
            <p className="font-disp text-[17px] font-bold mb-1">Excluir publicação?</p>
            <p className="text-[13px] text-mut mb-5">
              O post <b className="text-ink">"{confirmarExcluir.title}"</b> será removido da rede social
              {confirmarExcluir.ayrshareId ? ' (via Ayrshare)' : ''} e arquivado aqui.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setConfirmarExcluir(null)}
                className="flex-1 py-3.5 rounded-2xl font-semibold text-[14px] text-mut"
                style={{ background: '#E8EDEE' }}
              >Cancelar</button>
              <button
                onClick={() => excluirPost(confirmarExcluir)}
                disabled={excluindo === confirmarExcluir.id}
                className="flex-[2] py-3.5 rounded-2xl text-white font-semibold text-[14px] disabled:opacity-60"
                style={{ background: '#DC2626' }}
              >
                {excluindo === confirmarExcluir.id ? 'Excluindo…' : '🗑 Excluir'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
