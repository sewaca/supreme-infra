import '@supreme-int/design-system/font.css';
import '@supreme-int/design-system/theme.css';
import { Header } from '@supreme-int/design-system';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Авторизация - Supreme-Infra' };

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
