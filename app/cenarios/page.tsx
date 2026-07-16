'use client';
import { useEffect, useState } from 'react';

// ─── Types ─────────────────────────────────────────────────────────────────────

type Perfil = {
  id: string; name: string; displayName: string; avatarColor: string;
  descricao: string; publicoAlvo: string; tomDeVoz: string; tomEvitar: string;
  idioma: string; contato: string; produtos: string; frequencia: string;
  channelsActive: string; objetivo: string; notasLivres: string;
  ativo: boolean; pausado: boolean; radarAtivo: boolean;
};

// ─── Constants ─────────────────────────────────────────────────────────────────

const AVATAR_COLORS = [
  '#8B2FC9','#7C3AED','#DB2777','#EA580C','#16A34A',
  '#0369A1','#9333EA','#B45309','#0F766E','#DC2626',
];

const CANAL_COR: Record<string, string> = {
  instagram: '#C13584', facebook: '#1877F2', linkedin: '#0A66C2', tiktok: '#000000',
};
const CANAL_LABEL: Record<string, string> = {
  instagram: 'IG', facebook: 'FB', linkedin: 'LI', tiktok: 'TT',
};
const CANAL_NOME: Record<string, string> = {
  instagram: 'Instagram', facebook: 'Facebook', linkedin: 'LinkedIn', tiktok: 'TikTok',
};
const CANAIS_ALL = ['instagram', 'facebook', 'linkedin', 'tiktok'] as const;

type ContaConectada = {
  platform: string;
  username?: string;
  displayName?: string;
  status: 'connected' | 'error' | 'disconnected';
};

// ─── Helpers ───────────────────────────────────────────────────────────────────

function initials(name: string) {
  return name.split(/\s+/).map(w => w[0]).slice(0, 2).join('').toUpperCase();
}

function avatarStyle(displayName: string, avatarColor: string): React.CSSProperties {
  const dn = displayName.toLowerCase();
  if (dn.includes('francisco')) return { background: 'linear-gradient(135deg,#8B2FC9,#F04E3E)' };
  if (dn.includes('vip insurance')) return { background: '#1D9E75' };
  return { background: avatarColor || '#8B2FC9' };
}

function parseFrequencia(freq: string, canaisAtivos: string[]): string {
  if (!freq) return '';
  try {
    const obj = JSON.parse(freq) as Record<string, number>;
    const vals = canaisAtivos.map(c => obj[c]).filter((v): v is number => typeof v === 'number');
    const max = vals.length ? Math.max(...vals) : null;
    return max ? `${max}× /sem` : '';
  } catch {
    const m = freq.match(/\d+/);
    return m ? `${m[0]}× /sem` : freq;
  }
}

function parsePublicoAlvo(texto: string) {
  const quemM  = texto.match(/Quem: ?(.*?)(?:\n|$)/);
  const ondeM  = texto.match(/Onde: ?(.*?)(?:\n|$)/);
  const doresM = texto.match(/Dores: ?([\s\S]*?)$/);
  const hasKeys = quemM || ondeM || doresM;
  return {
    quem:  quemM?.[1]?.trim()  || (hasKeys ? '' : texto),
    onde:  ondeM?.[1]?.trim()  || '',
    dores: doresM?.[1]?.trim() || '',
  };
}

// ─── Toast ─────────────────────────────────────────────────────────────────────

function Toast({ msg, onDone }: { msg: string; onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 2500);
    return () => clearTimeout(t);
  }, [onDone]);
  return (
    <div className="fixed bottom-28 left-1/2 -translate-x-1/2 z-[70] px-4 py-2.5 rounded-2xl text-white text-[13px] font-semibold shadow-lg whitespace-nowrap"
      style={{ background: '#17996B' }}>
      {msg}
    </div>
  );
}

// ─── Tags Input ────────────────────────────────────────────────────────────────

