'use client';
import { useEffect, useRef, useState } from 'react';

type Perfil = {
  id: string; name: string; displayName: string;
  avatarColor: string; ativo: boolean; pausado: boolean; objetivo: string;
};

function initials(name: string) {
  return name.split(/\s+/).map(w => w[0]).slice(0, 2).join('').toUpperCase();
}

export default function CenarioSelector() {
  const [perfis, setPerfis] = useState<Perfil[]>([]);
  const [aberto, setAberto] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const ativo = perfis.find(p => p.ativo);

  async function carregar() {
    const r = await fetch('/api/perfis');
    if (r.ok) setPerfis(await r.json());
  }

  async function trocar(id: string) {
    setAberto(false);
    await fetch('/api/perfis', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    setPerfis(prev => prev.map(p => ({ ...p, ativo: p.id === id })));
    localStorage.setItem('cenario-ativo', id);
    window.dispatchEvent(new Event('cenario-changed'));
  }

  useEffect(() => {
    carregar();
    function handleOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setAberto(false);
    }
    document.addEventListener('mousedown', handleOutside);
    window.addEventListener('cenario-changed', carregar);
    return () => {
      document.removeEventListener('mousedown', handleOutside);
      window.removeEventListener('cenario-changed', carregar);
    };
  }, []);

  if (!ativo || perfis.length <= 1) return null;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setAberto(v => !v)}
        className="flex items-center gap-1.5 rounded-full px-2.5 py-1.5 transition active:scale-95"
        style={{ background: '#F0E8FA', border: '1.5px solid #D4B8EF' }}
      >
        <span
          className="w-[18px] h-[18px] rounded-full flex items-center justify-center text-[9px] font-bold text-white flex-shrink-0"
          style={{ background: ativo.avatarColor }}
        >
          {initials(ativo.displayName)}
        </span>
        <span className="text-[11px] font-semibold max-w-[80px] truncate" style={{ color: '#8B2FC9' }}>
          {ativo.displayName}
        </span>
        <span className="text-[9px]" style={{ color: '#8B2FC9' }}>▾</span>
      </button>

      {aberto && (
        <div
          className="absolute top-full right-0 mt-1.5 w-[210px] bg-white rounded-2xl overflow-hidden z-50"
          style={{ boxShadow: '0 4px 24px rgba(26,10,46,.15)', border: '1px solid #EDE6F5' }}
        >
          <p className="text-[10px] font-bold uppercase tracking-wider px-3 pt-3 pb-1.5" style={{ color: '#A89CB5' }}>
            Cenário ativo
          </p>
          {perfis.filter(p => !p.pausado).map(p => (
            <button
              key={p.id}
              onClick={() => trocar(p.id)}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 transition text-left"
              style={{ background: p.ativo ? '#F0E8FA' : 'transparent' }}
            >
              <span
                className="w-[28px] h-[28px] rounded-full flex items-center justify-center text-[11px] font-bold text-white flex-shrink-0"
                style={{ background: p.avatarColor }}
              >
                {initials(p.displayName)}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-[12.5px] font-semibold text-ink truncate">{p.displayName}</p>
                <p className="text-[10.5px] capitalize" style={{ color: '#A89CB5' }}>{p.objetivo}</p>
              </div>
              {p.ativo && (
                <span className="w-[6px] h-[6px] rounded-full flex-shrink-0 bg-brand" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
