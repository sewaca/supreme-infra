import '@supreme-int/design-system/font.css';
import '@supreme-int/design-system/variables.css';
import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider } from '@mui/material/styles';
import { AppRouterCacheProvider } from '@mui/material-nextjs/v16-appRouter';
import { MainAppBottomTabBar } from '@supreme-int/design-system/src/components/BottomTabBar/MainAppBottomTabBar';
import { getAuthInfo } from '@supreme-int/nextjs-shared/src/shared/auth/getAuthInfo';
import type { Metadata } from 'next';
import { Roboto } from 'next/font/google';
import { getUnreadCount } from '../src/shared/api/getUnreadCount';
import theme from '../src/shared/next/theme';

const roboto = Roboto({
  weight: ['300', '400', '500', '700'],
  subsets: ['latin', 'cyrillic'],
  display: 'swap',
  variable: '--font-roboto',
});

export const metadata: Metadata = {
  title: 'Новости – ЛК СПбГУТ',
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const auth = await getAuthInfo();
  let unreadMessagesCount = 0;
  if (auth.userId) {
    try {
      unreadMessagesCount = await getUnreadCount();
    } catch {}
  }

  return (
    <html lang="ru" className={roboto.variable}>
      <body style={{ display: 'flex', flexDirection: 'column', height: 'var(--user-screen-height)', margin: 0 }}>
        <AppRouterCacheProvider>
          <ThemeProvider theme={theme}>
            <CssBaseline />
            <main
              style={{
                flex: 1,
                paddingBottom: 'calc(48px + env(safe-area-inset-bottom, 0px))',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              {children}
            </main>
            <MainAppBottomTabBar unreadMessagesCount={unreadMessagesCount} />
          </ThemeProvider>
        </AppRouterCacheProvider>
      </body>
    </html>
  );
}
