import type { Metadata } from 'next';
import './font.css';

export const metadata: Metadata = { title: 'Supreme-Infra application' };

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ru">
      <body>{children}</body>
    </html>
  );
}
