'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';

type Perfil = {
  id: string; name: string; displayName: string; avatarColor: string;
  descricao: string; publicoAlvo: string; tomDeVoz: string; tomEvitar: string;
  idioma: string; contato: string; produtos: string; frequencia: string;
  channelsActive: string; objetivo: string; notasLivres: string;
  ativo: boolean; pausado: boolean; radarAtivo: boolean;
};

const AVATAR_COLORS = [
  '#8B2FC9','#7C3AED','#DB2777','#EA580C','#16A34A',
  '#0369A1','#9333EA','#B45309','#0F766E','#DC2626',
];

const OBJETIVO_LABEL: Record<string, string> = {
  engajamento: 'Engajamento', leads: 'Geração de leads', autoridade: 'Autoridade',
};
const CANAL_ICON: Record<string, string> = {
  instagram: '📷', facebook: '📘', linkedin: '💼',
};

function initials(name: string) {
  return name.split(/\s+/).map(w => w[0]).slice(0, 2).join('').toUpperCase();
}

// ── Editor de cenário (sheet modal) ──────────────────────────────────────────

type EditorProps = {
  perfil: Perfil | null; // null = novo
  onClose: () => void;
  onSalvo: () => void;
};

const CAMPO_VAZIO: Omit<Perfil, 'id' | 'name' | 'ativo' | 'pausado' | 'radarAtivo' | 'createdAt'> = {
  displayName: '', descricao: '', publicoAlvo: '', tomDeVoz: '', tomEvitar: '',
  idioma: 'pt-BR', contato: '', produtos: '', frequencia: '',
  channelsActive: '["instagram","linkedin","facebook"]',
  objetivo: 'engajamento', notasLivres: '', avatarColor: '#8B2FC9',
};

