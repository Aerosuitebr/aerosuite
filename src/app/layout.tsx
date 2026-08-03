import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Aerosuite',
  description: 'Plataforma Aerosuite — ecossistema Resolva Jato e MIRA.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
