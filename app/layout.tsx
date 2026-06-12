import './globals.css';
import type { Metadata } from 'next';
import BottomNav from '@/components/BottomNav';

export const metadata: Metadata = {
  title: 'Meu CMO',
  description: 'Seu diretor de marketing pessoal, movido a IA'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="max-w-[430px] mx-auto min-h-screen pb-24 bg-fundo">
        {children}
        <BottomNav />
      </body>
    </html>
  );
}