function TagsInput({ tags, onChange, placeholder }: {
  tags: string[]; onChange: (t: string[]) => void; placeholder: string;
}) {
  const [input, setInput] = useState('');

  function add() {
    const v = input.trim();
    if (v && !tags.includes(v)) onChange([...tags, v]);
    setInput('');
  }

  return (
    <div className="border border-[#E4DCF0] rounded-xl px-3 pt-2.5 pb-2 bg-[#FAF7FF] min-h-[52px]">
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {tags.map(t => (
            <span key={t}
              className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[11.5px] font-medium"
              style={{ background: '#F0E8FA', color: '#8B2FC9' }}>
              {t}
              <button type="button" onClick={() => onChange(tags.filter(x => x !== t))}
                className="opacity-60 hover:opacity-100 ml-0.5 text-[13px] leading-none px-1 py-1 -my-1">×</button>
            </span>
          ))}
        </div>
      )}
      <input
        value={input}
        onChange={e => setInput(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); add(); } }}
        placeholder={tags.length === 0 ? placeholder : 'Adicionar… (Enter)'}
        className="w-full text-[13px] outline-none bg-transparent"
      />
    </div>
  );
}

// ─── Wizard ────────────────────────────────────────────────────────────────────

type WizardForm = {
  displayName: string;
  name: string;
  descricao: string;
  objetivo: string;
  publicoQuem: string;
  publicoOnde: string;
  publicoDores: string;
  tomUsarTags: string[];
  tomEvitarTags: string[];
  idioma: string;
  canaisAtivos: string[];
  freqCanal: Record<string, number>;
  notasLivres: string;
};

const FORM_VAZIO: WizardForm = {
  displayName: '', name: '', descricao: '', objetivo: 'leads',
  publicoQuem: '', publicoOnde: '', publicoDores: '',
  tomUsarTags: [], tomEvitarTags: [], idioma: 'pt-BR',
  canaisAtivos: ['instagram', 'linkedin', 'facebook'],
  freqCanal: { instagram: 5, linkedin: 3, facebook: 3, tiktok: 2 },
  notasLivres: '',
};

function fromPerfil(p: Perfil): WizardForm {
  const pub = parsePublicoAlvo(p.publicoAlvo);
  let canaisAtivos: string[] = ['instagram', 'linkedin', 'facebook'];
  try { canaisAtivos = JSON.parse(p.channelsActive || '[]'); } catch {}

  let freqCanal: Record<string, number> = { instagram: 5, linkedin: 3, facebook: 3, tiktok: 2 };
  try {
    const obj = JSON.parse(p.frequencia);
    if (obj && typeof obj === 'object' && !Array.isArray(obj)) freqCanal = { ...freqCanal, ...obj };
  } catch {}

  return {
    displayName: p.displayName,
    name: p.name || '',
    descricao: p.descricao || '',
    objetivo: p.objetivo || 'leads',
    publicoQuem: pub.quem,
    publicoOnde: pub.onde,
    publicoDores: pub.dores,
    tomUsarTags: p.tomDeVoz ? p.tomDeVoz.split(/,\s*/).filter(Boolean) : [],
    tomEvitarTags: p.tomEvitar ? p.tomEvitar.split(/,\s*/).filter(Boolean) : [],
    idioma: p.idioma || 'pt-BR',
    canaisAtivos,
    freqCanal,
    notasLivres: p.notasLivres || '',
  };
}

const STEPS = ['Identidade', 'Público', 'Tom de voz', 'Canais e frequência'] as const;

