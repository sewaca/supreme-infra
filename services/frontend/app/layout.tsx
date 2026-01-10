import '@supreme-int/design-system/font.css';
import '@supreme-int/design-system/theme.css';
import { Header } from '@supreme-int/design-system/src/components/Header/Header';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Рецепты - Supreme-Infra' };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ru">
      <body>
        <Header logoText="🍳 Taste.IT" logoHref="/" />
        {children}
      </body>
    </html>
  );
}
