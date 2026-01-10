import '@supreme-int/design-system/font.css';
import '@supreme-int/design-system/theme.css';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Supreme Infra' };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ru">
      <body>{children}</body>
    </html>
  );
}
