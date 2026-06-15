'use client';
import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { signOut } from 'next-auth/react';
import { proximoSlot, formatarSlot } from '@/lib/cadencia';

// ─── tipos de perfil ──────────────────────────────────────────────────────────

type BrandPerfil = {
  id: string; name: string; displayName: string;
  descricao: string; publicoAlvo: string; tomDeVoz: string;
  idioma: string; contato: string; produtos: string;
  frequencia: string; objetivo: string; notasLivres: string;
  ativo: boolean; pausado: boolean; radarAtivo: boolean;
};

// ─── tipos ───────────────────────────────────────────────────────────────────

type Fonte = {
  id: string; url: string; kind: string;
  name: string; active: boolean; warning: string | null; createdAt: string;
};

type Canal = { name: string; active: boolean };

type Config = {
  perfil: string;
  whatsappNumero: string;
  intervalHoras: string;
  maxPostsPerRun: string;
  canais: Canal[];
  chaves: { anthropic: boolean; ayrshare: boolean; pexels: boolean };
  publicacaoHorarios: string; // JSON array, ex: '["09:00","14:00"]'
  publicacaoPorSemana: string; // "3" | "5" | "7" | "14"
};

type TesteStatus = {
  ok: boolean;
  count: number;
  rssUrl?: string;
  erro?: string;
  isGoogleAlerts?: boolean;
  alertsQuery?: string;
  suggestedNewsUrl?: string;
} | null;

// ─── helpers ─────────────────────────────────────────────────────────────────

const KIND_LABEL: Record<string, string> = { rss: 'RSS', website: 'Site', instagram: 'Instagram' };
const KIND_BG:    Record<string, string> = { rss: '#F0E8FA', website: '#EEF2FF', instagram: '#FDF2FA' };
const KIND_TEXT:  Record<string, string> = { rss: '#8B2FC9', website: '#4338CA', instagram: '#A21CAF' };
const CANAL_ICON: Record<string, string> = { instagram: '📷', facebook: '📘', linkedin: '💼', tiktok: '🎵' };
const CANAL_NAME: Record<string, string> = { instagram: 'Instagram', facebook: 'Facebook', linkedin: 'LinkedIn', tiktok: 'TikTok' };

const INTERVALOS = [
  { label: '4h',  value: '4' },
  { label: '6h',  value: '6' },
  { label: '12h', value: '12' },
  { label: '24h', value: '24' },
  { label: 'Off', value: '0' },
];

const MAX_POSTS_OPTS = ['1', '2', '3', '5'];

function detectarKind(url: string): 'rss' | 'website' | 'instagram' {
  if (url.includes('instagram.com')) return 'instagram';
  if (/google\.com\/alerts\/feeds/i.test(url)) return 'rss';
  if (/\/feed|\/rss|\.xml|\/atom/.test(url)) return 'rss';
  return 'website';
}

// ─── sub-componente: cabeçalho de seção ──────────────────────────────────────

function SecHeader({ icon, title, count }: { icon: string; title: string; count?: number }) {
  return (
    <div className="flex items-center gap-2 mb-3 mt-6 first:mt-0">
      <span className="text-[18px]">{icon}</span>
      <h2 className="font-disp font-bold text-[16px]">{title}</h2>
      {count !== undefined && (
        <span className="ml-auto text-[12px] font-semibold text-mut">{count}</span>
      )}
    </div>
  );
}

// ─── sub-componente: toggle iOS-style ────────────────────────────────────────

function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!on)}
      className="relative w-[48px] h-[28px] rounded-full transition-colors flex-shrink-0"
      style={{ background: on ? '#8B2FC9' : '#D4B8EF' }}
      aria-pressed={on}
    >
      <span
        className="absolute top-[3px] w-[22px] h-[22px] rounded-full bg-white shadow transition-all"
        style={{ left: on ? '23px' : '3px' }}
      />
    </button>
  );
}

// ─── sub-componente: card de fonte ───────────────────────────────────────────

function FonteCard({
  fonte,
  onToggle,
  onRemover,
  onTestar,
}: {
  fonte: Fonte;
  onToggle: (id: string, active: boolean) => void;
  onRemover: (id: string) => void;
  onTestar: (id: string) => void;
}) {
  return (
    <div
      className="bg-white rounded-2xl px-4 py-3 mb-2.5 flex items-center gap-3"
      style={{
        boxShadow: '0 1px 3px rgba(23,38,44,.06),0 4px 14px rgba(23,38,44,.05)',
        opacity: fonte.active ? 1 : 0.55,
      }}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span
            className="text-[10.5px] font-bold px-2 py-0.5 rounded-full flex-shrink-0"
            style={{ background: KIND_BG[fonte.kind] ?? '#FDF8FF', color: KIND_TEXT[fonte.kind] ?? '#555' }}
          >
            {KIND_LABEL[fonte.kind] ?? fonte.kind}
          </span>
          <p className="text-[13.5px] font-semibold text-ink truncate">{fonte.name}</p>
        </div>
        <p className="text-[11.5px] text-soft truncate">{fonte.url}</p>
        {fonte.warning && (
          <p className="text-[11px] mt-1 leading-snug font-medium" style={{ color: '#C97F16' }}>
            {fonte.warning}
          </p>
        )}
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        <button
          onClick={() => onTestar(fonte.id)}
          className="text-[11px] font-semibold px-2.5 py-1 rounded-full transition"
          style={{ background: '#F0F4F5', color: '#7B6B8A' }}
          title="Testar conexão"
        >
          ↺
        </button>
        <Toggle on={fonte.active} onChange={v => onToggle(fonte.id, v)} />
        <button
          onClick={() => onRemover(fonte.id)}
          className="text-soft hover:text-red-400 transition text-[18px] leading-none"
          title="Remover"
        >
          ×
        </button>
      </div>
    </div>
  );
}

