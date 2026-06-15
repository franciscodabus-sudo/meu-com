import './globals.css';
import type { Metadata } from 'next';
import AppShell from '@/components/AppShell';
import Providers from '@/components/Providers';

export const metadata: Metadata = {
  title: 'Meu CMO',
  description: 'Seu diretor de marketing pessoal, movido a IA'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="bg-fundo text-ink font-sans antialiased">
        <Providers>
          <AppShell>{children}</AppShell>
        </Providers>
      </body>
    </html>
  );
}
