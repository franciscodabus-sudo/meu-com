'use client';
import { usePathname } from 'next/navigation';
import Sidebar from './Sidebar';
import BottomNav from './BottomNav';

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  if (pathname === '/login') return <>{children}</>;

  return (
    <div className="lg:flex lg:h-screen lg:overflow-hidden">
      <Sidebar />
      {/* Content: mobile=430px centered, desktop=flex-1 */}
      <div className="flex-1 lg:overflow-hidden max-w-[430px] mx-auto lg:max-w-none lg:mx-0 lg:flex lg:flex-col">
        {children}
      </div>
      <BottomNav />
    </div>
  );
}
