# Инструкции: фронтенд-сервис web-messages-ssr (Next.js 16)

## Контекст

Фронтенд для системы обмена сообщениями. Интегрируется с бэкенд-сервисом `core-messages` (FastAPI, порт 8006).

Основной функционал:

- Список чатов (direct + broadcast) с количеством непрочитанных
- Просмотр и отправка сообщений (текст + файлы/изображения)
- Курсорная пагинация — infinite scroll вверх для истории
- WebSocket — мгновенное получение новых сообщений
- Создание нового direct-чата (поиск пользователя)
- Рассылки: преподаватель создаёт broadcast для выбранных групп; студенты видят рассылку с кнопкой «Ответить в ЛС»
- Поиск по сообщениям
- Mobile-responsive (два панели на desktop, одна на mobile)

**Образцы**: `services/web-profile-ssr/` (компоненты, server actions, API-клиент), `services/web-schedule-ssr/` (SSR с decode JWT).

---

## Шаг 0. Генерация сервиса

Пустой сервис уже сгенерирован, лежит по пути `services/web-messages-ssr`.

---

## Шаг 1. Environment

### src/shared/lib/environment.ts

```typescript
export const environment = {
  port: process.env.PORT || "3007",
  nodeEnv: process.env.NODE_ENV || "development",
  isDevelopment: process.env.NODE_ENV === "development",
  isProduction: process.env.NODE_ENV === "production",
  coreMessagesUrl: process.env.CORE_MESSAGES_URL || "http://core-messages.default.svc.cluster.local/core-messages",
  coreClientInfoUrl:
    process.env.CORE_CLIENT_INFO_URL || "http://core-client-info.default.svc.cluster.local/core-client-info",
  coreAuthUrl: process.env.CORE_AUTH_URL || "http://core-auth.default.svc.cluster.local/core-auth",
};
```

### .env.example

```env
PORT=3007
NODE_ENV=development
JWT_SECRET=local-development-secret
CORE_MESSAGES_URL=http://localhost:8006/core-messages
CORE_CLIENT_INFO_URL=http://localhost:8003/core-client-info
CORE_AUTH_URL=http://localhost:8002/core-auth
```

---

## Шаг 2. API-клиент

### src/shared/api/clients.ts

Паттерн — `services/web-profile-ssr/src/shared/api/clients.ts`:

```typescript
import { client as coreMessagesClient } from "@supreme-int/api-client/src/generated/core-messages/client.gen";
import { createServerFetch } from "@supreme-int/nextjs-shared/src/shared/fetch/createServerFetch";
import { environment } from "../lib/environment";

coreMessagesClient.setConfig({
  baseUrl: environment.coreMessagesUrl,
  fetch: createServerFetch(),
});

export { coreMessagesClient };
```

> `createServerFetch()` автоматически добавляет `Authorization: Bearer <token>` из cookie `auth_token`.

### src/shared/api/getUserId.ts

Паттерн — `services/web-schedule-ssr/app/calendar/page.tsx`:

```typescript
import { decodeJwt, TOKEN_KEY } from "@supreme-int/authorization-lib/src/jwt/decodeJwt";
import { cookies } from "next/headers";

export async function getAuthInfo() {
  const cookieStore = await cookies();
  const token = cookieStore.get(TOKEN_KEY)?.value ?? null;
  const decoded = token ? decodeJwt(token) : null;
  return {
    userId: decoded?.sub ?? null,
    role: decoded?.role ?? null,
    name: decoded?.name ?? null,
    token,
  };
}
```

---

## Шаг 3. Типы

### src/entities/Conversation/types.ts

```typescript
export interface ParticipantBrief {
  user_id: string;
  name: string;
  last_name: string;
  avatar: string | null;
  role: string | null;
}

export interface Conversation {
  id: string;
  type: "direct" | "broadcast";
  title: string | null;
  owner_id: string | null;
  last_message_at: string | null;
  last_message_preview: string | null;
  unread_count: number;
  participants: ParticipantBrief[];
  participant_count: number;
}

export interface ConversationUpdateItem {
  conversation_id: string;
  last_message_at: string | null;
  last_message_preview: string | null;
  unread_count: number;
  last_sender_name: string | null;
}
```

### src/entities/Message/types.ts

```typescript
export interface Attachment {
  id: string;
  file_url: string;
  file_name: string;
  file_size: number;
  mime_type: string;
  thumbnail_url: string | null;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  sender_name: string;
  sender_last_name: string;
  sender_avatar: string | null;
  content: string;
  content_type: string;
  attachments: Attachment[];
  created_at: string;
  is_own: boolean;
}

export interface MessageSearchResult {
  message: Message;
  conversation_id: string;
  conversation_title: string | null;
  conversation_type: string;
  highlight: string;
}
```

---

## Шаг 4. Структура страниц (App Router)

```
app/
  layout.tsx                            — Root layout (MUI, шрифт, CssBaseline)
  not-found.tsx
  api/
    status/route.ts                     — Health check (сгенерирован)
  messages/
    layout.tsx                          — Двухпанельный layout
    page.tsx                            — «Выберите чат» empty state
    actions.ts                          — Все server actions
    new/
      page.tsx                          — Новый direct-чат (поиск user)
    broadcast/
      page.tsx                          — Список рассылок (для teacher)
      new/
        page.tsx                        — Создание рассылки
    search/
      page.tsx                          — Поиск по сообщениям
    [conversationId]/
      page.tsx                          — Чат (сообщения)
```

**Все страницы** с серверными вызовами обязательно экспортируют:

```typescript
export const dynamic = "force-dynamic";
```

---

## Шаг 5. Root Layout

### app/layout.tsx

Паттерн — `services/web-auth-ssr/app/layout.tsx`:

```typescript
import '@supreme-int/design-system/font.css';
import '@supreme-int/design-system/variables.css';
import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider } from '@mui/material/styles';
import { AppRouterCacheProvider } from '@mui/material-nextjs/v16-appRouter';
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
      <body>
        <AppRouterCacheProvider>
          <ThemeProvider theme={theme}>
            <CssBaseline />
            {children}
          </ThemeProvider>
        </AppRouterCacheProvider>
      </body>
    </html>
  );
}
```

---

## Шаг 6. Messages Layout (двухпанельный)

