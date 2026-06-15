'use client';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';

const tabs = [
  {
    href: '/',
    label: 'Hoje',
    icon: (active: boolean) => (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20"
        style={{ color: active ? '#F04E3E' : '#7B6B8A' }}>
        <path d="M9 12l2 2 4-5" /><circle cx="12" cy="12" r="9" />
      </svg>
    ),
  },
  {
    href: '/radar',
    label: 'Radar',
    icon: (active: boolean) => (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20"
        style={{ color: active ? '#F04E3E' : '#7B6B8A' }}>
        <circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="4.5" /><path d="M12 12l6-6" />
      </svg>
    ),
  },
  {
    href: '/cenarios',
    label: 'Cenários',
    icon: (active: boolean) => (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20"
        style={{ color: active ? '#F04E3E' : '#7B6B8A' }}>
        <circle cx="8" cy="8" r="4" /><circle cx="16" cy="16" r="4" />
        <path d="M11.5 8H20M4 16h8.5" />
      </svg>
    ),
  },
  {
    href: '/agenda',
    label: 'Agenda',
    icon: (active: boolean) => (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20"
        style={{ color: active ? '#F04E3E' : '#7B6B8A' }}>
        <rect x="3" y="5" width="18" height="16" rx="3" /><path d="M3 10h18M8 3v4M16 3v4" />
      </svg>
    ),
  },
  {
    href: '/painel',
    label: 'Painel',
    icon: (active: boolean) => (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20"
        style={{ color: active ? '#F04E3E' : '#7B6B8A' }}>
        <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />
      </svg>
    ),
  },
];

export default function BottomNav() {
  const pathname = usePathname();

  if (pathname === '/login') return null;

  return (
    <nav
      className="lg:hidden fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] border-t grid grid-cols-5 px-1 pt-2 z-30 backdrop-blur-md"
      style={{
        background: 'rgba(253,248,255,0.94)',
        borderColor: '#EDE6F5',
        paddingBottom: 'calc(10px + env(safe-area-inset-bottom))',
      }}
    >
      {tabs.map(tab => {
        const active = pathname === tab.href;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className="flex flex-col items-center gap-[3px] py-1 text-[10px] font-semibold transition-colors no-underline"
            style={{ color: active ? '#F04E3E' : '#7B6B8A' }}
          >
            {/* Indicador de ativo */}
            {active && (
              <span
                className="w-[32px] h-[3px] rounded-full mb-0.5"
                style={{ background: 'var(--brand-gradient)' }}
              />
            )}
            {tab.icon(active)}
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