function Wizard({ perfil, onClose, onSalvo }: {
  perfil: Perfil | null; onClose: () => void; onSalvo: () => void;
}) {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<WizardForm>(() => perfil ? fromPerfil(perfil) : { ...FORM_VAZIO });
  const [salvando, setSalvando] = useState(false);
  const [contasConectadas, setContasConectadas] = useState<ContaConectada[]>([]);
  const [saibaMais, setSaibaMais] = useState(false);

  useEffect(() => {
    fetch('/api/canais/contas')
      .then(r => r.ok ? r.json() : [])
      .then(d => { if (Array.isArray(d)) setContasConectadas(d); })
      .catch(() => {});
  }, []);

  function set<K extends keyof WizardForm>(k: K, v: WizardForm[K]) {
    setForm(f => ({ ...f, [k]: v }));
  }

  function toggleCanal(canal: string) {
    const next = form.canaisAtivos.includes(canal)
      ? form.canaisAtivos.filter(c => c !== canal)
      : [...form.canaisAtivos, canal];
    set('canaisAtivos', next);
  }

  async function salvar() {
    if (!form.displayName.trim()) return;
    setSalvando(true);

    const publicoAlvo = [
      form.publicoQuem && `Quem: ${form.publicoQuem}`,
      form.publicoOnde && `Onde: ${form.publicoOnde}`,
      form.publicoDores && `Dores: ${form.publicoDores}`,
    ].filter(Boolean).join('\n');

    const freqObj: Record<string, number> = {};
    form.canaisAtivos.forEach(c => { freqObj[c] = form.freqCanal[c] ?? 3; });

    const body = {
      ...(perfil ? { id: perfil.id } : {}),
      ...(form.name.trim() ? { name: form.name.trim() } : {}),
      displayName:    form.displayName,
      descricao:      form.descricao,
      objetivo:       form.objetivo,
      publicoAlvo,
      tomDeVoz:       form.tomUsarTags.join(', '),
      tomEvitar:      form.tomEvitarTags.join(', '),
      idioma:         form.idioma,
      channelsActive: JSON.stringify(form.canaisAtivos),
      frequencia:     JSON.stringify(freqObj),
      notasLivres:    form.notasLivres,
    };

    await fetch('/api/perfis', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    setSalvando(false);
    onSalvo();
  }

  const pct = ((step + 1) / STEPS.length) * 100;
  const isLast = step === STEPS.length - 1;
  const canNext = step === 0 ? !!form.displayName.trim() : true;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ background: 'rgba(26,10,46,.55)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-fundo w-full max-w-lg flex flex-col rounded-[20px]"
        style={{ maxHeight: '90vh' }}>

        {/* Progress bar */}
        <div className="h-1 rounded-t-[20px] overflow-hidden flex-shrink-0">
          <div className="h-full transition-all duration-300 ease-out"
            style={{ width: `${pct}%`, background: 'linear-gradient(90deg,#8B2FC9,#F04E3E)' }} />
        </div>

        {/* Header */}
        <div className="flex-shrink-0 px-5 pt-4 pb-1">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-soft">
              Passo {step + 1}/{STEPS.length}
            </span>
            <button onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-full text-mut text-[20px]"
              style={{ background: '#F0E8FA' }}>
              ×
            </button>
          </div>
          <h2 className="font-disp text-[20px] font-bold text-ink">{STEPS[step]}</h2>
        </div>

        {/* Step indicator dots */}
        <div className="flex items-center gap-1.5 px-5 py-3 flex-shrink-0">
          {STEPS.map((_, i) => (
            <button key={i} onClick={() => i < step && setStep(i)}
              className="h-[3px] flex-1 rounded-full transition-all"
              style={{ background: i <= step ? '#8B2FC9' : '#EDE6F5', cursor: i < step ? 'pointer' : 'default' }} />
          ))}
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-5 pb-4 no-scrollbar"
          style={{ maskImage: 'linear-gradient(to bottom, black calc(100% - 40px), transparent 100%)', WebkitMaskImage: 'linear-gradient(to bottom, black calc(100% - 40px), transparent 100%)' }}>

          {/* ── Passo 1: Identidade ── */}
          {step === 0 && (
            <div className="flex flex-col gap-4">
              <div>
                <label className="label-sm">Nome do cenário *</label>
                <input value={form.displayName}
                  onChange={e => set('displayName', e.target.value)}
                  placeholder="Ex.: Vip Insurance, Francisco Dabus…"
                  className="input-base" />
              </div>
              <div>
                <label className="label-sm">Nome a exibir</label>
                <input value={form.name}
                  onChange={e => set('name', e.target.value)}
                  placeholder="Slug/identificador (opcional — gerado automaticamente)"
                  className="input-base" />
              </div>
              <div>
                <label className="label-sm">Descrição do negócio</label>
                <textarea value={form.descricao}
                  onChange={e => set('descricao', e.target.value)}
                  placeholder="O que você faz, onde atua, o que te diferencia…"
                  rows={3} className="input-base resize-none" />
              </div>
              <div>
                <label className="label-sm">Objetivo principal</label>
                <div className="flex flex-col gap-2 mt-1">
                  {([
                    { v: 'leads',       icon: '🎯', label: 'Leads',       desc: 'Gerar contatos qualificados e consultas diretas' },
                    { v: 'autoridade',  icon: '🏆', label: 'Autoridade',  desc: 'Posicionar como referência no mercado' },
                    { v: 'engajamento', icon: '💬', label: 'Engajamento', desc: 'Aumentar alcance orgânico, curtidas e comentários' },
                  ] as const).map(opt => (
                    <button key={opt.v} type="button" onClick={() => set('objetivo', opt.v)}
                      className="flex items-center gap-3 px-3.5 py-3 rounded-2xl text-left transition"
                      style={{
                        background: form.objetivo === opt.v ? '#F0E8FA' : '#FDF8FF',
                        border: form.objetivo === opt.v ? '1.5px solid #8B2FC9' : '1.5px solid #EDE6F5',
                      }}>
                      <span className="text-[20px] flex-shrink-0">{opt.icon}</span>
                      <div>
                        <p className="font-semibold text-[13px] text-ink">{opt.label}</p>
                        <p className="text-[11px] text-mut">{opt.desc}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── Passo 2: Público ── */}
          {step === 1 && (
            <div className="flex flex-col gap-4">
              <div>
                <label className="label-sm">Quem é seu público</label>
                <input value={form.publicoQuem}
                  onChange={e => set('publicoQuem', e.target.value)}
                  placeholder="Ex.: Brasileiros e latinos, 30–55 anos, recém-chegados"
                  className="input-base" />
              </div>
              <div>
                <label className="label-sm">Onde está</label>
                <input value={form.publicoOnde}
                  onChange={e => set('publicoOnde', e.target.value)}
                  placeholder="Ex.: Orlando, FL — área metropolitana"
                  className="input-base" />
              </div>
              <div>
                <label className="label-sm">Principais dores / necessidades</label>
                <textarea value={form.publicoDores}
                  onChange={e => set('publicoDores', e.target.value)}
                  placeholder="Ex.: Processo burocrático, não falam inglês, medo de fraudes, custo alto…"
                  rows={4} className="input-base resize-none" />
              </div>
            </div>
          )}

          {/* ── Passo 3: Tom de voz ── */}
          {step === 2 && (
            <div className="flex flex-col gap-4">
              <div>
                <label className="label-sm">Palavras a usar</label>
                <p className="text-[11px] text-soft mb-1.5">Digite e aperte Enter para adicionar</p>
                <TagsInput tags={form.tomUsarTags} onChange={t => set('tomUsarTags', t)}
                  placeholder="Ex.: consultivo, caloroso, didático…" />
              </div>
              <div>
                <label className="label-sm">Palavras a evitar</label>
                <p className="text-[11px] text-soft mb-1.5">Digite e aperte Enter para adicionar</p>
                <TagsInput tags={form.tomEvitarTags} onChange={t => set('tomEvitarTags', t)}
                  placeholder="Ex.: barato, urgente, promoção relâmpago…" />
              </div>
              <div>
                <label className="label-sm">Idioma principal</label>
                <div className="flex gap-2 mt-1">
                  {([
                    { v: 'pt-BR', label: 'PT-BR' },
                    { v: 'en-US', label: 'EN' },
                    { v: 'ambos', label: 'Ambos' },
                  ] as const).map(opt => (
                    <button key={opt.v} type="button" onClick={() => set('idioma', opt.v)}
                      className="flex-1 py-2.5 rounded-xl text-[12.5px] font-semibold transition active:scale-95"
                      style={{
                        background: form.idioma === opt.v ? '#8B2FC9' : '#F0E8FA',
                        color:      form.idioma === opt.v ? '#fff'     : '#8B2FC9',
                      }}>
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── Passo 4: Canais e frequência ── */}
          {step === 3 && (
            <div className="flex flex-col gap-4">
              <div>
                <label className="label-sm">Canais ativos</label>
                <div className="flex flex-col gap-3 mt-1.5">
                  {CANAIS_ALL.map(canal => {
                    const isOn = form.canaisAtivos.includes(canal);
                    const cor  = CANAL_COR[canal];
                    const freq = form.freqCanal[canal] ?? 3;
                    const conta = contasConectadas.find(c => c.platform === canal);
                    return (
                      <div key={canal}>
                        <div className="flex items-center gap-3 py-2.5 px-3.5 rounded-2xl transition"
                          style={{
                            background: isOn ? `${cor}12` : '#F5F5F8',
                            border: `1.5px solid ${isOn ? cor : '#EDE6F5'}`,
                          }}>
                          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-[11.5px] flex-shrink-0"
                            style={{ background: cor }}>
                            {CANAL_LABEL[canal]}
                          </div>
                          <div className="flex-1 min-w-0">
                            <span className="font-semibold text-[13px] text-ink capitalize block">{CANAL_NOME[canal]}</span>
                            {isOn && conta?.username && (
                              <span className="text-[11px] text-mut">@{conta.username}</span>
                            )}
                          </div>
                          <button type="button" onClick={() => toggleCanal(canal)}
                            className="relative w-[42px] h-[24px] rounded-full transition-colors flex-shrink-0"
                            style={{ background: isOn ? cor : '#D1D5DB' }}>
                            <span className="absolute top-[3px] w-[18px] h-[18px] rounded-full bg-white shadow transition-all"
                              style={{ left: isOn ? '21px' : '3px' }} />
                          </button>
                        </div>
                        {isOn && (
                          <div className="px-3.5 pt-3 pb-3 rounded-b-2xl -mt-2"
                            style={{
                              background: `${cor}08`,
                              borderLeft: `1.5px solid ${cor}`,
                              borderRight: `1.5px solid ${cor}`,
                              borderBottom: `1.5px solid ${cor}`,
                            }}>
                            <div className="flex items-center justify-between mb-2.5">
                              <span className="text-[11.5px] text-ink font-medium">
                                {conta?.username
                                  ? `${CANAL_NOME[canal]} · @${conta.username}`
                                  : 'Sem conta própria vinculada'}
                              </span>
                              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ml-2"
                                style={{ background: '#FEF3C7', color: '#92400E' }}>
                                Conta compartilhada
                              </span>
                            </div>
                            <div className="flex items-center justify-between mb-1.5">
                              <span className="text-[11px] text-mut">Frequência</span>
                              <span className="text-[12px] font-bold" style={{ color: cor }}>{freq}× /sem</span>
                            </div>
                            <div className="flex items-center justify-between gap-2 mt-1">
                              <button type="button"
                                onClick={() => set('freqCanal', { ...form.freqCanal, [canal]: Math.max(1, freq - 1) })}
                                className="w-[44px] h-[44px] rounded-xl flex items-center justify-center font-bold text-[20px] transition active:scale-95 flex-shrink-0"
                                style={{ background: '#F0F4F5', color: '#7B6B8A' }}>
                                −
                              </button>
                              <div className="flex-1 text-center">
                                <span className="text-[24px] font-bold" style={{ color: cor }}>{freq}</span>
                                <span className="text-[11px] text-mut block">× por semana</span>
                              </div>
                              <button type="button"
                                onClick={() => set('freqCanal', { ...form.freqCanal, [canal]: Math.min(7, freq + 1) })}
                                className="w-[44px] h-[44px] rounded-xl flex items-center justify-center font-bold text-[20px] transition active:scale-95 flex-shrink-0"
                                style={{ background: '#F0F4F5', color: '#7B6B8A' }}>
                                +
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Aviso conta compartilhada */}
              <div className="rounded-2xl px-4 py-3.5" style={{ background: '#FFFBEB', border: '1.5px solid #FCD34D' }}>
                <p className="text-[12.5px] font-semibold mb-1" style={{ color: '#78350F' }}>
                  Conta compartilhada entre cenários
                </p>
                <p className="text-[12px] leading-relaxed" style={{ color: '#92400E' }}>
                  Todos os cenários publicam pelo mesmo perfil conectado. Para contas separadas por cenário (ex: @francisco.dabus e @vipinsurance independentes), é necessário upgrade de plano.
                </p>
                <button
                  type="button"
                  onClick={() => setSaibaMais(v => !v)}
                  className="text-[12px] font-semibold mt-2 underline-offset-2"
                  style={{ color: '#78350F' }}>
                  Saiba mais {saibaMais ? '▴' : '▾'}
                </button>
                {saibaMais && (
                  <div className="mt-2.5 pt-2.5 text-[12px] leading-relaxed space-y-1.5"
                    style={{ borderTop: '1px solid #FCD34D', color: '#92400E' }}>
                    <p>Com o plano avançado, cada cenário pode ter sua própria conta no Instagram, Facebook e LinkedIn — publicando de forma independente no mesmo painel, sem interferência entre cenários.</p>
                    <p>Custo estimado: a partir de $300/mês (plano Business). Alternativa: integração direta com as APIs nativas da Meta e LinkedIn para independência total de plataformas intermediárias.</p>
                  </div>
                )}
              </div>

              <div>
                <label className="label-sm">Notas para a IA</label>
                <textarea value={form.notasLivres}
                  onChange={e => set('notasLivres', e.target.value)}
                  placeholder="Ex.: sempre mencionar furacões em junho, citar bairros de Orlando, evitar política…"
                  rows={4} className="input-base resize-none" />
              </div>
            </div>
          )}
        </div>

        {/* Footer navigation */}
        <div className="flex-shrink-0 px-5 pt-3 pb-8 border-t flex gap-2"
          style={{ borderColor: '#EDE6F5' }}>
          {step > 0 && (
            <button type="button" onClick={() => setStep(s => s - 1)}
              className="flex-1 py-3.5 rounded-2xl font-semibold text-[14px] transition active:scale-[.98]"
              style={{ background: '#F0E8FA', color: '#8B2FC9' }}>
              ← Voltar
            </button>
          )}
          {!isLast ? (
            <button type="button" onClick={() => setStep(s => s + 1)}
              disabled={!canNext}
              className="flex-[2] py-3.5 rounded-2xl text-white font-semibold text-[14px] transition active:scale-[.98] disabled:opacity-40"
              style={{ background: 'linear-gradient(135deg,#8B2FC9,#F04E3E)' }}>
              Próximo →
            </button>
          ) : (
            <button type="button" onClick={salvar}
              disabled={salvando || !form.displayName.trim()}
              className="flex-[2] py-3.5 rounded-2xl text-white font-semibold text-[14px] transition active:scale-[.98] disabled:opacity-40"
              style={{ background: 'linear-gradient(135deg,#8B2FC9,#F04E3E)' }}>
              {salvando ? 'Salvando…' : perfil ? 'Salvar alterações' : 'Criar cenário'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Modal de confirmação de exclusão ─────────────────────────────────────────

function ConfirmDeleteModal({ perfil, onCancel, onConfirm }: {
  perfil: Perfil; onCancel: () => void; onConfirm: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center px-4"
      style={{ background: 'rgba(26,10,46,.65)' }}
      onClick={e => { if (e.target === e.currentTarget) onCancel(); }}
    >
      <div className="bg-white rounded-[24px] w-full max-w-sm p-6 shadow-2xl"
        style={{ animation: 'scale-in .15s ease' }}>
        <p className="font-disp text-[18px] font-bold text-ink mb-2">Excluir cenário?</p>
        <p className="text-[13.5px] leading-relaxed mb-5" style={{ color: '#7B6B8A' }}>
          O cenário{' '}
          <strong className="text-ink">"{perfil.displayName}"</strong>{' '}
          será removido. Posts associados serão desvinculados. Ação irreversível.
        </p>
        <div className="flex gap-2">
          <button onClick={onCancel}
            className="flex-1 py-3 rounded-2xl text-[14px] font-semibold transition active:scale-[.98]"
            style={{ background: '#F0E8FA', color: '#8B2FC9' }}>
            Cancelar
          </button>
          <button onClick={onConfirm}
            className="flex-1 py-3 rounded-2xl text-[14px] font-semibold text-white transition active:scale-[.98]"
            style={{ background: '#E24B4A' }}>
            Excluir
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Página /cenarios ──────────────────────────────────────────────────────────

export default function Cenarios() {
  const [perfis, setPerfis]         = useState<Perfil[]>([]);
  const [wizard, setWizard]         = useState<'novo' | Perfil | null>(null);
  const [menuId, setMenuId]         = useState<string | null>(null);
  const [toast,  setToast]          = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Perfil | null>(null);
  const [deletingId,    setDeletingId]    = useState<string | null>(null);

  async function carregar() {
    const r = await fetch('/api/perfis');
    if (r.ok) setPerfis(await r.json());
  }

  async function ativar(id: string) {
    await fetch('/api/perfis', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    setPerfis(prev => prev.map(p => ({ ...p, ativo: p.id === id })));
    setMenuId(null);
  }

  async function togglePausado(id: string, pausado: boolean) {
    await fetch('/api/perfis', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ perfilId: id, pausado }),
    });
    setPerfis(prev => prev.map(p => p.id === id ? { ...p, pausado } : p));
    setMenuId(null);
  }

  function pedirExclusao(p: Perfil) {
    setMenuId(null);
    if (perfis.length <= 1) {
      setToast('Você precisa ter pelo menos um cenário ativo.');
      return;
    }
    setConfirmDelete(p);
  }

  async function confirmarExclusao() {
    if (!confirmDelete) return;
    const id = confirmDelete.id;
    setConfirmDelete(null);
    setDeletingId(id);
    const r = await fetch('/api/perfis', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    if (r.ok) {
      setToast('Cenário excluído.');
      window.dispatchEvent(new Event('cenario-changed'));
      setTimeout(() => {
        setPerfis(prev => prev.filter(p => p.id !== id));
        setDeletingId(null);
      }, 320);
    } else {
      const data = await r.json().catch(() => ({}));
      setDeletingId(null);
      setToast(data.error ?? 'Não foi possível excluir.');
    }
  }

  async function duplicar(p: Perfil) {
    await fetch('/api/perfis', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...p, id: undefined, name: undefined,
        displayName: `${p.displayName} (cópia)`, ativo: false,
      }),
    });
    await carregar();
    setMenuId(null);
  }

  async function toggleRadar(p: Perfil) {
    const next = !p.radarAtivo;
    await fetch('/api/perfis', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ perfilId: p.id, radarAtivo: next }),
    });
    setPerfis(prev => prev.map(x => x.id === p.id ? { ...x, radarAtivo: next } : x));
    setToast(next ? 'Radar automático ativado ✓' : 'Radar automático desativado');
  }

  useEffect(() => {
    carregar();
    function handleOutside() { setMenuId(null); }
    document.addEventListener('click', handleOutside);
    return () => document.removeEventListener('click', handleOutside);
  }, []);

  return (
    <>
      <main className="px-4">
        <header className="pt-6 pb-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-soft">Gerenciar perfis</p>
            <h1 className="font-disp text-[23px] font-bold">Cenários</h1>
          </div>
          <button onClick={() => setWizard('novo')}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl text-[13px] font-semibold text-white transition active:scale-95"
            style={{ background: 'linear-gradient(135deg,#8B2FC9,#F04E3E)' }}>
            + Novo
          </button>
        </header>

        {perfis.length === 0 && (
          <div className="text-center text-mut py-14">
            <p className="text-4xl mb-2">🎭</p>
            <p className="font-disp font-semibold text-ink">Nenhum cenário ainda</p>
            <p className="text-[13px] mt-1">Crie um cenário para cada marca ou perfil.</p>
          </div>
        )}

        {perfis.map((p, idx) => {
          const canais: string[] = (() => {
            try { return JSON.parse(p.channelsActive || '[]'); } catch { return []; }
          })();
          const freqLabel = parseFrequencia(p.frequencia, canais);
          const avStyle = avatarStyle(p.displayName, p.avatarColor || AVATAR_COLORS[idx % AVATAR_COLORS.length]);
          const semCanais = canais.length === 0;

          const isDeleting = deletingId === p.id;
          return (
            <div key={p.id}
              className="bg-white rounded-[20px] mb-3 overflow-hidden"
              style={{
                boxShadow: '0 1px 3px rgba(23,38,44,.06),0 4px 14px rgba(23,38,44,.05)',
                border: p.ativo ? '2px solid #8B2FC9' : '2px solid transparent',
                opacity: isDeleting ? 0 : p.pausado ? 0.65 : 1,
                transform: isDeleting ? 'scale(0.95)' : 'scale(1)',
                transition: 'opacity .3s ease, transform .3s ease, border-color .15s ease',
                pointerEvents: isDeleting ? 'none' : undefined,
                cursor: p.ativo ? 'default' : 'pointer',
              }}
              onClick={() => { if (!p.ativo) ativar(p.id); }}
            >
              {/* Main row */}
              <div className="flex items-start gap-3 px-4 py-3.5">
                <div className="w-[46px] h-[46px] rounded-[14px] flex items-center justify-center text-white font-bold text-[16px] flex-shrink-0"
                  style={avStyle}>
                  {initials(p.displayName)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                    <p className="text-[15px] font-bold text-ink">{p.displayName}</p>
                    {p.ativo && !p.pausado && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                        style={{ background: '#E1F5EE', color: '#0F6E56' }}>
                        Ativo
                      </span>
                    )}
                    {p.pausado && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                        style={{ background: '#FEF8DC', color: '#854F0B' }}>
                        Pausado
                      </span>
                    )}
                  </div>

                  <p className="text-[11.5px] text-mut mb-1.5">
                    {p.objetivo === 'leads' ? '🎯 Leads'
                      : p.objetivo === 'autoridade' ? '🏆 Autoridade'
                      : '💬 Engajamento'}
                  </p>

                  <div className="flex items-center gap-1 flex-wrap">
                    {semCanais ? (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                        style={{ background: '#FEF3C7', color: '#92400E' }}>
                        ⚙ configurar canais
                      </span>
                    ) : (
                      <>
                        {canais.map(canal => (
                          <span key={canal}
                            className="text-[11px] font-bold px-2 py-0.5 rounded-full text-white"
                            style={{ background: CANAL_COR[canal] ?? '#9CA3AF' }}>
                            {CANAL_LABEL[canal] ?? canal}
                          </span>
                        ))}
                        {freqLabel && (
                          <span className="text-[10.5px] text-soft ml-0.5">{freqLabel}</span>
                        )}
                      </>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1 flex-shrink-0">
                  <button onClick={e => { e.stopPropagation(); setWizard(p); }}
                    className="text-[11.5px] font-semibold px-2.5 py-1.5 rounded-xl transition"
                    style={{ background: '#F0F4F5', color: '#7B6B8A' }}>
                    Editar
                  </button>
                  <button
                    onClick={e => { e.stopPropagation(); pedirExclusao(p); }}
                    className="min-w-[44px] min-h-[44px] rounded-xl flex items-center justify-center font-bold text-[18px] transition active:scale-95"
                    style={{ background: '#FDE8E7', color: '#E24B4A' }}
                    title="Excluir cenário"
                  >
                    —
                  </button>
                  <div className="relative" onClick={e => e.stopPropagation()}>
                    <button onClick={() => setMenuId(menuId === p.id ? null : p.id)}
                      className="min-w-[44px] min-h-[44px] rounded-xl flex items-center justify-center text-mut font-bold text-[16px]"
                      style={{ background: '#F0F4F5' }}>
                      ···
                    </button>
                    {menuId === p.id && (
                      <div className="absolute right-0 top-full mt-1 w-[168px] bg-white rounded-2xl overflow-hidden z-20"
                        style={{ boxShadow: '0 4px 20px rgba(23,38,44,.12)', border: '1px solid #EDE6F5' }}>
                        {!p.ativo && (
                          <button onClick={() => ativar(p.id)}
                            className="w-full text-left px-4 py-2.5 text-[13px] hover:bg-[#FDF8FF] transition">
                            ✓ Usar este cenário
                          </button>
                        )}
                        <button onClick={() => togglePausado(p.id, !p.pausado)}
                          className="w-full text-left px-4 py-2.5 text-[13px] hover:bg-[#FDF8FF] transition">
                          {p.pausado ? '▶ Retomar' : '⏸ Pausar'}
                        </button>
                        <button onClick={() => duplicar(p)}
                          className="w-full text-left px-4 py-2.5 text-[13px] hover:bg-[#FDF8FF] transition">
                          ⧉ Duplicar
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Radar toggle */}
              <div className="flex items-center justify-between px-4 py-3"
                style={{ borderTop: '1px solid #EDE6F5', background: '#FAFAFF' }}
                onClick={e => e.stopPropagation()}>
                <div>
                  <p className="text-[12px] font-semibold text-ink">Radar automático</p>
                  <p className="text-[10.5px] text-mut">gera posts e envia para aprovação</p>
                </div>
                <button onClick={e => { e.stopPropagation(); toggleRadar(p); }}
                  className="relative w-[42px] h-[24px] rounded-full transition-colors flex-shrink-0"
                  style={{ background: p.radarAtivo ? '#8B2FC9' : '#D4B8EF' }}>
                  <span className="absolute top-[3px] w-[18px] h-[18px] rounded-full bg-white shadow transition-all"
                    style={{ left: p.radarAtivo ? '21px' : '3px' }} />
                </button>
              </div>
            </div>
          );
        })}
      </main>

      {toast && <Toast msg={toast} onDone={() => setToast(null)} />}

      {confirmDelete && (
        <ConfirmDeleteModal
          perfil={confirmDelete}
          onCancel={() => setConfirmDelete(null)}
          onConfirm={confirmarExclusao}
        />
      )}

      {wizard && (
        <Wizard
          perfil={wizard === 'novo' ? null : wizard}
          onClose={() => setWizard(null)}
          onSalvo={() => {
            carregar();
            setWizard(null);
            setToast(wizard === 'novo' ? 'Cenário criado! ✓' : 'Cenário atualizado ✓');
          }}
        />
      )}
    </>
  );
}
