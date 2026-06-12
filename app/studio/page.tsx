'use client';
import { useEffect, useState } from 'react';

type Canal = { id: string; name: string; active: boolean };

const CANAL_INFO: Record<string, { emoji: string; cor: string; descricao: string }> = {
  instagram: { emoji: '📸', cor: '#E4405F', descricao: 'Feed e Stories' },
  facebook:  { emoji: '👥', cor: '#1877F2', descricao: 'Feed e Reels' },
  linkedin:  { emoji: '💼', cor: '#0A66C2', descricao: 'Artigos e posts' },
  tiktok:    { emoji: '🎵', cor: '#010101', descricao: 'Vídeos curtos' },
};

function GerenciarCanais() {
  const [canais, setCanais] = useState<Canal[]>([]);
  const [salvando, setSalvando] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/canais').then(r => r.ok ? r.json() : []).then(setCanais);
  }, []);

  async function toggle(canal: Canal) {
    setSalvando(canal.id);
    try {
      const r = await fetch('/api/canais', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: canal.id, active: !canal.active })
      });
      if (r.ok) {
        setCanais(prev => prev.map(c => c.id === canal.id ? { ...c, active: !c.active } : c));
      }
    } finally {
      setSalvando(null);
    }
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden mb-6">
      <div className="px-4 pt-4 pb-2 border-b border-gray-50">
        <p className="text-[14px] font-bold text-ink">Canais ativos</p>
        <p className="text-[12px] text-soft">Canais desativados não recebem novos posts da IA</p>
      </div>
      {canais.map(canal => {
        const info = CANAL_INFO[canal.name] ?? { emoji: '🔗', cor: '#9CA3AF', descricao: '' };
        const loading = salvando === canal.id;
        return (
          <div key={canal.id} className="flex items-center gap-3 px-4 py-3.5 border-b border-gray-50 last:border-0">
            <span className="text-[22px]">{info.emoji}</span>
            <div className="flex-1">
              <p className="text-[14px] font-semibold capitalize text-ink">{canal.name}</p>
              <p className="text-[12px] text-soft">{info.descricao}</p>
            </div>
            {/* Toggle */}
            <button
              onClick={() => toggle(canal)}
              disabled={loading}
              className="relative w-[46px] h-[26px] rounded-full transition-colors duration-200 flex-shrink-0 disabled:opacity-60"
              style={{ background: canal.active ? info.cor : '#D1D5DB' }}
              aria-label={canal.active ? 'Desativar' : 'Ativar'}
            >
              <span
                className="absolute top-[3px] w-[20px] h-[20px] rounded-full bg-white shadow transition-all duration-200"
                style={{ left: canal.active ? 'calc(100% - 23px)' : '3px' }}
              />
            </button>
          </div>
        );
      })}
    </div>
  );
}

export default function Studio() {
  return (
    <main className="px-4 pb-8">
      <header className="pt-6 pb-4">
        <p className="text-xs text-soft">Configurações e canais</p>
        <h1 className="font-disp text-[23px] font-bold">Studio</h1>
      </header>

      <GerenciarCanais />

      {/* Próximas funcionalidades */}
      <div className="rounded-2xl p-4" style={{ background: '#F6F8F8' }}>
        <p className="text-[13px] font-bold text-ink mb-3">Em breve no Studio</p>
        {[
          { emoji: '📁', title: 'Banco de mídia', desc: 'Upload de fotos e vídeos do celular ou Google Drive' },
          { emoji: '🎨', title: 'Integração Canva', desc: 'Seus templates viram fundos automáticos nos posts' },
          { emoji: '♻️', title: 'Arquivo e reciclagem', desc: 'Posts de alto desempenho prontos para repostar' },
        ].map(item => (
          <div key={item.title} className="flex gap-3 mb-3 last:mb-0">
            <span className="text-[20px]">{item.emoji}</span>
            <div>
              <p className="text-[13px] font-semibold text-ink">{item.title}</p>
              <p className="text-[12px] text-soft">{item.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
