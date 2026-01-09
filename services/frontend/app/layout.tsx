import '@supreme-int/design-system/font.css';
import '@supreme-int/design-system/theme.css';
import type { Metadata } from 'next';
import { Header } from '../src/widgets/Header/Header';

export const metadata: Metadata = { title: 'Рецепты - Supreme-Infra' };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ru">
      <body>
        <Header />
        {children}
      </body>
    </html>
  );
}