### app/messages/layout.tsx — Server Component

```typescript
import { CoreMessages } from '@supreme-int/api-client/src/index';
import { coreMessagesClient } from '../../src/shared/api/clients';
import { getAuthInfo } from '../../src/shared/api/getUserId';
import { MessagesLayout } from '../../src/views/MessagesLayout/MessagesLayout';

export const dynamic = 'force-dynamic';

export default async function Layout({ children }: { children: React.ReactNode }) {
  const auth = await getAuthInfo();

  let conversations = [];
  if (auth.userId) {
    const res = await CoreMessages.getConversationsConversationsGet({
      client: coreMessagesClient,
      query: { limit: 30 },
    });
    conversations = res.data?.items ?? [];
  }

  return (
    <MessagesLayout
      initialConversations={conversations}
      userRole={auth.role}
      userId={auth.userId}
      token={auth.token}
    >
      {children}
    </MessagesLayout>
  );
}
```

### src/views/MessagesLayout/MessagesLayout.tsx — Client Component

Двухпанельный layout с sidebar (список чатов) и main area (children).

```typescript
'use client';

import { usePathname } from 'next/navigation';
import { useCallback, useState } from 'react';
import type { Conversation, ConversationUpdateItem } from '../../entities/Conversation/types';
import { useWebSocket } from '../../shared/hooks/useWebSocket';
import { ConversationListView } from '../ConversationListView/ConversationListView';
import styles from './MessagesLayout.module.css';

interface Props {
  initialConversations: Conversation[];
  userRole: string | null;
  userId: string | null;
  token: string | null;
  children: React.ReactNode;
}

export function MessagesLayout({ initialConversations, userRole, userId, token, children }: Props) {
  const pathname = usePathname();
  const [conversations, setConversations] = useState(initialConversations);

  // Определяем что показывать на мобилке
  const isInChat = pathname !== '/messages' && pathname !== '/messages/new' && !pathname.startsWith('/messages/broadcast') && !pathname.startsWith('/messages/search');
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 769;

  // WebSocket для real-time обновлений
  const handleWsMessage = useCallback((event: any) => {
    if (event.type === 'new_message') {
      setConversations(prev => {
        const updated = prev.map(c =>
          c.id === event.data.conversation_id
            ? {
                ...c,
                last_message_at: event.data.created_at,
                last_message_preview: event.data.content.slice(0, 200),
                unread_count: event.data.is_own ? c.unread_count : c.unread_count + 1,
              }
            : c
        );
        // Пересортировать по last_message_at
        return updated.sort((a, b) =>
          (b.last_message_at ?? '').localeCompare(a.last_message_at ?? '')
        );
      });
    }
    if (event.type === 'new_conversation') {
      setConversations(prev => [event.data, ...prev]);
    }
  }, []);

  useWebSocket({ token, onMessage: handleWsMessage });

  // Обновить unread_count при чтении
  const markAsRead = useCallback((conversationId: string) => {
    setConversations(prev =>
      prev.map(c => c.id === conversationId ? { ...c, unread_count: 0 } : c)
    );
  }, []);

  return (
    <div className={styles.container}>
      <aside className={`${styles.sidebar} ${isInChat && isMobile ? styles.hidden : ''}`}>
        <ConversationListView
          conversations={conversations}
          userRole={userRole}
          currentPath={pathname}
        />
      </aside>
      <main className={`${styles.main} ${!isInChat && isMobile ? styles.hidden : ''}`}>
        {children}
      </main>
    </div>
  );
}
```

### src/views/MessagesLayout/MessagesLayout.module.css

```css
.container {
  display: grid;
  grid-template-columns: 360px 1fr;
  height: 100dvh;
  overflow: hidden;
}

.sidebar {
  border-right: 1px solid var(--color-divider, #e0e0e0);
  overflow-y: auto;
  background: var(--color-background, #fff);
}

.main {
  overflow-y: auto;
  display: flex;
  flex-direction: column;
}

.hidden {
  display: none;
}

@media (max-width: 768px) {
  .container {
    grid-template-columns: 1fr;
  }
}
```

---

## Шаг 7. WebSocket Hook

### src/shared/hooks/useWebSocket.ts

```typescript
"use client";

import { useEffect, useRef, useCallback } from "react";

interface UseWebSocketProps {
  token: string | null;
  onMessage: (event: any) => void;
}

export function useWebSocket({ token, onMessage }: UseWebSocketProps) {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const onMessageRef = useRef(onMessage);
  onMessageRef.current = onMessage;

  const connect = useCallback(() => {
    if (!token) return;

    // Определяем WS URL: в production через ingress, в dev напрямую
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/core-messages/ws?token=${token}`;

    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log("[ws] connected");
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        onMessageRef.current(data);
      } catch {
        console.error("[ws] failed to parse message");
      }
    };

    ws.onclose = (event) => {
      console.log("[ws] disconnected:", event.code, event.reason);
      wsRef.current = null;
      // Auto-reconnect через 3 секунды (если не закрыто намеренно)
      if (event.code !== 4001) {
        reconnectTimeoutRef.current = setTimeout(connect, 3000);
      }
    };

    ws.onerror = () => {
      console.error("[ws] error");
      ws.close();
    };

    wsRef.current = ws;
  }, [token]);

  useEffect(() => {
    connect();

    return () => {
      clearTimeout(reconnectTimeoutRef.current);
      if (wsRef.current) {
        wsRef.current.close(1000, "component unmount");
        wsRef.current = null;
      }
    };
  }, [connect]);

  // Функция для отправки typing indicator
  const sendTyping = useCallback((conversationId: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: "typing",
          data: { conversation_id: conversationId },
        })
      );
    }
  }, []);

  return { sendTyping };
}
```

---

## Шаг 8. Sidebar — Список чатов

### src/views/ConversationListView/ConversationListView.tsx

```typescript
'use client';

import AddIcon from '@mui/icons-material/Add';
import CampaignIcon from '@mui/icons-material/Campaign';
import SearchIcon from '@mui/icons-material/Search';
import { Box, IconButton, List, Typography } from '@mui/material';
import Link from 'next/link';
import type { Conversation } from '../../entities/Conversation/types';
import { ConversationItem } from '../../widgets/ConversationItem/ConversationItem';

