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
  weight: ['300', '400', '500', '700'],
  subsets: ['latin', 'cyrillic'],
  display: 'swap',
  variable: '--font-roboto',
});

export const metadata: Metadata = { title: 'Расписание' };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ru" className={roboto.variable}>
      <body style={{ display: 'flex', flexDirection: 'column', height: 'var(--user-screen-height)', margin: 0 }}>
        <AppRouterCacheProvider>
          <ThemeProvider theme={theme}>
            <CssBaseline />
            <main style={{ flex: 1, paddingBottom: '56px', display: 'flex', flexDirection: 'column' }}>{children}</main>
            <MainAppBottomTabBar homePath="/calendar" />
          </ThemeProvider>
        </AppRouterCacheProvider>
      </body>
    </html>
  );
}
