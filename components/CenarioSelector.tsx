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
    // Notifica outras partes da UI via storage event
    localStorage.setItem('cenario-ativo', id);
    window.dispatchEvent(new Event('cenario-changed'));
  }

  useEffect(() => {
    carregar();
    function handleOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setAberto(false);
    }
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  if (!ativo || perfis.length <= 1) return null;

  return (
    <div ref={ref} className="relative">
      {/* Pill do cenário ativo */}
      <button
        onClick={() => setAberto(v => !v)}
        className="flex items-center gap-1.5 rounded-full px-2.5 py-1 transition active:scale-95"
        style={{ background: `${ativo.avatarColor}18`, border: `1.5px solid ${ativo.avatarColor}40` }}
      >
        <span
          className="w-[18px] h-[18px] rounded-full flex items-center justify-center text-[9px] font-bold text-white flex-shrink-0"
          style={{ background: ativo.avatarColor }}
        >
          {initials(ativo.displayName)}
        </span>
        <span className="text-[11px] font-semibold max-w-[80px] truncate" style={{ color: ativo.avatarColor }}>
          {ativo.displayName}
        </span>
        <span className="text-[9px]" style={{ color: ativo.avatarColor }}>▾</span>
      </button>

      {/* Popover */}
      {aberto && (
        <div
          className="absolute top-full right-0 mt-1.5 w-[200px] bg-white rounded-2xl overflow-hidden z-50"
          style={{ boxShadow: '0 4px 24px rgba(23,38,44,.15)', border: '1px solid #E8EDEE' }}
        >
          <p className="text-[10px] font-bold text-mut uppercase tracking-wider px-3 pt-3 pb-1.5">Cenário ativo</p>
          {perfis.filter(p => !p.pausado).map(p => (
            <button
              key={p.id}
              onClick={() => trocar(p.id)}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 transition hover:bg-[#F6F8F8] text-left"
            >
              <span
                className="w-[28px] h-[28px] rounded-full flex items-center justify-center text-[11px] font-bold text-white flex-shrink-0"
                style={{ background: p.avatarColor }}
              >
                {initials(p.displayName)}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-[12.5px] font-semibold text-ink truncate">{p.displayName}</p>
                <p className="text-[10.5px] text-mut capitalize">{p.objetivo}</p>
              </div>
              {p.ativo && (
                <span className="w-[6px] h-[6px] rounded-full flex-shrink-0" style={{ background: '#17996B' }} />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