interface Props {
  conversations: Conversation[];
  userRole: string | null;
  currentPath: string;
}

export function ConversationListView({ conversations, userRole, currentPath }: Props) {
  // Извлечь conversationId из pathname
  const activeId = currentPath.startsWith('/messages/')
    ? currentPath.split('/')[2]
    : null;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid', borderColor: 'divider' }}>
        <Typography variant="h6" fontWeight={600}>Сообщения</Typography>
        <Box>
          <IconButton component={Link} href="/messages/search" size="small">
            <SearchIcon />
          </IconButton>
          <IconButton component={Link} href="/messages/new" size="small">
            <AddIcon />
          </IconButton>
          {userRole === 'teacher' && (
            <IconButton component={Link} href="/messages/broadcast" size="small">
              <CampaignIcon />
            </IconButton>
          )}
        </Box>
      </Box>

      {/* Conversation list */}
      <List sx={{ flex: 1, overflow: 'auto', p: 0 }}>
        {conversations.length === 0 ? (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <Typography color="text.secondary">Нет чатов</Typography>
          </Box>
        ) : (
          conversations.map((conv) => (
            <ConversationItem
              key={conv.id}
              conversation={conv}
              isActive={conv.id === activeId}
            />
          ))
        )}
      </List>
    </Box>
  );
}
```

### src/widgets/ConversationItem/ConversationItem.tsx

```typescript
'use client';

import CampaignIcon from '@mui/icons-material/Campaign';
import { Avatar, Badge, Box, ListItemButton, Typography } from '@mui/material';
import Link from 'next/link';
import type { Conversation } from '../../entities/Conversation/types';
import { formatMessageDate } from '../../shared/lib/formatDate';

interface Props {
  conversation: Conversation;
  isActive: boolean;
}

export function ConversationItem({ conversation, isActive }: Props) {
  const { type, participants, title, last_message_at, last_message_preview, unread_count } = conversation;

  // Для direct — показать собеседника, для broadcast — title
  const displayName = type === 'broadcast'
    ? title ?? 'Рассылка'
    : participants[0]
      ? `${participants[0].name} ${participants[0].last_name}`
      : 'Неизвестный';

  const avatar = type === 'direct' ? participants[0]?.avatar : null;
  const initials = type === 'broadcast'
    ? 'Р'
    : participants[0]
      ? `${participants[0].name[0]}${participants[0].last_name[0]}`
      : '?';

  return (
    <ListItemButton
      component={Link}
      href={`/messages/${conversation.id}`}
      selected={isActive}
      sx={{ px: 2, py: 1.5, gap: 1.5 }}
    >
      <Badge
        badgeContent={unread_count}
        color="primary"
        invisible={unread_count === 0}
        overlap="circular"
      >
        <Avatar src={avatar ?? undefined} sx={{ width: 48, height: 48 }}>
          {type === 'broadcast' ? <CampaignIcon /> : initials}
        </Avatar>
      </Badge>

      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <Typography variant="subtitle2" noWrap fontWeight={unread_count > 0 ? 700 : 500}>
            {displayName}
          </Typography>
          {last_message_at && (
            <Typography variant="caption" color="text.secondary" sx={{ flexShrink: 0, ml: 1 }}>
              {formatMessageDate(last_message_at)}
            </Typography>
          )}
        </Box>
        {last_message_preview && (
          <Typography variant="body2" color="text.secondary" noWrap>
            {last_message_preview}
          </Typography>
        )}
      </Box>
    </ListItemButton>
  );
}
```

### src/shared/lib/formatDate.ts

```typescript
export function formatMessageDate(isoDate: string): string {
  const date = new Date(isoDate);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return date.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
  }
  if (diffDays === 1) {
    return "Вчера";
  }
  if (diffDays < 7) {
    return date.toLocaleDateString("ru-RU", { weekday: "short" });
  }
  return date.toLocaleDateString("ru-RU", { day: "numeric", month: "short" });
}

export function formatMessageTime(isoDate: string): string {
  return new Date(isoDate).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
}

export function formatDateSeparator(isoDate: string): string {
  const date = new Date(isoDate);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Сегодня";
  if (diffDays === 1) return "Вчера";
  return date.toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" });
}
```

---

## Шаг 9. Chat View (страница чата)

### app/messages/[conversationId]/page.tsx — Server Component

```typescript
import { CoreMessages } from '@supreme-int/api-client/src/index';
import { coreMessagesClient } from '../../../src/shared/api/clients';
import { getAuthInfo } from '../../../src/shared/api/getUserId';
import { ChatView } from '../../../src/views/ChatView/ChatView';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

type Props = {
  params: Promise<{ conversationId: string }>;
};

export default async function Page({ params }: Props) {
  const { conversationId } = await params;
  const auth = await getAuthInfo();

  if (!auth.userId) redirect('/login');

  // Параллельная загрузка: детали чата + первая страница сообщений
  const [convRes, messagesRes] = await Promise.allSettled([
    CoreMessages.getConversationConversationsConversationIdGet({
      client: coreMessagesClient,
      path: { conversation_id: conversationId },
    }),
    CoreMessages.getConversationMessagesConversationsConversationIdMessagesGet({
      client: coreMessagesClient,
      path: { conversation_id: conversationId },
      query: { limit: 30 },
    }),
  ]);

  const conversation = convRes.status === 'fulfilled' ? convRes.value.data : null;
  const messagesData = messagesRes.status === 'fulfilled' ? messagesRes.value.data : null;

  if (!conversation) redirect('/messages');

  return (
    <ChatView
      conversation={conversation}
      initialMessages={messagesData?.items ?? []}
      initialCursor={messagesData?.next_cursor ?? null}
      initialHasMore={messagesData?.has_more ?? false}
      userId={auth.userId}
      userRole={auth.role}
    />
  );
}
```

### src/views/ChatView/ChatView.tsx — Client Component

Основной компонент чата: header + список сообщений (infinite scroll вверх) + ввод сообщения.

```typescript
'use client';

import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { Box, IconButton, Typography } from '@mui/material';
import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { Conversation } from '../../entities/Conversation/types';
import type { Message } from '../../entities/Message/types';
import { markAsRead, sendMessage } from '../../../app/messages/actions';
import { MessageInput } from '../../widgets/MessageInput/MessageInput';
import { MessageList } from '../../widgets/MessageList/MessageList';
import { ReplyInDmButton } from '../../widgets/ReplyInDmButton/ReplyInDmButton';
import styles from './ChatView.module.css';

