'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

type Post = {
  id: string; channel: string; format: string; stage: string | null;
  title: string; caption: string; hashtags: string | null;
  mediaUrl: string | null; status: string;
  scheduledAt: string | null; publishedAt: string | null; createdAt: string;
  campaign: { id: string; name: string; brief: string } | null;
};

type Campaign = {
  id: string; name: string; brief: string;
  posts: Post[];
};

type AgendaData = { posts: Post[]; campaigns: Campaign[] };

// cores por canal
const COR: Record<string, string> = {
  instagram: '#E4405F',
  facebook:  '#1877F2',
  linkedin:  '#0A66C2',
};

const STAGE_COR: Record<string, { bg: string; text: string }> = {
  atrair:   { bg: '#FBF1DE', text: '#C97F16' },
  educar:   { bg: '#EEF2FF', text: '#4338CA' },
  conectar: { bg: '#FDF2FA', text: '#A21CAF' },
  converter:{ bg: '#E6F4EE', text: '#17996B' },
};

const STATUS_LABEL: Record<string, string> = {
  pending:   '● Aguardando aprovação',
  approved:  '● Aprovado',
  scheduled: '● Programado',
  published: '✓ Publicado',
  skipped:   '— Pulado',
};

const STATUS_COR: Record<string, string> = {
  pending:   '#F59E0B',
  approved:  '#8B2FC9',
  scheduled: '#6366F1',
  published: '#17996B',
  skipped:   '#9CA3AF',
};

function isoDate(d: Date) {
  return d.toISOString().slice(0, 10);
}

function startOfWeek(d: Date) {
  const day = d.getDay(); // 0=Dom
  const diff = day === 0 ? -6 : 1 - day; // vai para segunda
  const mon = new Date(d);
  mon.setDate(d.getDate() + diff);
  mon.setHours(0, 0, 0, 0);
  return mon;
}

