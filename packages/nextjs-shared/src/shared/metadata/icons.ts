import type { Metadata } from 'next';

export const sharedIconMetadata = {
  icons: {
    icon: [
      { url: '/favicon-96x96.png', type: 'image/png', sizes: '96x96' },
      { url: '/favicon.svg', type: 'image/svg+xml' },
    ],
    shortcut: '/favicon.ico',
    apple: { url: '/apple-touch-icon.png', sizes: '180x180' },
  },
  manifest: '/site.webmanifest',
  appleWebApp: {
    title: 'ЛК СПбГУТ',
  },
} satisfies Pick<Metadata, 'icons' | 'manifest' | 'appleWebApp'>;