interface Props {
  conversation: Conversation;
  initialMessages: Message[];
  initialCursor: string | null;
  initialHasMore: boolean;
  userId: string;
  userRole: string | null;
}

export function ChatView({ conversation, initialMessages, initialCursor, initialHasMore, userId, userRole }: Props) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [cursor, setCursor] = useState(initialCursor);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [loading, setLoading] = useState(false);

  const isBroadcast = conversation.type === 'broadcast';
  const isOwner = conversation.owner_id === userId;
  const canReply = !isBroadcast || isOwner;

  // Определить display name
  const displayName = isBroadcast
    ? conversation.title ?? 'Рассылка'
    : conversation.participants.find(p => p.user_id !== userId)
      ? `${conversation.participants.find(p => p.user_id !== userId)!.name} ${conversation.participants.find(p => p.user_id !== userId)!.last_name}`
      : 'Чат';

  const subtitle = isBroadcast && !isOwner
    ? 'Рассылка'
    : isBroadcast
      ? `Рассылка (${conversation.participant_count} студентов)`
      : undefined;

  // Mark as read при открытии
  useEffect(() => {
    if (messages.length > 0) {
      markAsRead(conversation.id, messages[0].id);
    }
  }, [conversation.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Отправка сообщения
  const handleSend = useCallback(async (content: string, files?: File[]) => {
    const result = await sendMessage(conversation.id, content);
    if (result.success && result.message) {
      setMessages(prev => [result.message!, ...prev]);
    }
    return result;
  }, [conversation.id]);

  // Подгрузка старых сообщений (infinite scroll вверх)
  const handleLoadMore = useCallback(async () => {
    if (loading || !hasMore || !cursor) return;
    setLoading(true);
    try {
      const res = await fetch(
        `/api/messages/history?conversation_id=${conversation.id}&cursor=${cursor}&limit=30`
      );
      if (res.ok) {
        const data = await res.json();
        setMessages(prev => [...prev, ...data.items]);
        setCursor(data.next_cursor);
        setHasMore(data.has_more);
      }
    } catch (error) {
      console.error('Failed to load more messages:', error);
    } finally {
      setLoading(false);
    }
  }, [loading, hasMore, cursor, conversation.id]);

  // Обработка WS-событий для этого чата
  // (глобальный WS в layout обновляет conversation list;
  //  здесь нужен listener для новых сообщений в текущем чате)
  useEffect(() => {
    const handler = (event: CustomEvent) => {
      const wsEvent = event.detail;
      if (wsEvent.type === 'new_message' && wsEvent.data.conversation_id === conversation.id && wsEvent.data.sender_id !== userId) {
        setMessages(prev => [wsEvent.data, ...prev]);
        // Автоматически mark as read
        markAsRead(conversation.id, wsEvent.data.id);
      }
    };
    window.addEventListener('ws-message' as any, handler);
    return () => window.removeEventListener('ws-message' as any, handler);
  }, [conversation.id, userId]);

  return (
    <Box className={styles.chatContainer}>
      {/* Header */}
      <Box className={styles.header}>
        <IconButton component={Link} href="/messages" sx={{ display: { xs: 'flex', md: 'none' } }}>
          <ArrowBackIcon />
        </IconButton>
        <Box sx={{ flex: 1, ml: 1 }}>
          <Typography variant="subtitle1" fontWeight={600} noWrap>{displayName}</Typography>
          {subtitle && <Typography variant="caption" color="text.secondary">{subtitle}</Typography>}
        </Box>
      </Box>

      {/* Messages */}
      <MessageList
        messages={messages}
        hasMore={hasMore}
        loading={loading}
        onLoadMore={handleLoadMore}
        userId={userId}
      />

      {/* Input */}
      {canReply ? (
        <MessageInput onSend={handleSend} conversationId={conversation.id} />
      ) : (
        <ReplyInDmButton ownerId={conversation.owner_id!} />
      )}
    </Box>
  );
}
```

### src/views/ChatView/ChatView.module.css

```css
.chatContainer {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.header {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid var(--color-divider, #e0e0e0);
  background: var(--color-background, #fff);
  flex-shrink: 0;
}
```

---

## Шаг 10. Message List (Infinite Scroll вверх)

### src/widgets/MessageList/MessageList.tsx

Список сообщений с IntersectionObserver для подгрузки истории при скролле вверх.
Паттерн — `services/web-profile-ssr/src/widgets/orders/OrdersList/OrdersList.tsx`.

```typescript
'use client';

import { Box, CircularProgress, Typography } from '@mui/material';
import { useCallback, useEffect, useRef } from 'react';
import type { Message } from '../../entities/Message/types';
import { formatDateSeparator } from '../../shared/lib/formatDate';
import { ChatBubble } from '../ChatBubble/ChatBubble';
import styles from './MessageList.module.css';

interface Props {
  messages: Message[];
  hasMore: boolean;
  loading: boolean;
  onLoadMore: () => void;
  userId: string;
}

export function MessageList({ messages, hasMore, loading, onLoadMore, userId }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const prevScrollHeightRef = useRef(0);
  const isInitialRef = useRef(true);

  // IntersectionObserver для загрузки старых сообщений при скролле вверх
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          // Запомнить scrollHeight перед загрузкой
          if (scrollRef.current) {
            prevScrollHeightRef.current = scrollRef.current.scrollHeight;
          }
          onLoadMore();
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, loading, onLoadMore]);

  // Сохранить позицию скролла после подгрузки старых сообщений
  useEffect(() => {
    if (scrollRef.current && prevScrollHeightRef.current > 0) {
      const newScrollHeight = scrollRef.current.scrollHeight;
      const diff = newScrollHeight - prevScrollHeightRef.current;
      scrollRef.current.scrollTop += diff;
      prevScrollHeightRef.current = 0;
    }
  }, [messages.length]);

  // При первом рендере — прокрутить вниз
  useEffect(() => {
    if (isInitialRef.current && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      isInitialRef.current = false;
    }
  }, []);

  // При получении нового сообщения — прокрутить вниз (если уже внизу)
  useEffect(() => {
    if (!isInitialRef.current && scrollRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
      const isAtBottom = scrollHeight - scrollTop - clientHeight < 100;
      if (isAtBottom) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }
    }
  }, [messages.length]);

  // Сообщения приходят в порядке DESC (новые первые) — разворачиваем для отображения
  const reversed = [...messages].reverse();

  // Группировка по датам
  let lastDate = '';

  return (
    <Box ref={scrollRef} className={styles.messageList}>
      {/* Sentinel для загрузки старых сообщений */}
      <Box ref={sentinelRef} sx={{ minHeight: 1 }}>
        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
            <CircularProgress size={24} />
          </Box>
        )}
      </Box>

      {reversed.map((msg) => {
        const msgDate = new Date(msg.created_at).toDateString();
        const showDateSeparator = msgDate !== lastDate;
        lastDate = msgDate;

        return (
          <Box key={msg.id}>
            {showDateSeparator && (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 1.5 }}>
                <Typography variant="caption" sx={{ px: 2, py: 0.5, borderRadius: 2, bgcolor: 'action.hover' }}>
                  {formatDateSeparator(msg.created_at)}
                </Typography>
              </Box>
            )}
            <ChatBubble message={msg} isOwn={msg.sender_id === userId} />
          </Box>
        );
      })}

      {reversed.length === 0 && (
        <Box sx={{ display: 'flex', flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Typography color="text.secondary">Нет сообщений. Начните переписку!</Typography>
        </Box>
      )}
    </Box>
  );
}
```

### src/widgets/MessageList/MessageList.module.css

```css
.messageList {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  padding: 8px 16px;
  gap: 4px;
}
```

---

## Шаг 11. Chat Bubble

### src/widgets/ChatBubble/ChatBubble.tsx

```typescript
'use client';