function addDays(d: Date, n: number) {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

const DIAS_PT = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
const MESES_PT = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

function postDate(p: Post): string | null {
  return p.scheduledAt ?? p.publishedAt ?? null;
}

// ---------- Calendário ----------
function Calendario({ posts, semana, onSemana }: {
  posts: Post[];
  semana: Date;
  onSemana: (d: Date) => void;
}) {
  const [diaSel, setDiaSel] = useState<string | null>(isoDate(new Date()));

  const dias = Array.from({ length: 7 }, (_, i) => addDays(semana, i));
  const hoje = isoDate(new Date());

  function postsDoDia(d: Date) {
    const key = isoDate(d);
    return posts.filter(p => {
      const dt = postDate(p);
      return dt ? dt.slice(0, 10) === key : false;
    });
  }

  const postsSel = diaSel
    ? posts.filter(p => {
        const dt = postDate(p);
        return dt ? dt.slice(0, 10) === diaSel : (!diaSel);
      })
    : [];

  // posts sem data (pending/approved)
  const semData = posts.filter(p => !postDate(p) && (p.status === 'pending' || p.status === 'approved'));

  const mesMostrado = semana.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

  return (
    <div>
      {/* nav de semana */}
      <div className="flex items-center justify-between mb-3">
        <button onClick={() => onSemana(addDays(semana, -7))}
          className="px-3 py-1.5 rounded-xl text-[13px] font-semibold"
          style={{ background: '#F6F8F8', color: '#3D4451' }}>‹</button>
        <span className="text-[13px] font-semibold text-ink capitalize">{mesMostrado}</span>
        <button onClick={() => onSemana(addDays(semana, 7))}
          className="px-3 py-1.5 rounded-xl text-[13px] font-semibold"
          style={{ background: '#F6F8F8', color: '#3D4451' }}>›</button>
      </div>

      {/* grade de dias */}
      <div className="grid grid-cols-7 gap-1 mb-4">
        {dias.map((d, i) => {
          const key = isoDate(d);
          const ps = postsDoDia(d);
          const isHoje = key === hoje;
          const isSel = key === diaSel;
          return (
            <button key={key} onClick={() => setDiaSel(isSel ? null : key)}
              className="flex flex-col items-center py-2 rounded-2xl transition"
              style={{
                background: isSel ? '#8B2FC9' : isHoje ? '#F0E8FA' : 'transparent',
              }}>
              <span className="text-[10px] font-semibold mb-0.5"
                style={{ color: isSel ? 'rgba(255,255,255,0.7)' : '#9CA3AF' }}>
                {DIAS_PT[i]}
              </span>
              <span className="text-[15px] font-bold"
                style={{ color: isSel ? '#fff' : isHoje ? '#8B2FC9' : '#3D4451' }}>
                {d.getDate()}
              </span>
              <div className="flex gap-0.5 mt-1 flex-wrap justify-center min-h-[6px]">
                {ps.slice(0, 3).map((p, j) => (
                  <span key={j} className="w-[5px] h-[5px] rounded-full"
                    style={{ background: isSel ? 'rgba(255,255,255,0.8)' : COR[p.channel] ?? '#9CA3AF' }} />
                ))}
                {ps.length > 3 && (
                  <span className="text-[8px]" style={{ color: isSel ? '#fff' : '#9CA3AF' }}>+</span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* posts do dia selecionado */}
      {diaSel && (
        <div className="mb-4">
          <p className="text-[12px] font-semibold text-soft mb-2">
            {new Date(diaSel + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
          {postsSel.length === 0 && (
            <p className="text-[13px] text-mut text-center py-4">Nenhum post neste dia</p>
          )}
          {postsSel.map(p => <PostLinha key={p.id} post={p} />)}
        </div>
      )}

      {/* posts sem data */}
      {semData.length > 0 && (
        <div>
          <p className="text-[12px] font-semibold text-soft mb-2">Sem data definida</p>
          {semData.map(p => <PostLinha key={p.id} post={p} />)}
        </div>
      )}
    </div>
  );
}

// ---------- card de post na agenda ----------
function PostLinha({ post: p }: { post: Post }) {
  const dt = postDate(p);
  const hora = dt ? new Date(dt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : null;
  const stageCor = STAGE_COR[p.stage ?? ''] ?? { bg: '#F6F8F8', text: '#9CA3AF' };

  return (
    <div className="bg-white rounded-2xl p-3.5 mb-2 flex gap-3 items-start shadow-sm">
      {/* barra lateral canal */}
      <div className="w-[3px] self-stretch rounded-full flex-shrink-0"
        style={{ background: COR[p.channel] ?? '#9CA3AF' }} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          {p.stage && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
              style={{ background: stageCor.bg, color: stageCor.text }}>
              {p.stage}
            </span>
          )}
          <span className="text-[10px] font-semibold capitalize"
            style={{ color: COR[p.channel] ?? '#9CA3AF' }}>
            {p.channel}
          </span>
        </div>
        <p className="text-[13px] font-semibold text-ink leading-snug">{p.title}</p>
        {hora && <p className="text-[11.5px] text-soft mt-0.5">{hora}</p>}
        <p className="text-[11.5px] mt-1 font-semibold"
          style={{ color: STATUS_COR[p.status] ?? '#9CA3AF' }}>
          {STATUS_LABEL[p.status] ?? p.status}
        </p>
      </div>
    </div>
  );
}

// ---------- Jornada ----------
function Jornada({ campaigns, allPosts }: { campaigns: Campaign[]; allPosts: Post[] }) {
  // posts sem campanha (criados do radar, etc.)
  const semCampanha = allPosts.filter(p => !p.campaign && p.status !== 'skipped');

  if (campaigns.length === 0 && semCampanha.length === 0) {
    return (
      <div className="text-center py-16 text-mut">
        <p className="text-4xl mb-2">📋</p>
        <p className="font-disp font-semibold text-ink">Nenhuma campanha ativa</p>
        <p className="text-[13px] mt-1">Crie um brief na aba Hoje para começar.</p>
      </div>
    );
  }

  const TOTAL_STAGES = ['atrair', 'educar', 'conectar', 'converter'];

  return (
    <div>
      {campaigns.map(camp => {
        const naoSkipped = camp.posts.filter(p => p.status !== 'skipped');
        const publicados = naoSkipped.filter(p => p.status === 'published').length;
        const pct = naoSkipped.length > 0 ? Math.round((publicados / naoSkipped.length) * 100) : 0;

        return (
          <div key={camp.id} className="mb-6">
            {/* header campanha */}
            <div className="rounded-2xl p-4 mb-3"
              style={{ background: 'linear-gradient(135deg, #8B2FC9, #D63AA0, #F04E3E)' }}>
              <p className="text-[11px] font-bold text-white/60 mb-0.5">Campanha ativa</p>
              <h3 className="font-disp text-[17px] font-bold text-white mb-2">{camp.name}</h3>
              {/* barra progresso */}
              <div className="h-[4px] rounded-full mb-2" style={{ background: 'rgba(255,255,255,0.2)' }}>
                <div className="h-full rounded-full transition-all"
                  style={{ width: `${pct}%`, background: 'rgba(255,255,255,0.85)' }} />
              </div>
              <p className="text-[11.5px] text-white/70">
                {publicados} de {naoSkipped.length} publicados · {pct}% concluído
              </p>
            </div>

            {/* timeline */}
            {naoSkipped.map((p, idx) => {
              const stageCor = STAGE_COR[p.stage ?? ''] ?? { bg: '#F6F8F8', text: '#9CA3AF' };
              const isLast = idx === naoSkipped.length - 1;
              const isDone = p.status === 'published';
              const isCurrent = p.status === 'pending' || p.status === 'approved';
              const dt = postDate(p);
              const dtLabel = dt
                ? new Date(dt).toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
                : null;

              return (
                <div key={p.id} className="flex gap-3">
                  {/* linha vertical + dot */}
                  <div className="flex flex-col items-center">
                    <div className="w-[18px] h-[18px] rounded-full border-2 flex items-center justify-center flex-shrink-0"
                      style={{
                        borderColor: isDone ? '#17996B' : isCurrent ? '#8B2FC9' : '#D1D5DB',
                        background: isDone ? '#17996B' : isCurrent ? '#F0E8FA' : '#fff',
                      }}>
                      {isDone && <span className="text-[9px] text-white font-bold">✓</span>}
                      {isCurrent && <span className="w-[6px] h-[6px] rounded-full bg-[#8B2FC9] block" />}
                    </div>
                    {!isLast && <div className="w-[2px] flex-1 mt-1" style={{ background: '#E5E7EB' }} />}
                  </div>

                  {/* conteúdo */}
                  <div className="flex-1 pb-4">
                    <div className="flex items-center gap-2 mb-0.5">
                      {p.stage && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                          style={{ background: stageCor.bg, color: stageCor.text }}>
                          {p.stage}
                        </span>
                      )}
                      <span className="text-[10px] capitalize font-semibold"
                        style={{ color: COR[p.channel] ?? '#9CA3AF' }}>
                        {p.channel}
                      </span>
                    </div>
                    <p className="text-[13px] font-semibold text-ink leading-snug">{p.title}</p>
                    {dtLabel && <p className="text-[11.5px] text-soft mt-0.5">{dtLabel}</p>}
                    <p className="text-[11.5px] mt-0.5 font-semibold"
                      style={{ color: STATUS_COR[p.status] }}>
                      {STATUS_LABEL[p.status]}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        );
      })}

      {semCampanha.length > 0 && (
        <div>
          <p className="text-[12px] font-semibold text-soft mb-2">Posts avulsos</p>
          {semCampanha.map(p => <PostLinha key={p.id} post={p} />)}
        </div>
      )}
    </div>
  );
}

// ---------- Página principal ----------
export default function Agenda() {
  const [data, setData] = useState<AgendaData | null>(null);
  const [semana, setSemana] = useState<Date>(() => startOfWeek(new Date()));
  const [aba, setAba] = useState<'cal' | 'jor'>('cal');
  const router = useRouter();

  useEffect(() => {
    const from = isoDate(semana);
    const to = isoDate(addDays(semana, 6));
    fetch(`/api/agenda?from=${from}&to=${to}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => d && setData(d));
  }, [semana]);

  return (
    <main className="px-4">
      {/* Header */}
      <header className="pt-6 pb-4 flex items-center justify-between">
        <div>
          <p className="text-xs text-soft">Calendário e campanhas</p>
          <h1 className="font-disp text-[23px] font-bold">Agenda</h1>
        </div>
        <button
          onClick={() => router.push('/')}
          className="text-[13px] font-semibold px-3.5 py-1.5 rounded-full"
          style={{ background: 'var(--brand-gradient)', color: '#fff' }}
        >
          + Brief
        </button>
      </header>

      {/* Segmented control */}
      <div className="flex bg-white rounded-2xl p-1 shadow-sm mb-5 gap-1">
        {(['cal', 'jor'] as const).map(t => (
          <button key={t} onClick={() => setAba(t)}
            className="flex-1 py-2 rounded-xl text-[13px] font-semibold transition"
            style={{
              background: aba === t ? '#8B2FC9' : 'transparent',
              color: aba === t ? '#fff' : '#6B7280',
            }}>
            {t === 'cal' ? 'Calendário' : 'Jornada'}
          </button>
        ))}
      </div>

      {!data && (
        <p className="text-sm text-mut text-center py-16 animate-pulse">Carregando…</p>
      )}

      {data && aba === 'cal' && (
        <Calendario
          posts={data.posts}
          semana={semana}
          onSemana={s => setSemana(startOfWeek(s))}
        />
      )}

      {data && aba === 'jor' && (
        <Jornada campaigns={data.campaigns} allPosts={data.posts} />
      )}
    </main>
  );
}
