'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

function Icon({ d, ...rest }: { d: string } & React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
      width={20} height={20} {...rest}>
      <path d={d} />
    </svg>
  );
}

const NAV = [
  { href: '/',          label: 'Hoje',     icon: 'M4 5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v4a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5zm10 0a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v4a1 1 0 0 1-1 1h-4a1 1 0 0 1-1-1V5zm0 10a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v4a1 1 0 0 1-1 1h-4a1 1 0 0 1-1-1v-4zM4 15a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v4a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-4z' },
  { href: '/radar',     label: 'Radar',    icon: 'M12 12m-3 0a3 3 0 1 0 6 0a3 3 0 1 0-6 0M12 12m-7 0a7 7 0 1 0 14 0a7 7 0 1 0-14 0M17.66 6.34l-.01.01M6.34 6.34l-.01.01' },
  { href: '/cenarios',  label: 'Cenários', icon: 'M4 4h4v16H4zM10 4h4v16h-4zM16 4h4v16h-4z' },
  { href: '/studio',    label: 'Studio',   icon: 'M15 8h.01M3 6a3 3 0 0 1 3-3h12a3 3 0 0 1 3 3v12a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3V6zm0 9 5-5 4 4 2-2 4 4' },
];

export default function Sidebar() {
  const pathname = usePathname();
  if (pathname === '/login') return null;

  return (
    <aside
      className="hidden lg:flex flex-col w-16 h-screen flex-shrink-0 py-3"
      style={{ background: '#1A0A2E', zIndex: 20 }}
    >
      {/* Logo */}
      <div className="flex justify-center mb-5">
        <div
          className="w-9 h-9 flex items-center justify-center text-white font-bold text-[16px] font-disp"
          style={{ background: 'linear-gradient(135deg, #8B2FC9, #F04E3E)', borderRadius: 10 }}
        >
          V
        </div>
      </div>

      {/* Nav items */}
      <nav className="flex-1 flex flex-col gap-0.5 px-1.5">
        {NAV.map(({ href, label, icon }) => {
          const active = href === '/' ? pathname === '/' : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className="relative flex flex-col items-center gap-1 py-2.5 rounded-xl transition"
              style={{ color: active ? '#F04E3E' : '#7B6B8A' }}
            >
              {active && (
                <span
                  className="absolute left-0 top-2 bottom-2 w-0.5 rounded-full"
                  style={{ background: '#F04E3E' }}
                />
              )}
              <Icon d={icon} style={{ color: active ? '#F04E3E' : '#7B6B8A' }} />
              <span style={{ fontSize: 9.5, fontWeight: 500, letterSpacing: 0.2 }}>{label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Config at bottom */}
      <div className="px-1.5">
        <Link
          href="/configuracoes"
          className="flex flex-col items-center gap-1 py-2.5 rounded-xl transition"
          style={{ color: pathname === '/configuracoes' ? '#F04E3E' : '#7B6B8A' }}
        >
          <Icon d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 0 0 2.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 0 0 1.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 0 0-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 0 0-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 0 0-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 0 0-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 0 0 1.066-2.573c-.94-1.543.826-3.31 2.37-2.37a1.724 1.724 0 0 0 2.572-1.065zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" />
          <span style={{ fontSize: 9.5, fontWeight: 500, letterSpacing: 0.2 }}>Config</span>
        </Link>
      </div>
    </aside>
  );
}