// ─── página principal ─────────────────────────────────────────────────────────

export default function Configuracoes() {
  const [config, setConfig] = useState<Config | null>(null);
  const [fontes, setFontes] = useState<Fonte[]>([]);
  const [salvando, setSalvando] = useState(false);
  const [toast, setToast] = useState('');

  // seletor de cenário para fontes
  const [fontesProfileId, setFontesProfileId] = useState<string>('');

  // form nova fonte
  const [novaUrl,  setNovaUrl]  = useState('');
  const [novaName, setNovaName] = useState('');
  const [novaKind, setNovaKind] = useState<'rss'|'website'|'instagram'>('website');
  const [adicionando, setAdicionando] = useState(false);
  const [testeResult, setTesteResult] = useState<TesteStatus>(null);
  const [testando, setTestando] = useState<string | null>(null); // id ou 'novo'
  const [sincronizando, setSincronizando] = useState(false);

  const mostrarToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 2500);
  }, []);

  // ── carga inicial ──────────────────────────────────────────────────────────

  async function carregarFontes(profileId?: string) {
    const pid = profileId ?? fontesProfileId;
    const qs = pid ? `?profileId=${pid}` : '';
    const r = await fetch(`/api/radar/fontes${qs}`);
    if (r.ok) setFontes(await r.json());
  }

  async function carregarConfig() {
    const r = await fetch('/api/configuracoes');
    if (r.ok) setConfig(await r.json());
  }

  useEffect(() => {
    carregarConfig();
    carregarPerfis(); // carregarPerfis calls carregarFontes once it knows the active profile
  }, []);

  // ── fontes ─────────────────────────────────────────────────────────────────

  function handleNovaUrl(val: string) {
    setNovaUrl(val);
    setNovaKind(detectarKind(val));
    setTesteResult(null);
  }

  async function testarNova() {
    if (!novaUrl.trim()) return;
    setTestando('novo');
    setTesteResult(null);
    const r = await fetch('/api/radar/fontes/testar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: novaUrl.trim(), kind: novaKind, name: novaName.trim() }),
    });
    setTesteResult(await r.json());
    setTestando(null);
  }

  async function converterAlerts() {
    setTestando('novo');
    setTesteResult(null);
    const r = await fetch('/api/radar/fontes/testar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: novaUrl.trim(), kind: 'rss', name: novaName.trim() }),
    });
    const res: TesteStatus = await r.json();
    setTestando(null);
    if (res?.suggestedNewsUrl) {
      setNovaUrl(res.suggestedNewsUrl);
      setNovaKind('rss');
      setTesteResult(null);
      mostrarToast('URL convertida para Google News ✓');
    } else {
      setTesteResult(res);
    }
  }

  async function adicionarFonte() {
    if (!novaUrl.trim() || !novaName.trim()) return;
    if (/google\.com\/alerts\/feeds/i.test(novaUrl)) {
      setTesteResult({ ok: false, count: 0, isGoogleAlerts: true, erro: 'Converta para Google News antes de adicionar.' });
      return;
    }
    setAdicionando(true);
    // testa antes de salvar
    const tr = await fetch('/api/radar/fontes/testar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: novaUrl.trim(), kind: novaKind, name: novaName.trim() }),
    });
    const teste: TesteStatus = await tr.json();
    setTesteResult(teste);
    if (teste && !teste.ok) { setAdicionando(false); return; }

    // se detectou RSS de um site, muda o kind/url para o feed direto
    const urlFinal  = (teste?.rssUrl) ? teste.rssUrl : novaUrl.trim();
    const kindFinal = (teste?.rssUrl) ? 'rss' : novaKind;

    const r = await fetch('/api/radar/fontes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: urlFinal, kind: kindFinal, name: novaName.trim(), profileId: fontesProfileId || undefined }),
    });
    if (r.ok) {
      setNovaUrl(''); setNovaName(''); setNovaKind('website'); setTesteResult(null);
      await carregarFontes();
      mostrarToast('Fonte adicionada ✓');
    }
    setAdicionando(false);
  }

  async function toggleFonte(id: string, active: boolean) {
    setFontes(prev => prev.map(f => f.id === id ? { ...f, active } : f));
    await fetch('/api/radar/fontes', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, active }),
    });
  }

  async function removerFonte(id: string) {
    setFontes(prev => prev.filter(f => f.id !== id));
    await fetch('/api/radar/fontes', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
  }

  async function testarExistente(id: string) {
    const fonte = fontes.find(f => f.id === id);
    if (!fonte) return;
    setTestando(id);
    const r = await fetch('/api/radar/fontes/testar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: fonte.url, kind: fonte.kind, name: fonte.name }),
    });
    const res: TesteStatus = await r.json();
    setTestando(null);
    mostrarToast(res?.ok
      ? `✓ ${fonte.name}: ${res.count} itens encontrados`
      : `✗ ${fonte.name}: ${res?.erro ?? 'Erro'}`);
  }

  async function sincronizarTudo() {
    setSincronizando(true);
    const r = await fetch('/api/radar/auto', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rodar: true, profileId: fontesProfileId || undefined }),
    });
    const d = await r.json();
    setSincronizando(false);
    if (r.ok) {
      mostrarToast(`✓ Sincronizado: ${d.postsGerados} post${d.postsGerados !== 1 ? 's' : ''} gerado${d.postsGerados !== 1 ? 's' : ''}, ${d.novosItens} itens novos`);
    } else {
      mostrarToast(`✗ ${d.error ?? 'Erro ao sincronizar'}`);
    }
  }

  // ── config geral ───────────────────────────────────────────────────────────

  async function salvarCampo(patch: Partial<Omit<Config, 'chaves'>>) {
    setSalvando(true);
    await fetch('/api/configuracoes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    });
    setSalvando(false);
    mostrarToast('Salvo ✓');
  }

  function setPerfil(v: string) { setConfig(c => c ? { ...c, perfil: v } : c); }
  function setWhatsapp(v: string) { setConfig(c => c ? { ...c, whatsappNumero: v } : c); }
  function setIntervalHoras(v: string) {
    setConfig(c => c ? { ...c, intervalHoras: v } : c);
    salvarCampo({ intervalHoras: v });
  }
  function setMaxPosts(v: string) {
    setConfig(c => c ? { ...c, maxPostsPerRun: v } : c);
    salvarCampo({ maxPostsPerRun: v });
  }

  function toggleHorario(h: string) {
    setConfig(c => {
      if (!c) return c;
      const atual: string[] = JSON.parse(c.publicacaoHorarios || '[]');
      const novo = atual.includes(h) ? atual.filter(x => x !== h) : [...atual, h];
      const json = JSON.stringify(novo.sort());
      salvarCampo({ publicacaoHorarios: json });
      return { ...c, publicacaoHorarios: json };
    });
  }

  function setPorSemana(v: string) {
    setConfig(c => c ? { ...c, publicacaoPorSemana: v } : c);
    salvarCampo({ publicacaoPorSemana: v });
  }

  function setCanal(name: string, active: boolean) {
    setConfig(c => {
      if (!c) return c;
      const canais = c.canais.map(ch => ch.name === name ? { ...ch, active } : ch);
      salvarCampo({ canais });
      return { ...c, canais };
    });
  }

  // ── perfis de marca ────────────────────────────────────────────────────────
  const PERFIL_VAZIO: Omit<BrandPerfil, 'id' | 'ativo' | 'pausado' | 'radarAtivo'> = {
    name: '', displayName: '', descricao: '', publicoAlvo: '',
    tomDeVoz: '', idioma: 'pt-BR', contato: '',
    produtos: '', frequencia: '', objetivo: '', notasLivres: '',
  };

  const [perfis, setPerfis] = useState<BrandPerfil[]>([]);
  const [perfilEditando, setPerfilEditando] = useState<BrandPerfil | null>(null);
  const [perfilForm, setPerfilForm] = useState(PERFIL_VAZIO);
  const [salvandoPerfil, setSalvandoPerfil] = useState(false);
  const [excluindoPerfil, setExcluindoPerfil] = useState<string | null>(null);

  async function carregarPerfis() {
    const r = await fetch('/api/perfis');
    if (r.ok) {
      const lista: BrandPerfil[] = await r.json();
      setPerfis(lista);
      const ativo = lista.find(p => p.ativo) ?? lista[0];
      if (ativo && !fontesProfileId) {
        setFontesProfileId(ativo.id);
        await carregarFontes(ativo.id);
      }
    }
  }

  async function salvarPerfil() {
    if (!perfilForm.displayName.trim()) return;
    setSalvandoPerfil(true);
    const body = perfilEditando
      ? { ...perfilForm, id: perfilEditando.id, name: perfilEditando.name }
      : { ...perfilForm, name: perfilForm.displayName.trim().toLowerCase().replace(/\s+/g, '-') };
    const r = await fetch('/api/perfis', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (r.ok) {
      await carregarPerfis();
      setPerfilEditando(null);
      setPerfilForm(PERFIL_VAZIO);
      mostrarToast('Perfil salvo ✓');
    }
    setSalvandoPerfil(false);
  }

  async function ativarPerfil(id: string) {
    await fetch('/api/perfis', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    setPerfis(prev => prev.map(p => ({ ...p, ativo: p.id === id })));
  }

  async function toggleRadarPerfil(perfilId: string, radarAtivo: boolean) {
    await fetch('/api/perfis', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ perfilId, radarAtivo }),
    });
    setPerfis(prev => prev.map(p => p.id === perfilId ? { ...p, radarAtivo } : p));
  }

  async function excluirPerfil(id: string) {
    setExcluindoPerfil(id);
    const r = await fetch('/api/perfis', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    if (r.ok) {
      await carregarPerfis();
      mostrarToast('Perfil excluído');
    } else {
      const e = await r.json();
      mostrarToast(e.error ?? 'Erro ao excluir');
    }
    setExcluindoPerfil(null);
  }

  function editarPerfil(p: BrandPerfil) {
    setPerfilEditando(p);
    setPerfilForm({
      name: p.name, displayName: p.displayName, descricao: p.descricao,
      publicoAlvo: p.publicoAlvo, tomDeVoz: p.tomDeVoz, idioma: p.idioma,
      contato: p.contato, produtos: p.produtos, frequencia: p.frequencia,
      objetivo: p.objetivo, notasLivres: p.notasLivres,
    });
  }


  if (!config) {
    return (
      <main className="px-4 pt-6">
        <p className="text-sm text-mut text-center pt-20 animate-pulse">Carregando…</p>
      </main>
    );
  }

  const ativas = fontes.filter(f => f.active).length;

  return (
    <main className="px-4">
      {/* Header */}
      <header className="pt-6 pb-4 flex items-center gap-3">
        <Link href="/" className="text-mut text-[22px] leading-none">‹</Link>
        <div>
          <p className="text-xs text-soft">Preferências do app</p>
          <h1 className="font-disp text-[23px] font-bold">Configurações</h1>
        </div>
      </header>

      {/* ── SEÇÃO 1: Fontes do Radar ─────────────────────────────────────── */}
      <SecHeader icon="📡" title="Fontes do Radar" count={`${ativas} ativa${ativas !== 1 ? 's' : ''} de ${fontes.length}` as unknown as number} />

      {/* seletor de cenário */}
      {perfis.length > 1 && (
        <div className="mb-3">
          <p className="text-[11px] font-semibold text-mut mb-1.5 px-0.5">Fontes do cenário:</p>
          <div className="flex gap-1.5 flex-wrap">
            {perfis.filter(p => !p.pausado).map(p => (
              <button
                key={p.id}
                onClick={() => {
                  setFontesProfileId(p.id);
                  setTesteResult(null);
                  carregarFontes(p.id);
                }}
                className="px-3 py-1.5 rounded-full text-[12px] font-semibold transition"
                style={{
                  background: fontesProfileId === p.id ? '#8B2FC9' : '#F0E8FA',
                  color: fontesProfileId === p.id ? '#fff' : '#8B2FC9',
                }}
              >
                {p.displayName}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* botão sync */}
      <button
        onClick={sincronizarTudo}
        disabled={sincronizando || ativas === 0}
        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-2xl text-[13px] font-semibold mb-3 transition active:scale-95 disabled:opacity-50"
        style={{ background: '#F0E8FA', color: '#8B2FC9' }}
      >
        {sincronizando ? '↻ Sincronizando…' : '🔄 Sincronizar agora'}
      </button>

      {/* cards de fontes */}
      {fontes.length === 0 && (
        <p className="text-[13px] text-mut text-center py-4">Nenhuma fonte cadastrada ainda.</p>
      )}
      {fontes.map(f => (
        <FonteCard
          key={f.id}
          fonte={f}
          onToggle={toggleFonte}
          onRemover={removerFonte}
          onTestar={testarExistente}
        />
      ))}

      {/* formulário nova fonte */}
      <div className="bg-white rounded-2xl px-4 py-4 mt-1" style={{ boxShadow: '0 1px 3px rgba(23,38,44,.06),0 4px 14px rgba(23,38,44,.05)' }}>
        <p className="text-[12px] font-bold text-soft mb-3">+ Adicionar fonte</p>

        <input
          value={novaName}
          onChange={e => setNovaName(e.target.value)}
          placeholder="Nome (ex: Insurance Journal)"
          className="w-full border border-[#E0E8EA] rounded-xl px-3 py-2.5 text-[13px] mb-2 outline-none focus:border-[#8B2FC9]"
        />
        <input
          value={novaUrl}
          onChange={e => handleNovaUrl(e.target.value)}
          placeholder="URL do site, feed RSS ou perfil Instagram"
          className="w-full border border-[#E0E8EA] rounded-xl px-3 py-2.5 text-[13px] mb-2 outline-none focus:border-[#8B2FC9]"
        />

        {/* aviso Google Alerts — detectado antes mesmo de testar */}
        {/google\.com\/alerts\/feeds/i.test(novaUrl) && (
          <div className="rounded-xl p-3 mb-2 text-[12px]" style={{ background: '#FFFBEB', color: '#92400E', borderLeft: '3px solid #F59E0B' }}>
            <p className="font-semibold mb-0.5">Este feed exige login no Google.</p>
            <p className="mb-2 leading-relaxed">Use o Google News com a mesma busca — funciona sem autenticação.</p>
            <button
              onClick={converterAlerts}
              disabled={testando === 'novo'}
              className="font-semibold px-3 py-1.5 rounded-lg text-[12px] transition active:scale-95 disabled:opacity-50"
              style={{ background: '#F59E0B', color: '#fff' }}
            >
              {testando === 'novo' ? 'Convertendo…' : 'Converter para Google News →'}
            </button>
          </div>
        )}

        {/* seletor de tipo */}
        <div className="flex gap-1.5 mb-3">
          {(['website', 'rss', 'instagram'] as const).map(k => (
            <button
              key={k}
              onClick={() => setNovaKind(k)}
              className="flex-1 py-1.5 rounded-xl text-[12px] font-semibold transition"
              style={{
                background: novaKind === k ? KIND_BG[k] : '#F0F4F5',
                color: novaKind === k ? KIND_TEXT[k] : '#9CA3AF',
              }}
            >
              {KIND_LABEL[k]}
            </button>
          ))}
        </div>

        {/* aviso Instagram */}
        {novaKind === 'instagram' && (
          <div className="rounded-xl p-3 mb-3 text-[12px]" style={{ background: '#FDF2FA', color: '#831843' }}>
            <p className="font-semibold mb-0.5">Instagram não tem RSS nativo.</p>
            <p>Use o <b>rss.app</b> para criar um feed do perfil e adicione como tipo <b>RSS</b>.</p>
          </div>
        )}

        {/* resultado do teste */}
        {testeResult && (
          <div
            className="rounded-xl px-3 py-2.5 mb-3 text-[12.5px]"
            style={{
              background: testeResult.ok ? '#E6F4EE' : testeResult.isGoogleAlerts ? '#FFFBEB' : '#FEF2F2',
              color:      testeResult.ok ? '#166534' : testeResult.isGoogleAlerts ? '#92400E' : '#991B1B',
            }}
          >
            {testeResult.ok ? (
              <span className="font-semibold">
                ✓ Sincronizada — {testeResult.count} itens encontrados
                {testeResult.rssUrl ? ' (RSS detectado automaticamente)' : ''}
              </span>
            ) : testeResult.isGoogleAlerts ? (
              <div>
                <p className="font-semibold mb-1">Feed do Google Alerts exige login do Google.</p>
                {testeResult.suggestedNewsUrl ? (
                  <p className="leading-relaxed">
                    Sugestão:{' '}
                    <button
                      onClick={() => { setNovaUrl(testeResult.suggestedNewsUrl!); setNovaKind('rss'); setTesteResult(null); }}
                      className="underline font-semibold"
                    >
                      usar Google News — &quot;{testeResult.alertsQuery}&quot;
                    </button>
                  </p>
                ) : (
                  <p className="leading-relaxed">
                    Não foi possível detectar o termo automaticamente. Busque o termo no Google News e cole o link RSS aqui.
                  </p>
                )}
              </div>
            ) : (
              <span className="font-semibold">✗ Erro: {testeResult.erro}</span>
            )}
          </div>
        )}

        <div className="flex gap-2">
          <button
            onClick={testarNova}
            disabled={!novaUrl.trim() || testando === 'novo'}
            className="flex-1 py-2.5 rounded-xl text-[13px] font-semibold transition active:scale-95 disabled:opacity-50"
            style={{ background: '#F0F4F5', color: '#7B6B8A' }}
          >
            {testando === 'novo' ? 'Testando…' : 'Testar'}
          </button>
          <button
            onClick={adicionarFonte}
            disabled={!novaUrl.trim() || !novaName.trim() || adicionando}
            className="flex-[2] py-2.5 rounded-xl text-[13px] font-semibold text-white transition active:scale-95 disabled:opacity-50"
            style={{ background: '#8B2FC9' }}
          >
            {adicionando ? 'Adicionando…' : '+ Adicionar'}
          </button>
        </div>
      </div>

      {/* ── SEÇÃO 2: Automação ────────────────────────────────────────────── */}
      <SecHeader icon="⏱" title="Automação do Radar" />

      <div className="bg-white rounded-2xl px-4 py-4" style={{ boxShadow: '0 1px 3px rgba(23,38,44,.06),0 4px 14px rgba(23,38,44,.05)' }}>
        <p className="text-[12px] font-semibold text-mut mb-2">Frequência de varredura</p>
        <div className="flex gap-1.5 mb-5">
          {INTERVALOS.map(op => (
            <button
              key={op.value}
              onClick={() => setIntervalHoras(op.value)}
              className="flex-1 py-2 rounded-xl text-[12px] font-semibold transition"
              style={{
                background: config.intervalHoras === op.value ? '#8B2FC9' : '#F0F4F5',
                color: config.intervalHoras === op.value ? '#fff' : '#7B6B8A',
              }}
            >
              {op.label}
            </button>
          ))}
        </div>

        <p className="text-[12px] font-semibold text-mut mb-2">Posts gerados por execução</p>
        <div className="flex gap-1.5">
          {MAX_POSTS_OPTS.map(v => (
            <button
              key={v}
              onClick={() => setMaxPosts(v)}
              className="flex-1 py-2 rounded-xl text-[12px] font-semibold transition"
              style={{
                background: config.maxPostsPerRun === v ? '#8B2FC9' : '#F0F4F5',
                color: config.maxPostsPerRun === v ? '#fff' : '#7B6B8A',
              }}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      {/* ── SEÇÃO 2b: Cadência de publicação ─────────────────────────────── */}
      <SecHeader icon="🕐" title="Cadência de publicação" />

      <div className="bg-white rounded-2xl px-4 py-4 mb-3" style={{ boxShadow: '0 1px 3px rgba(23,38,44,.06),0 4px 14px rgba(23,38,44,.05)' }}>
        <p className="text-[12px] font-semibold text-mut mb-2">Horários preferidos</p>
        <p className="text-[11.5px] text-soft mb-3 leading-relaxed">
          A IA vai sugerir esses horários ao agendar e usará o próximo slot livre ao gerar posts pelo Radar.
        </p>
        <div className="grid grid-cols-4 gap-1.5 mb-5">
          {['07:00','08:00','09:00','10:00','11:00','12:00','14:00','16:00','17:00','18:00','19:00','21:00'].map(h => {
            const selecionados: string[] = JSON.parse(config.publicacaoHorarios || '[]');
            const on = selecionados.includes(h);
            return (
              <button
                key={h}
                onClick={() => toggleHorario(h)}
                className="py-2 rounded-xl text-[12px] font-semibold transition"
                style={{
                  background: on ? '#8B2FC9' : '#F0F4F5',
                  color: on ? '#fff' : '#7B6B8A',
                }}
              >
                {h.slice(0, 5)}
              </button>
            );
          })}
        </div>

        <p className="text-[12px] font-semibold text-mut mb-2">Posts por semana</p>
        <div className="flex gap-1.5">
          {[
            { label: '3×', value: '3', sub: 'seg/qua/sex' },
            { label: '5×', value: '5', sub: 'dias úteis' },
            { label: '7×', value: '7', sub: 'diário' },
            { label: '14×', value: '14', sub: '2/dia' },
          ].map(op => (
            <button
              key={op.value}
              onClick={() => setPorSemana(op.value)}
              className="flex-1 py-2 rounded-xl text-[12px] font-semibold transition flex flex-col items-center"
              style={{
                background: config.publicacaoPorSemana === op.value ? '#8B2FC9' : '#F0F4F5',
                color: config.publicacaoPorSemana === op.value ? '#fff' : '#7B6B8A',
              }}
            >
              <span>{op.label}</span>
              <span className="text-[9.5px] opacity-70 font-normal">{op.sub}</span>
            </button>
          ))}
        </div>

        {(() => {
          const h: string[] = JSON.parse(config.publicacaoHorarios || '[]');
          if (!h.length) return null;
          const slot = proximoSlot(h);
          if (!slot) return null;
          return (
            <p className="text-[11.5px] mt-3 font-semibold" style={{ color: '#8B2FC9' }}>
              ✦ Próximo slot: {formatarSlot(slot)}
            </p>
          );
        })()}
      </div>

      {/* ── SEÇÃO 3: Canais ───────────────────────────────────────────────── */}
      <SecHeader icon="📱" title="Canais ativos" />

      <div className="bg-white rounded-2xl overflow-hidden" style={{ boxShadow: '0 1px 3px rgba(23,38,44,.06),0 4px 14px rgba(23,38,44,.05)' }}>
        {config.canais.map((c, i) => (
          <div
            key={c.name}
            className="flex items-center gap-3 px-4 py-3.5"
            style={{ borderTop: i > 0 ? '1px solid #F0F4F5' : undefined }}
          >
            <span className="text-[20px] w-7 text-center flex-shrink-0">{CANAL_ICON[c.name] ?? '📢'}</span>
            <span className="flex-1 text-[14px] font-semibold text-ink">{CANAL_NAME[c.name] ?? c.name}</span>
            <Toggle on={c.active} onChange={v => setCanal(c.name, v)} />
          </div>
        ))}
      </div>

      {/* ── SEÇÃO 4: Perfis de Marca (DNA de Campanha) ───────────────────── */}
      <SecHeader icon="🎯" title="Perfis de Marca" count={perfis.length} />

      {/* Cards de perfis existentes */}
      {perfis.map(p => (
        <div key={p.id} className="bg-white rounded-2xl px-4 py-3.5 mb-2.5"
          style={{ boxShadow: '0 1px 3px rgba(23,38,44,.06),0 4px 14px rgba(23,38,44,.05)', opacity: p.ativo ? 1 : 0.75 }}>
          <div className="flex items-center gap-2 mb-1">
            {p.ativo && (
              <span className="text-[10.5px] font-bold px-2 py-0.5 rounded-full"
                style={{ background: '#E1F5EE', color: '#0F6E56' }}>✓ Ativo</span>
            )}
            {p.radarAtivo && (
              <span className="text-[10.5px] font-bold px-2 py-0.5 rounded-full"
                style={{ background: '#EEF2FF', color: '#4338CA' }}>📡 Radar</span>
            )}
            <p className="text-[14px] font-semibold text-ink flex-1 truncate">{p.displayName}</p>
            <button onClick={() => editarPerfil(p)}
              className="text-[12px] font-semibold px-2.5 py-1 rounded-full transition"
              style={{ background: '#F0F4F5', color: '#7B6B8A' }}>Editar</button>
            {!p.ativo && (
              <button onClick={() => ativarPerfil(p.id)}
                className="text-[12px] font-semibold px-2.5 py-1 rounded-full transition"
                style={{ background: '#F0E8FA', color: '#8B2FC9' }}>Usar</button>
            )}
            <button onClick={() => excluirPerfil(p.id)}
              disabled={excluindoPerfil === p.id}
              className="text-soft hover:text-red-400 text-[18px] leading-none transition disabled:opacity-40">
              {excluindoPerfil === p.id ? '…' : '×'}
            </button>
          </div>
          {p.descricao && <p className="text-[12px] text-mut truncate">{p.descricao}</p>}
          <div className="flex items-center gap-2 mt-2">
            <span className="text-[11.5px] text-mut">Radar automático</span>
            <Toggle on={p.radarAtivo} onChange={v => toggleRadarPerfil(p.id, v)} />
          </div>
        </div>
      ))}

      {/* Formulário de criação/edição */}
      <div className="bg-white rounded-2xl px-4 py-4 mb-3"
        style={{ boxShadow: '0 1px 3px rgba(23,38,44,.06),0 4px 14px rgba(23,38,44,.05)' }}>
        <p className="text-[13px] font-semibold text-ink mb-3">
          {perfilEditando ? `Editar — ${perfilEditando.displayName}` : '+ Novo perfil de marca'}
        </p>

        {([
          { key: 'displayName', label: 'Nome do perfil *', placeholder: 'Ex.: Francisco Dabus, Vip Insurance…' },
          { key: 'descricao',   label: 'Sobre o negócio', placeholder: 'O que você faz e onde atua.' },
          { key: 'publicoAlvo', label: 'Público-alvo', placeholder: 'Ex.: Brasileiros em Orlando, 30-55 anos.' },
          { key: 'produtos',    label: 'Produtos / serviços', placeholder: 'Ex.: Seguro auto, residencial, vida, saúde.' },
          { key: 'objetivo',    label: 'Objetivo de marketing', placeholder: 'Ex.: Gerar leads, aumentar autoridade, awareness.' },
          { key: 'tomDeVoz',    label: 'Tom de voz', placeholder: 'Ex.: Consultivo, caloroso, sem juridiquês.' },
          { key: 'frequencia',  label: 'Frequência de posts', placeholder: 'Ex.: 3x por semana, diário.' },
          { key: 'contato',     label: 'Site / link de contato', placeholder: 'https://…' },
          { key: 'notasLivres', label: 'Notas para o CMO', placeholder: 'Qualquer contexto adicional que a IA deve saber.' },
        ] as const).map(({ key, label, placeholder }) => (
          <div key={key} className="mb-3">
            <label className="text-[11.5px] font-semibold text-mut uppercase tracking-wide block mb-1">{label}</label>
            {key === 'descricao' || key === 'notasLivres' ? (
              <textarea
                value={perfilForm[key]}
                onChange={e => setPerfilForm(f => ({ ...f, [key]: e.target.value }))}
                placeholder={placeholder}
                rows={3}
                className="w-full border border-[#E0E8EA] rounded-xl px-3 py-2.5 text-[13px] outline-none focus:border-[#8B2FC9] resize-none font-sans leading-relaxed"
                style={{ background: '#FDF8FF' }}
              />
            ) : (
              <input
                type="text"
                value={perfilForm[key]}
                onChange={e => setPerfilForm(f => ({ ...f, [key]: e.target.value }))}
                placeholder={placeholder}
                className="w-full border border-[#E0E8EA] rounded-xl px-3 py-2.5 text-[13px] outline-none focus:border-[#8B2FC9]"
                style={{ background: '#FDF8FF' }}
              />
            )}
          </div>
        ))}

        <div className="flex gap-2 mt-1">
          {perfilEditando && (
            <button onClick={() => { setPerfilEditando(null); setPerfilForm(PERFIL_VAZIO); }}
              className="flex-1 py-2.5 rounded-xl text-[13px] font-semibold transition"
              style={{ background: '#F0F4F5', color: '#7B6B8A' }}>
              Cancelar
            </button>
          )}
          <button
            onClick={salvarPerfil}
            disabled={salvandoPerfil || !perfilForm.displayName.trim()}
            className="flex-[2] py-2.5 rounded-xl text-[13px] font-semibold text-white transition active:scale-95 disabled:opacity-60"
            style={{ background: '#8B2FC9' }}>
            {salvandoPerfil ? 'Salvando…' : perfilEditando ? 'Atualizar perfil' : 'Criar perfil'}
          </button>
        </div>
      </div>

      {/* WhatsApp */}
      <SecHeader icon="📲" title="WhatsApp CTA" />
      <div className="bg-white rounded-2xl px-4 py-4 mb-3" style={{ boxShadow: '0 1px 3px rgba(23,38,44,.06),0 4px 14px rgba(23,38,44,.05)' }}>
        <p className="text-[12px] text-mut mb-3 leading-relaxed">
          A IA inclui seu link <code className="bg-[#F0F4F5] px-1 rounded">wa.me</code> automaticamente nos posts com CTA de contato direto.
        </p>
        <div className="flex gap-2">
          <input
            type="tel"
            value={config.whatsappNumero}
            onChange={e => setWhatsapp(e.target.value)}
            placeholder="+1 (407) 000-0000"
            className="flex-1 border border-[#E0E8EA] rounded-xl px-3 py-2.5 text-[13.5px] outline-none focus:border-[#8B2FC9]"
            style={{ background: '#FDF8FF' }}
          />
          <button
            onClick={() => salvarCampo({ whatsappNumero: config.whatsappNumero })}
            disabled={salvando}
            className="px-5 rounded-xl text-[13px] font-semibold text-white transition active:scale-95 disabled:opacity-60"
            style={{ background: '#8B2FC9' }}
          >
            {salvando ? '…' : 'Salvar'}
          </button>
        </div>
        {config.whatsappNumero && (
          <p className="text-[11.5px] mt-2" style={{ color: '#F04E3E' }}>
            ✓ Link: wa.me/{config.whatsappNumero.replace(/\D/g, '')}
          </p>
        )}
      </div>

      {/* ── SEÇÃO 5: Chaves e integrações ────────────────────────────────── */}
      <SecHeader icon="🔑" title="Chaves e integrações" />

      <div className="bg-white rounded-2xl overflow-hidden" style={{ boxShadow: '0 1px 3px rgba(23,38,44,.06),0 4px 14px rgba(23,38,44,.05)' }}>
        {([
          { key: 'anthropic', label: 'Anthropic AI (geração de posts)', configured: config.chaves.anthropic },
          { key: 'ayrshare',  label: 'Ayrshare (publicação nas redes)',  configured: config.chaves.ayrshare  },
          { key: 'pexels',    label: 'Pexels (banco de fotos)',           configured: config.chaves.pexels    },
        ] as const).map((item, i) => (
          <div
            key={item.key}
            className="flex items-center gap-3 px-4 py-3.5"
            style={{ borderTop: i > 0 ? '1px solid #F0F4F5' : undefined }}
          >
            <div className="flex-1 min-w-0">
              <p className="text-[13.5px] font-semibold text-ink">{item.label}</p>
              <p className="text-[11.5px] mt-0.5"
                style={{ color: item.configured ? '#0F6E56' : '#C97F16' }}>
                {item.configured ? '✓ Configurada no .env' : '⚠ Faltando no .env'}
              </p>
            </div>
            <span
              className="text-[11px] font-bold px-2.5 py-1 rounded-full flex-shrink-0"
              style={item.configured
                ? { background: '#E1F5EE', color: '#0F6E56' }
                : { background: '#FBF1DE', color: '#C97F16' }}
            >
              {item.configured ? '✓ OK' : '✗'}
            </span>
          </div>
        ))}
      </div>

      <p className="text-[11.5px] text-soft text-center mt-3 mb-2">
        Para adicionar ou alterar chaves, edite o arquivo <code className="bg-[#F0F4F5] px-1 rounded">.env</code> e reinicie o servidor.
      </p>

      {/* Botão Sair */}
      <div className="mt-6 pt-5" style={{ borderTop: '1px solid #EDE6F5' }}>
        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="w-full py-3.5 rounded-2xl font-semibold text-[14px] transition active:scale-[.98]"
          style={{ background: '#FEF2F2', color: '#DC2626' }}
        >
          Sair da conta
        </button>
      </div>

      {/* toast global */}
      {toast && (
        <div
          className="fixed bottom-24 left-1/2 -translate-x-1/2 px-5 py-3 rounded-full text-[13px] font-semibold text-white z-50 shadow-lg"
          style={{ background: '#1A0A2E', maxWidth: '90vw', whiteSpace: 'nowrap' }}
        >
          {toast}
        </div>
      )}
    </main>
  );
}
