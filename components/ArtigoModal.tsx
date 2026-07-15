'use client';
import { useState, useEffect, useRef } from 'react';

type ArticleStatus = 'generating' | 'rascunho' | 'aprovado' | 'erro';

type AgentStep = {
  key: 'research' | 'plan' | 'draft' | 'qa';
  icon: string;
  label: string;
  detail: string;
};

type ArticleData = {
  id: string;
  status: ArticleStatus;
  titulo?: string | null;
  subtitulo?: string | null;
  corpo?: string | null;
  cta?: string | null;
  legendaRedes?: string | null;
  hashtags?: string | null;
  researchJson?: string | null;
  planJson?: string | null;
  draftJson?: string | null;
  qaJson?: string | null;
};

const STEPS: AgentStep[] = [
  { key: 'research', icon: '🔍', label: 'Pesquisador',   detail: 'Buscando fontes reais na web…' },
  { key: 'plan',     icon: '🧭', label: 'Estrategista',  detail: 'Definindo ângulo e outline…' },
  { key: 'draft',    icon: '✍️',  label: 'Redator',       detail: 'Escrevendo o artigo completo…' },
  { key: 'qa',       icon: '✅', label: 'Revisor',        detail: 'Checando fontes e qualidade…' },
];

function stepDoneIndex(article: ArticleData): number {
  if (article.qaJson)       return 4;
  if (article.draftJson)    return 3;
  if (article.planJson)     return 2;
  if (article.researchJson) return 1;
  return 0;
}

function MarkdownParagraphs({ text }: { text: string }) {
  const lines = text.split('\n').map((l, i) => {
    if (l.startsWith('## ')) return <h3 key={i} className="font-disp font-bold text-[16px] text-ink mt-5 mb-2">{l.slice(3)}</h3>;
    if (l.startsWith('# '))  return <h2 key={i} className="font-disp font-bold text-[18px] text-ink mt-6 mb-2">{l.slice(2)}</h2>;
    if (l.trim() === '')     return <div key={i} className="h-2" />;
    // bold inline
    const parts = l.split(/(\*\*[^*]+\*\*)/g);
    return (
      <p key={i} className="text-[13.5px] text-ink leading-relaxed mb-1">
        {parts.map((p, j) => p.startsWith('**') && p.endsWith('**')
          ? <strong key={j}>{p.slice(2, -2)}</strong>
          : p)}
      </p>
    );
  });
  return <div>{lines}</div>;
}