function EditorCenario({ perfil, onClose, onSalvo }: EditorProps) {
  const [form, setForm] = useState<typeof CAMPO_VAZIO>(
    perfil ? {
      displayName: perfil.displayName, descricao: perfil.descricao,
      publicoAlvo: perfil.publicoAlvo, tomDeVoz: perfil.tomDeVoz,
      tomEvitar: perfil.tomEvitar, idioma: perfil.idioma, contato: perfil.contato,
      produtos: perfil.produtos, frequencia: perfil.frequencia,
      channelsActive: perfil.channelsActive || '["instagram","linkedin","facebook"]',
      objetivo: perfil.objetivo, notasLivres: perfil.notasLivres,
      avatarColor: perfil.avatarColor,
    } : { ...CAMPO_VAZIO }
  );
  const [secao, setSecao] = useState<string>('identidade');
  const [salvando, setSalvando] = useState(false);

  function set(k: keyof typeof CAMPO_VAZIO, v: string) {
    setForm(f => ({ ...f, [k]: v }));
  }

  function toggleCanal(canal: string) {
    const atual: string[] = JSON.parse(form.channelsActive || '[]');
    const novo = atual.includes(canal) ? atual.filter(c => c !== canal) : [...atual, canal];
    set('channelsActive', JSON.stringify(novo));
  }

  const canaisAtivos: string[] = JSON.parse(form.channelsActive || '[]');

  async function salvar() {
    if (!form.displayName.trim()) return;
    setSalvando(true);
    const body = perfil
      ? { ...form, id: perfil.id }
      : { ...form };
    await fetch('/api/perfis', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    setSalvando(false);
    onSalvo();
  }

  const secoes = [
    { key: 'identidade', label: '🏷 Identidade' },
    { key: 'publico',    label: '👥 Público' },
    { key: 'tom',        label: '🎙 Tom de voz' },
    { key: 'canais',     label: '📡 Canais e frequência' },
    { key: 'objetivo',   label: '🎯 Objetivo' },
    { key: 'ia',         label: '🤖 Notas para IA' },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center"
      style={{ background: 'rgba(23,38,44,.5)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-fundo rounded-t-[26px] w-full max-w-[430px] flex flex-col"
        style={{ maxHeight: '92vh' }}>
        {/* Handle + header */}
        <div className="flex-shrink-0 px-4 pt-3 pb-3">
          <div className="w-[42px] h-[5px] bg-[#D4B8EF] rounded-full mx-auto mb-4" />
          <div className="flex items-center justify-between">
            <h2 className="font-disp text-[18px] font-bold">
              {perfil ? `Editar — ${perfil.displayName}` : 'Novo cenário'}
            </h2>
            <button onClick={onClose} className="text-mut text-[22px] leading-none">×</button>
          </div>

          {/* Navegação de seções */}
          <div className="flex gap-1.5 overflow-x-auto pb-1 mt-3 no-scrollbar">
            {secoes.map(s => (
              <button key={s.key} onClick={() => setSecao(s.key)}
                className="flex-shrink-0 text-[11.5px] font-semibold px-3 py-1.5 rounded-full transition"
                style={{
                  background: secao === s.key ? '#8B2FC9' : '#EDE6F5',
                  color:      secao === s.key ? '#fff'     : '#7B6B8A',
                }}>
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Conteúdo scrollável */}
        <div className="flex-1 overflow-y-auto px-4 pb-4">

          {secao === 'identidade' && (
            <div className="flex flex-col gap-3">
              <div>
                <label className="label-sm">Nome do cenário *</label>
                <input value={form.displayName} onChange={e => set('displayName', e.target.value)}
                  placeholder="Ex.: Francisco Dabus, Vip Insurance…"
                  className="input-base" />
              </div>
              <div>
                <label className="label-sm">Sobre o negócio</label>
                <textarea value={form.descricao} onChange={e => set('descricao', e.target.value)}
                  placeholder="O que você faz e onde atua."
                  rows={3} className="input-base resize-none" />
              </div>
              <div>
                <label className="label-sm">Produtos / serviços</label>
                <input value={form.produtos} onChange={e => set('produtos', e.target.value)}
                  placeholder="Ex.: Seguro auto, residencial, vida, saúde."
                  className="input-base" />
              </div>
              <div>
                <label className="label-sm">Site / link de contato</label>
                <input value={form.contato} onChange={e => set('contato', e.target.value)}
                  placeholder="https://…" className="input-base" />
              </div>
              <div>
                <label className="label-sm">Cor do avatar</label>
                <div className="flex gap-2 flex-wrap mt-1">
                  {AVATAR_COLORS.map(c => (
                    <button key={c} onClick={() => set('avatarColor', c)}
                      className="w-7 h-7 rounded-full transition active:scale-90"
                      style={{
                        background: c,
                        boxShadow: form.avatarColor === c ? `0 0 0 3px white, 0 0 0 5px ${c}` : 'none',
                      }} />
                  ))}
                </div>
              </div>
            </div>
          )}

          {secao === 'publico' && (
            <div className="flex flex-col gap-3">
              <div>
                <label className="label-sm">Quem é o público-alvo</label>
                <textarea value={form.publicoAlvo} onChange={e => set('publicoAlvo', e.target.value)}
                  placeholder="Ex.: Brasileiros e latinos em Orlando, 30-55 anos, recém-chegados."
                  rows={3} className="input-base resize-none" />
              </div>
            </div>
          )}

          {secao === 'tom' && (
            <div className="flex flex-col gap-3">
              <div>
                <label className="label-sm">Palavras a USAR</label>
                <input value={form.tomDeVoz} onChange={e => set('tomDeVoz', e.target.value)}
                  placeholder="Ex.: consultivo, caloroso, didático, sem jargão."
                  className="input-base" />
              </div>
              <div>
                <label className="label-sm">Palavras a EVITAR</label>
                <input value={form.tomEvitar} onChange={e => set('tomEvitar', e.target.value)}
                  placeholder="Ex.: barato, urgente, promoção relâmpago."
                  className="input-base" />
              </div>
              <div>
                <label className="label-sm">Idioma principal</label>
                <select value={form.idioma} onChange={e => set('idioma', e.target.value)}
                  className="input-base">
                  <option value="pt-BR">Português (Brasil)</option>
                  <option value="en-US">English (US)</option>
                  <option value="es">Español</option>
                </select>
              </div>
            </div>
          )}

          {secao === 'canais' && (
            <div className="flex flex-col gap-3">
              <div>
                <label className="label-sm">Canais ativos</label>
                <div className="flex gap-2 mt-1">
                  {(['instagram', 'facebook', 'linkedin'] as const).map(canal => (
                    <button key={canal} onClick={() => toggleCanal(canal)}
                      className="flex-1 py-2.5 rounded-xl text-[12px] font-semibold transition"
                      style={{
                        background: canaisAtivos.includes(canal) ? '#8B2FC9' : '#F0F4F5',
                        color:      canaisAtivos.includes(canal) ? '#fff'    : '#7B6B8A',
                      }}>
                      {CANAL_ICON[canal]} {canal.charAt(0).toUpperCase() + canal.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="label-sm">Frequência (posts/semana)</label>
                <input value={form.frequencia} onChange={e => set('frequencia', e.target.value)}
                  placeholder="Ex.: 3x por semana, todos os dias." className="input-base" />
              </div>
            </div>
          )}

          {secao === 'objetivo' && (
            <div className="flex flex-col gap-2">
              <label className="label-sm">Objetivo principal de marketing</label>
              {(['engajamento', 'leads', 'autoridade'] as const).map(obj => (
                <button key={obj} onClick={() => set('objetivo', obj)}
                  className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-left transition"
                  style={{
                    background: form.objetivo === obj ? '#F0E8FA' : '#FDF8FF',
                    border:     form.objetivo === obj ? '1.5px solid #8B2FC9' : '1.5px solid transparent',
                  }}>
                  <span className="text-[22px]">
                    {obj === 'engajamento' ? '💬' : obj === 'leads' ? '🎯' : '🏆'}
                  </span>
                  <div>
                    <p className="font-semibold text-[13.5px] text-ink capitalize">{OBJETIVO_LABEL[obj]}</p>
                    <p className="text-[11.5px] text-mut">
                      {obj === 'engajamento' && 'Aumentar curtidas, comentários e alcance orgânico'}
                      {obj === 'leads'       && 'Gerar contatos qualificados e consultas diretas'}
                      {obj === 'autoridade'  && 'Posicionar como referência no mercado'}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}

          {secao === 'ia' && (
            <div className="flex flex-col gap-3">
              <div>
                <label className="label-sm">Notas para a IA (campo livre)</label>
                <textarea value={form.notasLivres} onChange={e => set('notasLivres', e.target.value)}
                  placeholder="Qualquer contexto que a IA deve saber: datas comemorativas, concorrentes, eventos, restrições…"
                  rows={5} className="input-base resize-none" />
              </div>
            </div>
          )}
        </div>

        {/* Rodapé com botão salvar */}
        <div className="flex-shrink-0 px-4 pt-3 pb-8" style={{ borderTop: '1px solid #EDE6F5' }}>
          <button onClick={salvar} disabled={salvando || !form.displayName.trim()}
            className="w-full py-3.5 rounded-2xl text-white font-semibold text-[15px] transition active:scale-[.98] disabled:opacity-50"
            style={{ background: 'linear-gradient(135deg,#8B2FC9,#F04E3E)' }}>
            {salvando ? 'Salvando…' : perfil ? 'Atualizar cenário' : 'Criar cenário'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Página principal /cenarios ────────────────────────────────────────────────

export default function Cenarios() {
  const [perfis, setPerfis] = useState<Perfil[]>([]);
  const [editor, setEditor] = useState<'novo' | Perfil | null>(null);
  const [menuId, setMenuId] = useState<string | null>(null);

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

  async function excluir(id: string) {
    const r = await fetch('/api/perfis', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    if (r.ok) await carregar();
    setMenuId(null);
  }

  async function duplicar(perfil: Perfil) {
    await fetch('/api/perfis', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...perfil,
        id: undefined,
        name: undefined,
        displayName: `${perfil.displayName} (cópia)`,
        ativo: false,
      }),
    });
    await carregar();
    setMenuId(null);
  }

  useEffect(() => {
    carregar();
    function handleOutside() { setMenuId(null); }
    document.addEventListener('click', handleOutside);
    return () => document.removeEventListener('click', handleOutside);
  }, []);

  return (
    <>
      <main className="px-4 pb-10">
        <header className="pt-6 pb-4 flex items-center gap-3">
          <Link href="/" className="text-mut text-[22px] leading-none">‹</Link>
          <div className="flex-1">
            <p className="text-xs text-soft">Gerenciar perfis</p>
            <h1 className="font-disp text-[23px] font-bold">Cenários</h1>
          </div>
          <button
            onClick={() => setEditor('novo')}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl text-[13px] font-semibold text-white transition active:scale-95"
            style={{ background: 'linear-gradient(135deg,#8B2FC9,#F04E3E)' }}
          >
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

        {perfis.map(p => {
          const canais: string[] = JSON.parse(p.channelsActive || '[]');
          return (
            <div
              key={p.id}
              className="bg-white rounded-[20px] mb-3 overflow-hidden"
              style={{
                boxShadow: '0 1px 3px rgba(23,38,44,.06),0 4px 14px rgba(23,38,44,.05)',
                border: p.ativo ? `2px solid ${p.avatarColor}` : '2px solid transparent',
                opacity: p.pausado ? 0.6 : 1,
              }}
            >
              {/* Linha principal */}
              <div className="flex items-center gap-3 px-4 py-3.5">
                {/* Avatar */}
                <div
                  className="w-[46px] h-[46px] rounded-[14px] flex items-center justify-center text-white font-bold text-[16px] flex-shrink-0"
                  style={{ background: p.avatarColor }}
                >
                  {initials(p.displayName)}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <p className="text-[15px] font-bold text-ink">{p.displayName}</p>
                    {p.ativo && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                        style={{ background: `${p.avatarColor}20`, color: p.avatarColor }}>
                        Ativo
                      </span>
                    )}
                    {p.pausado && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                        style={{ background: '#F0F4F5', color: '#7B6B8A' }}>
                        Pausado
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    <span className="text-[11.5px] text-mut capitalize">
                      {OBJETIVO_LABEL[p.objetivo] ?? p.objetivo}
                    </span>
                    {canais.length > 0 && (
                      <span className="text-[11.5px]">
                        {canais.map(c => CANAL_ICON[c] ?? '').join(' ')}
                      </span>
                    )}
                    {p.frequencia && (
                      <span className="text-[11px] text-soft">· {p.frequencia}</span>
                    )}
                  </div>
                </div>

                {/* Ações */}
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    onClick={() => setEditor(p)}
                    className="text-[11.5px] font-semibold px-2.5 py-1.5 rounded-xl transition"
                    style={{ background: '#F0F4F5', color: '#7B6B8A' }}
                  >
                    Editar
                  </button>
                  {/* Menu ... */}
                  <div className="relative" onClick={e => e.stopPropagation()}>
                    <button
                      onClick={() => setMenuId(menuId === p.id ? null : p.id)}
                      className="w-8 h-8 rounded-xl flex items-center justify-center text-mut font-bold text-[16px] transition"
                      style={{ background: '#F0F4F5' }}
                    >
                      ···
                    </button>
                    {menuId === p.id && (
                      <div className="absolute right-0 top-full mt-1 w-[160px] bg-white rounded-2xl overflow-hidden z-20"
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
                        <button onClick={() => excluir(p.id)}
                          className="w-full text-left px-4 py-2.5 text-[13px] hover:bg-[#FDF8FF] transition"
                          style={{ color: '#DC2626' }}>
                          🗑 Excluir
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Toggle radar */}
              <div className="flex items-center justify-between px-4 py-2.5"
                style={{ borderTop: '1px solid #F0F4F5', background: '#FAFCFC' }}>
                <span className="text-[11.5px] text-mut">📡 Radar automático</span>
                <button
                  onClick={async () => {
                    await fetch('/api/perfis', {
                      method: 'PATCH',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ perfilId: p.id, radarAtivo: !p.radarAtivo }),
                    });
                    setPerfis(prev => prev.map(x => x.id === p.id ? { ...x, radarAtivo: !x.radarAtivo } : x));
                  }}
                  className="relative w-[42px] h-[24px] rounded-full transition-colors flex-shrink-0"
                  style={{ background: p.radarAtivo ? p.avatarColor : '#D4B8EF' }}
                >
                  <span className="absolute top-[3px] w-[18px] h-[18px] rounded-full bg-white shadow transition-all"
                    style={{ left: p.radarAtivo ? '21px' : '3px' }} />
                </button>
              </div>
            </div>
          );
        })}
      </main>

      {editor && (
        <EditorCenario
          perfil={editor === 'novo' ? null : editor}
          onClose={() => setEditor(null)}
          onSalvo={() => { carregar(); setEditor(null); }}
        />
      )}
    </>
  );
}
