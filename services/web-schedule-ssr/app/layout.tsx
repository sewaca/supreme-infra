import '@supreme-int/design-system/font.css';
import '@supreme-int/design-system/variables.css';
import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider } from '@mui/material/styles';
import { AppRouterCacheProvider } from '@mui/material-nextjs/v16-appRouter';
import { getTotalUnreadCountConversationsUnreadCountGet } from '@supreme-int/api-client/src/generated/core-messages';
import { client as coreMessagesClient } from '@supreme-int/api-client/src/generated/core-messages/client.gen';
import { MainAppBottomTabBar } from '@supreme-int/design-system/src/components/BottomTabBar/MainAppBottomTabBar';
import { getAuthInfo } from '@supreme-int/nextjs-shared/src/shared/auth/getAuthInfo';
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

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const auth = await getAuthInfo();
  let unreadMessagesCount = 0;
  if (auth.userId) {
    try {
      const res = await getTotalUnreadCountConversationsUnreadCountGet({ client: coreMessagesClient });
      unreadMessagesCount = res.data?.total_unread_count ?? 0;
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