export default function ArtigoModal({
  articleId,
  onClose,
  onAprovado,
}: {
  articleId: string;
  onClose: () => void;
  onAprovado?: (postId: string) => void;
}) {
  const [article, setArticle]     = useState<ArticleData | null>(null);
  const [aprovando, setAprovando] = useState(false);
  const [erro, setErro]           = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    async function fetch() {
      const r = await window.fetch(`/api/artigo/${articleId}`);
      if (!r.ok) return;
      const data: ArticleData = await r.json();
      setArticle(data);
      if (data.status === 'rascunho' || data.status === 'erro') {
        if (pollRef.current) clearInterval(pollRef.current);
      }
    }
    fetch();
    pollRef.current = setInterval(fetch, 3000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [articleId]);

  async function aprovar() {
    if (!article) return;
    setAprovando(true);
    const r = await window.fetch(`/api/artigo/${article.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'aprovar' }),
    });
    const data = await r.json();
    setAprovando(false);
    if (r.ok) {
      onAprovado?.(data.postId);
      onClose();
    } else {
      setErro(data.error ?? 'Erro ao aprovar');
    }
  }

  const doneIdx = article ? stepDoneIndex(article) : 0;
  const isGenerating = !article || article.status === 'generating';
  const isDone       = article?.status === 'rascunho';
  const isErro       = article?.status === 'erro';

  const qaData = article?.qaJson ? (() => {
    try { return JSON.parse(article.qaJson); } catch { return null; }
  })() : null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ background: 'rgba(23,38,44,.55)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-fundo rounded-[20px] w-full max-w-[520px] max-h-[90vh] overflow-y-auto pb-6">

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b" style={{ borderColor: '#EDE6F5' }}>
          <div>
            <h2 className="font-disp font-bold text-[17px]">
              {isGenerating ? 'Gerando artigo…' : isDone ? '📄 Artigo pronto' : '❌ Erro no pipeline'}
            </h2>
            {article?.titulo && (
              <p className="text-[12px] text-mut mt-0.5 line-clamp-1">{article.titulo}</p>
            )}
          </div>
          <button onClick={onClose} className="text-mut text-[13px] font-semibold">Fechar</button>
        </div>

        <div className="px-5 pt-4">

          {/* Pipeline progress */}
          <div className="mb-5">
            {STEPS.map((step, i) => {
              const done    = i < doneIdx;
              const running = i === doneIdx && isGenerating;
              return (
                <div key={step.key} className="flex items-start gap-3 mb-3">
                  <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 text-[13px]"
                    style={{
                      background: done ? '#E1F5EE' : running ? '#F5F0FF' : '#F0F4F5',
                      color: done ? '#0F6E56' : running ? '#8B2FC9' : '#B0BCBE',
                    }}>
                    {done ? '✓' : step.icon}
                  </div>
                  <div className="flex-1">
                    <p className="text-[13px] font-semibold" style={{ color: done ? '#0F6E56' : running ? '#8B2FC9' : '#B0BCBE' }}>
                      {step.label}
                      {running && <span className="ml-2 text-[11px] font-normal animate-pulse">{step.detail}</span>}
                    </p>
                    {done && step.key === 'research' && article?.researchJson && (() => {
                      try {
                        const r = JSON.parse(article.researchJson!);
                        return <p className="text-[11.5px] text-mut">{r.fatos?.length ?? 0} fontes reais encontradas</p>;
                      } catch { return null; }
                    })()}
                    {done && step.key === 'plan' && article?.planJson && (() => {
                      try {
                        const p = JSON.parse(article.planJson!);
                        return <p className="text-[11.5px] text-mut">{p.outline?.length ?? 0} seções · ângulo definido</p>;
                      } catch { return null; }
                    })()}
                    {done && step.key === 'draft' && article?.draftJson && (() => {
                      try {
                        const d = JSON.parse(article.draftJson!);
                        return <p className="text-[11.5px] text-mut">{d.secoes?.length ?? 0} seções escritas</p>;
                      } catch { return null; }
                    })()}
                    {done && step.key === 'qa' && qaData && (
                      <p className="text-[11.5px]" style={{ color: qaData.aprovado ? '#0F6E56' : '#C9622F' }}>
                        {qaData.aprovado ? 'Aprovado sem ressalvas' : `${qaData.issues?.length ?? 0} issue(s) — autocorrigido`}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Aviso de retry */}
          {isDone && qaData?.retryCount > 0 && (
            <div className="rounded-2xl px-4 py-2.5 mb-4 text-[12px] flex gap-2 items-start"
              style={{ background: '#FFF8E6', border: '1.5px solid #FDE68A', color: '#92400E' }}>
              <span>⚠️</span>
              <span>Este rascunho passou por 1 correção automática do Revisor.
                {qaData.issues?.length > 0 && ` Issues detectadas: ${qaData.issues.join('; ')}`}
              </span>
            </div>
          )}

          {/* Erro */}
          {isErro && (
            <div className="rounded-2xl px-4 py-3 mb-4 text-[13px]"
              style={{ background: '#FEE2E2', color: '#7F1D1D' }}>
              Erro no pipeline: {qaData?.erro ?? 'Verifique o terminal'}
            </div>
          )}

          {/* Artigo completo */}
          {isDone && article?.corpo && (
            <>
              <div className="rounded-2xl px-5 py-4 mb-4"
                style={{ background: '#FAFBFC', border: '1.5px solid #E0E8EA' }}>
                <h1 className="font-disp font-bold text-[19px] text-ink leading-tight mb-1">
                  {article.titulo}
                </h1>
                {article.subtitulo && (
                  <p className="text-[13.5px] text-mut mb-4">{article.subtitulo}</p>
                )}
                <MarkdownParagraphs text={article.corpo} />
                {article.cta && (
                  <div className="mt-4 pt-3 border-t" style={{ borderColor: '#EDE6F5' }}>
                    <p className="text-[13px] font-semibold" style={{ color: '#8B2FC9' }}>{article.cta}</p>
                  </div>
                )}
              </div>

              {/* Legenda para redes */}
              {article.legendaRedes && (
                <div className="rounded-2xl px-4 py-3 mb-4" style={{ background: '#F0E8FA' }}>
                  <p className="text-[11px] font-bold uppercase tracking-wide text-mut mb-1.5">Legenda para LinkedIn / Instagram</p>
                  <p className="text-[12.5px] text-ink leading-relaxed" style={{ whiteSpace: 'pre-line' }}>
                    {article.legendaRedes}
                  </p>
                  {article.hashtags && (
                    <p className="text-[11.5px] mt-2" style={{ color: '#0A66C2' }}>{article.hashtags}</p>
                  )}
                </div>
              )}

              {/* Fontes */}
              {article.researchJson && (() => {
                try {
                  const r = JSON.parse(article.researchJson!);
                  if (!r.fatos?.length) return null;
                  return (
                    <div className="rounded-2xl px-4 py-3 mb-4" style={{ background: '#F0F4F5' }}>
                      <p className="text-[11px] font-bold uppercase tracking-wide text-mut mb-2">
                        📎 Fontes utilizadas ({r.fatos.length})
                      </p>
                      {r.fatos.map((f: { tituloFonte: string; fonte: string }, i: number) => (
                        <a key={i} href={f.fonte} target="_blank" rel="noopener noreferrer"
                          className="block text-[11.5px] mb-1 hover:underline truncate"
                          style={{ color: '#0A66C2' }}>
                          {i + 1}. {f.tituloFonte}
                        </a>
                      ))}
                    </div>
                  );
                } catch { return null; }
              })()}

              {erro && <p className="text-[12px] mb-3" style={{ color: '#C9622F' }}>{erro}</p>}

              <button
                onClick={aprovar}
                disabled={aprovando}
                className="w-full py-3.5 rounded-2xl text-white font-semibold text-[14px] transition active:scale-95 disabled:opacity-60"
                style={{ background: 'linear-gradient(135deg,#8B2FC9,#0A66C2)' }}
              >
                {aprovando ? 'Enviando para a fila…' : '✓ Aprovar e mandar para a fila'}
              </button>
              <p className="text-[11px] text-soft text-center mt-2">
                O artigo entra na fila de aprovação como um post LinkedIn.
              </p>
            </>
          )}

          {/* Enquanto gera */}
          {isGenerating && (
            <div className="text-center py-8">
              <div className="text-[32px] mb-3 animate-pulse">✦</div>
              <p className="text-[13px] text-mut">O pipeline está rodando…</p>
              <p className="text-[11.5px] text-soft mt-1">pode levar 2 a 4 minutos</p>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
