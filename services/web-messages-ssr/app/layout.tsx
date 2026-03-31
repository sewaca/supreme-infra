import '@supreme-int/design-system/font.css';
import '@supreme-int/design-system/variables.css';
import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider } from '@mui/material/styles';
import { AppRouterCacheProvider } from '@mui/material-nextjs/v16-appRouter';
import { MainAppBottomTabBar } from '@supreme-int/design-system/src/components/BottomTabBar/MainAppBottomTabBar';
import type { Metadata } from 'next';
import { Roboto } from 'next/font/google';
import theme from '../src/shared/next/theme';

const roboto = Roboto({
  weight: ['300', '400', '500', '600', '700'],
  subsets: ['latin', 'cyrillic'],
  display: 'swap',
  variable: '--font-roboto',
});

export const metadata: Metadata = { title: 'Сообщения — СПбГУТ' };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ru" className={roboto.variable}>
      <body style={{ margin: 0, overflow: 'hidden' }}>
        <AppRouterCacheProvider>
          <ThemeProvider theme={theme}>
            <CssBaseline />
            <main
              style={{ height: 'calc(100dvh - 56px)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
            >
              {children}
            </main>
            <MainAppBottomTabBar homePath="/messages" />
          </ThemeProvider>
        </AppRouterCacheProvider>
      </body>
    </html>
  );
}
