import type { Metadata } from 'next';
import { Header } from '../src/widgets/Header/Header';
import './font.css';
import './theme.css';

export const metadata: Metadata = { title: 'Рецепты - Supreme-Infra' };

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ru">
      <body>
        <Header />
        {children}
      </body>
    </html>
  );
}