import { Avatar, Box, Typography } from '@mui/material';
import type { Message } from '../../entities/Message/types';
import { formatMessageTime } from '../../shared/lib/formatDate';
import { FileAttachment } from '../FileAttachment/FileAttachment';
import styles from './ChatBubble.module.css';

interface Props {
  message: Message;
  isOwn: boolean;
}

export function ChatBubble({ message, isOwn }: Props) {
  return (
    <Box className={`${styles.wrapper} ${isOwn ? styles.own : styles.other}`}>
      {!isOwn && (
        <Avatar
          src={message.sender_avatar ?? undefined}
          sx={{ width: 32, height: 32, mt: 0.5 }}
        >
          {message.sender_name[0]}
        </Avatar>
      )}
      <Box className={`${styles.bubble} ${isOwn ? styles.bubbleOwn : styles.bubbleOther}`}>
        {!isOwn && (
          <Typography variant="caption" fontWeight={600} color="primary.main">
            {message.sender_name} {message.sender_last_name}
          </Typography>
        )}
        <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
          {message.content}
        </Typography>
        {message.attachments.length > 0 && (
          <Box sx={{ mt: 1, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
            {message.attachments.map((att) => (
              <FileAttachment key={att.id} attachment={att} />
            ))}
          </Box>
        )}
        <Typography variant="caption" color={isOwn ? 'rgba(255,255,255,0.7)' : 'text.secondary'} sx={{ display: 'block', textAlign: 'right', mt: 0.5 }}>
          {formatMessageTime(message.created_at)}
        </Typography>
      </Box>
    </Box>
  );
}
```

### src/widgets/ChatBubble/ChatBubble.module.css

```css
.wrapper {
  display: flex;
  gap: 8px;
  max-width: 75%;
}

.own {
  align-self: flex-end;
  flex-direction: row-reverse;
}

.other {
  align-self: flex-start;
}

.bubble {
  padding: 8px 12px;
  border-radius: 12px;
  min-width: 80px;
}

.bubbleOwn {
  background: var(--color-primary, #1976d2);
  color: #fff;
  border-bottom-right-radius: 4px;
}

.bubbleOther {
  background: var(--color-surface-variant, #f0f0f0);
  color: var(--color-text-primary, #1a1a1a);
  border-bottom-left-radius: 4px;
}
```

---

## Шаг 12. Message Input

### src/widgets/MessageInput/MessageInput.tsx

```typescript
'use client';

import AttachFileIcon from '@mui/icons-material/AttachFile';
import SendIcon from '@mui/icons-material/Send';
import { Box, IconButton, TextField } from '@mui/material';
import { useCallback, useRef, useState } from 'react';

interface Props {
  onSend: (content: string, files?: File[]) => Promise<{ success: boolean; error?: string }>;
  conversationId: string;
}

export function MessageInput({ onSend, conversationId }: Props) {
  const [content, setContent] = useState('');
  const [sending, setSending] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSend = useCallback(async () => {
    const trimmed = content.trim();
    if (!trimmed || sending) return;

    setSending(true);
    const result = await onSend(trimmed);
    if (result.success) {
      setContent('');
    }
    setSending(false);
  }, [content, sending, onSend]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }, [handleSend]);

  const handleFileClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;

    // TODO: upload files via /files/upload endpoint, then send message with attachment IDs
    // Для v1: показать ошибку если файл слишком большой
  };

  return (
    <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 1, p: 2, borderTop: '1px solid', borderColor: 'divider' }}>
      <IconButton size="small" onClick={handleFileClick}>
        <AttachFileIcon />
      </IconButton>
      <input
        ref={fileInputRef}
        type="file"
        hidden
        onChange={handleFileChange}
        accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.zip,.rar"
      />
      <TextField
        fullWidth
        multiline
        maxRows={5}
        size="small"
        placeholder="Напишите сообщение..."
        value={content}
        onChange={(e) => setContent(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={sending}
      />
      <IconButton color="primary" onClick={handleSend} disabled={!content.trim() || sending}>
        <SendIcon />
      </IconButton>
    </Box>
  );
}
```

---

## Шаг 13. Reply in DM (для broadcast)

### src/widgets/ReplyInDmButton/ReplyInDmButton.tsx

```typescript
'use client';

import ReplyIcon from '@mui/icons-material/Reply';
import { Box, Button } from '@mui/material';
import { useRouter } from 'next/navigation';
import { useCallback, useState } from 'react';
import { createDirectConversation } from '../../../app/messages/actions';

interface Props {
  ownerId: string;
}

export function ReplyInDmButton({ ownerId }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleClick = useCallback(async () => {
    setLoading(true);
    const result = await createDirectConversation(ownerId);
    if (result.success && result.conversationId) {
      router.push(`/messages/${result.conversationId}`);
    }
    setLoading(false);
  }, [ownerId, router]);

  return (
    <Box sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider', textAlign: 'center' }}>
      <Button
        variant="outlined"
        startIcon={<ReplyIcon />}
        onClick={handleClick}
        disabled={loading}
      >
        Ответить в ЛС
      </Button>
    </Box>
  );
}
```

---

## Шаг 14. Server Actions

### app/messages/actions.ts

Паттерн — `services/web-profile-ssr/app/profile/settings/actions.ts`:

```typescript
"use server";

import { CoreMessages } from "@supreme-int/api-client/src/index";
import { coreMessagesClient } from "../../src/shared/api/clients";
import type { Message } from "../../src/entities/Message/types";

export async function sendMessage(
  conversationId: string,
  content: string
): Promise<{ success: boolean; message?: Message; error?: string }> {
  try {
    const res = await CoreMessages.sendMessageConversationsConversationIdMessagesPost({
      client: coreMessagesClient,
      path: { conversation_id: conversationId },
      body: { content, content_type: "text" },
    });

    if (res.data) {
      return { success: true, message: res.data as Message };
    }
    return { success: false, error: "Не удалось отправить сообщение" };
  } catch {
    return { success: false, error: "Ошибка отправки сообщения" };
  }
}

export async function createDirectConversation(
  recipientId: string
): Promise<{ success: boolean; conversationId?: string; error?: string }> {
  try {
    const res = await CoreMessages.createDirectConversationConversationsDirectPost({
      client: coreMessagesClient,
      body: { recipient_id: recipientId },
    });

    if (res.data) {
      return { success: true, conversationId: res.data.id };
    }
    return { success: false, error: "Не удалось создать чат" };
  } catch {
    return { success: false, error: "Ошибка создания чата" };
  }
}

export async function createBroadcast(
  title: string,
  groupNames: string[],
  initialMessage?: string
): Promise<{ success: boolean; conversationId?: string; error?: string }> {
  try {
    const res = await CoreMessages.createBroadcastBroadcastsPost({
      client: coreMessagesClient,
      body: { title, group_names: groupNames, initial_message: initialMessage || undefined },
    });

    if (res.data) {
      return { success: true, conversationId: res.data.id };
    }
    return { success: false, error: "Не удалось создать рассылку" };
  } catch {
    return { success: false, error: "Ошибка создания рассылки" };
  }
}

export async function markAsRead(conversationId: string, lastReadMessageId: string): Promise<void> {
  try {
    await CoreMessages.markAsReadConversationsConversationIdReadPost({
      client: coreMessagesClient,
      path: { conversation_id: conversationId },
      body: { last_read_message_id: lastReadMessageId },
    });
  } catch {
    // Не критично — просто лог
    console.error("[markAsRead] failed for conversation:", conversationId);
  }
}

export async function deleteConversation(conversationId: string): Promise<{ success: boolean; error?: string }> {
  try {
    await CoreMessages.deleteConversationConversationsConversationIdDelete({
      client: coreMessagesClient,
      path: { conversation_id: conversationId },
    });
    return { success: true };
  } catch {
    return { success: false, error: "Не удалось удалить чат" };
  }
}

export async function searchUsers(
  query: string
): Promise<{ user_id: string; name: string; last_name: string; avatar: string | null }[]> {
  try {
    const res = await CoreMessages.searchUsersUsersSearchGet({
      client: coreMessagesClient,
      query: { q: query, limit: 10 },
    });
    return res.data?.items ?? [];
  } catch {
    return [];
  }
}

export async function searchMessages(query: string, cursor?: string) {
  try {
    const res = await CoreMessages.searchMessagesMessagesSearchGet({
      client: coreMessagesClient,
      query: { q: query, cursor, limit: 20 },
    });
    return res.data ?? { items: [], next_cursor: null };
  } catch {
    return { items: [], next_cursor: null };
  }
}

export async function getAvailableGroups(): Promise<string[]> {
  try {
    const res = await CoreMessages.getGroupsBroadcastsGroupsGet({
      client: coreMessagesClient,
    });
    return (res.data as string[]) ?? [];
  } catch {
    return [];
  }
}
```

> **Важно**: Названия функций API-клиента (типа `sendMessageConversationsConversationIdMessagesPost`) — автоматически генерируются из OpenAPI schema. Реальные названия станут известны после запуска `pnpm gen:api-client`. Адаптируй их под фактически сгенерированные.

---

## Шаг 15. Страницы

### app/messages/page.tsx — Empty state

```typescript
import { Box, Button, Typography } from '@mui/material';
import ChatIcon from '@mui/icons-material/Chat';
import Link from 'next/link';

export default function MessagesPage() {
  return (
    <Box sx={{ display: 'flex', flex: 1, alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 2 }}>
      <ChatIcon sx={{ fontSize: 64, color: 'text.secondary' }} />
      <Typography variant="h6" color="text.secondary">Выберите чат или начните новую переписку</Typography>
      <Button variant="contained" component={Link} href="/messages/new">Написать</Button>
    </Box>
  );
}
```

### app/messages/new/page.tsx — Новый direct-чат

```typescript
import { NewMessageView } from '../../../src/views/NewMessageView/NewMessageView';

export const dynamic = 'force-dynamic';

export default function NewPage() {
  return <NewMessageView />;
}
```

#### src/views/NewMessageView/NewMessageView.tsx

```typescript
'use client';

import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { Autocomplete, Box, CircularProgress, IconButton, TextField, Typography } from '@mui/material';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useState } from 'react';
import { createDirectConversation, searchUsers } from '../../../app/messages/actions';

interface UserOption {
  user_id: string;
  name: string;
  last_name: string;
  avatar: string | null;
}

export function NewMessageView() {
  const router = useRouter();
  const [options, setOptions] = useState<UserOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTimeout, setSearchTimeout] = useState<ReturnType<typeof setTimeout>>();

  const handleSearch = useCallback((query: string) => {
    clearTimeout(searchTimeout);
    if (query.length < 2) {
      setOptions([]);
      return;
    }
    setSearchTimeout(setTimeout(async () => {
      setLoading(true);
      const users = await searchUsers(query);
      setOptions(users);
      setLoading(false);
    }, 300));
  }, [searchTimeout]);

  const handleSelect = useCallback(async (_: any, user: UserOption | null) => {
    if (!user) return;
    const result = await createDirectConversation(user.user_id);
    if (result.success && result.conversationId) {
      router.push(`/messages/${result.conversationId}`);
    }
  }, [router]);

  return (
    <Box sx={{ p: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
        <IconButton component={Link} href="/messages">
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h6">Новое сообщение</Typography>
      </Box>
      <Autocomplete
        options={options}
        getOptionLabel={(opt) => `${opt.name} ${opt.last_name}`}
        onInputChange={(_, value) => handleSearch(value)}
        onChange={handleSelect}
        loading={loading}
        noOptionsText="Введите имя для поиска"
        loadingText="Поиск..."
        renderInput={(params) => (
          <TextField
            {...params}
            label="Кому"
            placeholder="Начните вводить имя..."
            slotProps={{
              input: {
                ...params.InputProps,
                endAdornment: (
                  <>
                    {loading && <CircularProgress size={20} />}
                    {params.InputProps.endAdornment}
                  </>
                ),
              },
            }}
          />
        )}
      />
    </Box>
  );
}
```

### app/messages/broadcast/page.tsx — Список рассылок

```typescript
import { CoreMessages } from '@supreme-int/api-client/src/index';
import { coreMessagesClient } from '../../../src/shared/api/clients';
import { getAuthInfo } from '../../../src/shared/api/getUserId';
import { BroadcastListView } from '../../../src/views/BroadcastListView/BroadcastListView';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function BroadcastPage() {
  const auth = await getAuthInfo();
  if (auth.role !== 'teacher') redirect('/messages');

  const res = await CoreMessages.getBroadcastsBroadcastsGet({
    client: coreMessagesClient,
    query: { limit: 30 },
  });

  return <BroadcastListView broadcasts={res.data?.items ?? []} />;
}
```

### app/messages/broadcast/new/page.tsx — Создание рассылки

```typescript
import { getAuthInfo } from '../../../../src/shared/api/getUserId';
import { NewBroadcastView } from '../../../../src/views/NewBroadcastView/NewBroadcastView';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function NewBroadcastPage() {
  const auth = await getAuthInfo();
  if (auth.role !== 'teacher') redirect('/messages');

  return <NewBroadcastView />;
}
```

#### src/views/NewBroadcastView/NewBroadcastView.tsx

```typescript
'use client';

import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { Autocomplete, Box, Button, Chip, IconButton, TextField, Typography } from '@mui/material';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { createBroadcast, getAvailableGroups } from '../../../../app/messages/actions';

export function NewBroadcastView() {
  const router = useRouter();
  const [groups, setGroups] = useState<string[]>([]);
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    getAvailableGroups().then(setGroups);
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!title.trim() || selectedGroups.length === 0) return;
    setSending(true);
    const result = await createBroadcast(title, selectedGroups, message || undefined);
    if (result.success && result.conversationId) {
      router.push(`/messages/${result.conversationId}`);
    }
    setSending(false);
  }, [title, selectedGroups, message, router]);

  return (
    <Box sx={{ p: 2, maxWidth: 600 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
        <IconButton component={Link} href="/messages/broadcast">
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h6">Новая рассылка</Typography>
      </Box>

      <TextField
        fullWidth
        label="Заголовок рассылки"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        sx={{ mb: 2 }}
      />

      <Autocomplete
        multiple
        options={groups}
        value={selectedGroups}
        onChange={(_, value) => setSelectedGroups(value)}
        renderTags={(value, getTagProps) =>
          value.map((group, index) => (
            <Chip label={group} {...getTagProps({ index })} key={group} />
          ))
        }
        renderInput={(params) => (
          <TextField {...params} label="Группы" placeholder="Выберите группы..." />
        )}
        sx={{ mb: 2 }}
      />

      <TextField
        fullWidth
        multiline
        rows={4}
        label="Первое сообщение (необязательно)"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        sx={{ mb: 3 }}
      />

      <Button
        variant="contained"
        onClick={handleSubmit}
        disabled={!title.trim() || selectedGroups.length === 0 || sending}
        fullWidth
      >
        Создать рассылку
      </Button>
    </Box>
  );
}
```

### app/messages/search/page.tsx — Поиск

```typescript
import { SearchView } from '../../../src/views/SearchView/SearchView';

export const dynamic = 'force-dynamic';

export default function SearchPage() {
  return <SearchView />;
}
```

#### src/views/SearchView/SearchView.tsx

```typescript
'use client';

import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { Box, IconButton, List, ListItemButton, TextField, Typography } from '@mui/material';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useState } from 'react';
import type { MessageSearchResult } from '../../entities/Message/types';
import { formatMessageDate } from '../../shared/lib/formatDate';
import { searchMessages } from '../../../app/messages/actions';

export function SearchView() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<MessageSearchResult[]>([]);
  const [searchTimeout, setSearchTimeout] = useState<ReturnType<typeof setTimeout>>();

  const handleSearch = useCallback((value: string) => {
    setQuery(value);
    clearTimeout(searchTimeout);
    if (value.length < 2) {
      setResults([]);
      return;
    }
    setSearchTimeout(setTimeout(async () => {
      const data = await searchMessages(value);
      setResults(data.items ?? []);
    }, 300));
  }, [searchTimeout]);

  return (
    <Box sx={{ p: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <IconButton component={Link} href="/messages">
          <ArrowBackIcon />
        </IconButton>
        <TextField
          fullWidth
          size="small"
          placeholder="Поиск по сообщениям..."
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          autoFocus
        />
      </Box>

      <List>
        {results.map((r) => (
          <ListItemButton
            key={r.message.id}
            onClick={() => router.push(`/messages/${r.conversation_id}`)}
            sx={{ flexDirection: 'column', alignItems: 'flex-start', gap: 0.5 }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
              <Typography variant="subtitle2">
                {r.conversation_title ?? `${r.message.sender_name} ${r.message.sender_last_name}`}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {formatMessageDate(r.message.created_at)}
              </Typography>
            </Box>
            <Typography
              variant="body2"
              color="text.secondary"
              dangerouslySetInnerHTML={{ __html: r.highlight }}
              sx={{
                '& mark': { bgcolor: 'warning.light', borderRadius: 0.5, px: 0.25 },
              }}
            />
          </ListItemButton>
        ))}
        {query.length >= 2 && results.length === 0 && (
          <Typography color="text.secondary" sx={{ p: 2, textAlign: 'center' }}>Ничего не найдено</Typography>
        )}
      </List>
    </Box>
  );
}
```

---

## Шаг 16. API Route для проксирования запросов

### app/api/messages/history/route.ts

Этот route нужен для клиентских запросов (infinite scroll), чтобы не делать fetch с клиента напрямую к бэкенду:

```typescript
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { environment } from "../../../../src/shared/lib/environment";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const conversationId = searchParams.get("conversation_id");
  const cursor = searchParams.get("cursor");
  const limit = searchParams.get("limit") || "30";

  if (!conversationId) {
    return NextResponse.json({ error: "conversation_id required" }, { status: 400 });
  }

  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;

  const url = new URL(`${environment.coreMessagesUrl}/conversations/${conversationId}/messages`);
  url.searchParams.set("limit", limit);
  if (cursor) url.searchParams.set("cursor", cursor);

  const res = await fetch(url.toString(), {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });

  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
```

---

## Шаг 17. File Attachment Widget

### src/widgets/FileAttachment/FileAttachment.tsx

```typescript
'use client';

import DownloadIcon from '@mui/icons-material/Download';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import { Box, IconButton, Typography } from '@mui/material';
import type { Attachment } from '../../entities/Message/types';

interface Props {
  attachment: Attachment;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} Б`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} КБ`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} МБ`;
}

export function FileAttachment({ attachment }: Props) {
  const isImage = attachment.mime_type.startsWith('image/');

  if (isImage) {
    return (
      <Box
        component="a"
        href={attachment.file_url}
        target="_blank"
        rel="noopener noreferrer"
        sx={{ display: 'block', borderRadius: 1, overflow: 'hidden', maxWidth: 300 }}
      >
        <img
          src={attachment.thumbnail_url || attachment.file_url}
          alt={attachment.file_name}
          style={{ width: '100%', height: 'auto', display: 'block' }}
        />
      </Box>
    );
  }

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        p: 1,
        borderRadius: 1,
        bgcolor: 'action.hover',
      }}
    >
      <InsertDriveFileIcon color="action" />
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography variant="body2" noWrap>{attachment.file_name}</Typography>
        <Typography variant="caption" color="text.secondary">{formatFileSize(attachment.file_size)}</Typography>
      </Box>
      <IconButton component="a" href={attachment.file_url} download size="small">
        <DownloadIcon fontSize="small" />
      </IconButton>
    </Box>
  );
}
```

---

## Шаг 18. Middleware и Auth

### middleware.ts (корень сервиса, рядом с next.config.ts)

```typescript
export { proxy as middleware } from "./proxy";

export const config = {
  matcher: ["/((?!api|web-messages-ssr/_next|favicon.ico).*)"],
};
```

### proxy.ts

```typescript
import { createRouteAuthMiddleware } from "@supreme-int/nextjs-shared/src/shared/middleware/createRouteAuthMiddleware";
import { authRoutes } from "./_auth-routes.generated";

export const proxy = createRouteAuthMiddleware({ routes: authRoutes });
```

### router.yaml

Сгенерируется через `pnpm run generate:router`. Вручную установи:

- Все `/messages/**` → `auth_level: valid`
- `/web-messages-ssr/.*` → `auth_level: none`

---

## Шаг 19. service.yaml (Helm)

```yaml
image:
  repository: web-messages-ssr

nameOverride: "web-messages-ssr"
fullnameOverride: "web-messages-ssr"

service:
  type: ClusterIP
  port: 80
  targetPort: 3007

metrics:
  enabled: true
  port: 9464

env:
  PORT: "3007"
  NODE_ENV: "production"
  CORE_MESSAGES_URL: "http://core-messages.default.svc.cluster.local/core-messages"
  CORE_CLIENT_INFO_URL: "http://core-client-info.default.svc.cluster.local/core-client-info"
  CORE_AUTH_URL: "http://core-auth.default.svc.cluster.local/core-auth"

resources:
  limits:
    cpu: 600m
    memory: 512Mi
  requests:
    cpu: 180m
    memory: 300Mi

autoscaling:
  enabled: true
  minReplicas: 1
  maxReplicas: 2
  targetCPUUtilizationPercentage: 60
  targetMemoryUtilizationPercentage: 70

overrides:
  production:
    canary:
      enabled: true
```

---

## Шаг 20. package.json — дополнительные зависимости

К стандартным зависимостям генератора ничего дополнительного не нужно — MUI, api-client, authorization-lib, nextjs-shared, design-system, i18n уже включены.

---

## Шаг 21. Instrumentation

Следуй паттерну `services/web-auth-ssr/instrumentation.ts` и `instrumentation.nodejs.ts`.
Замени `serviceName` на `'web-messages-ssr'`.

---

## Порядок реализации

1. **Генерация** — `pnpm generate:service`
2. **Конфигурация** — environment.ts, clients.ts, getUserId.ts, theme.ts
3. **Типы** — entities/Conversation, entities/Message
4. **Утилиты** — formatDate.ts, useWebSocket.ts
5. **Layout** — root layout + MessagesLayout (двухпанельный)
6. **Sidebar** — ConversationListView + ConversationItem
7. **Server actions** — actions.ts (все мутации)
8. **Chat** — ChatView + MessageList + ChatBubble + MessageInput
9. **Страницы** — empty state, new, broadcast, broadcast/new, search, [conversationId]
10. **Widgets** — ReplyInDmButton, FileAttachment, SearchView
11. **API routes** — /api/messages/history (proxy для infinite scroll)
12. **Middleware** — proxy.ts + `pnpm run generate:router`
13. **Стили** — CSS modules, responsive
14. **Helm** — service.yaml

> **Критическое**: все названия функций API-клиента (`CoreMessages.xxxYyyGet`) — заглушки. После `pnpm gen:api-client` нужно обновить их на реальные сгенерированные имена.
