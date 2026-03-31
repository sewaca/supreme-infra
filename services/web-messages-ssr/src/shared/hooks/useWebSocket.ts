'use client';

import { useCallback, useEffect, useRef } from 'react';

export type WsClientEvent = { type: string; data: Record<string, unknown> };

interface UseWebSocketProps {
  /** Достаточно для подключения: JWT на handshake уходит из cookie auth_token (same-origin). */
  userId: string | null;
  token: string | null;
  onMessage: (event: WsClientEvent) => void;
}

export function useWebSocket({ userId, token: _token, onMessage }: UseWebSocketProps) {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const onMessageRef = useRef(onMessage);
  onMessageRef.current = onMessage;

  const connect = useCallback(() => {
    if (!userId) return;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    // Браузер не позволяет передать Authorization на WebSocket-handshake; тот же JWT уходит в cookie auth_token (same-origin).
    const wsUrl = `${protocol}//${window.location.host}/core-messages/ws`;

    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log('[ws] connected');
    };

    ws.onmessage = (event) => {
      try {
        const raw: unknown = JSON.parse(event.data);
        if (typeof raw !== 'object' || raw === null || !('type' in raw) || !('data' in raw)) {
          return;
        }
        const data = raw as WsClientEvent;
        onMessageRef.current(data);
        window.dispatchEvent(new CustomEvent('ws-message', { detail: data }));
      } catch {
        console.error('[ws] failed to parse message');
      }
    };

    ws.onclose = (event) => {
      console.log('[ws] disconnected:', event.code, event.reason);
      wsRef.current = null;
      if (event.code !== 4001) {
        reconnectTimeoutRef.current = setTimeout(connect, 3000);
      }
    };

    ws.onerror = () => {
      console.error('[ws] error');
      ws.close();
    };

    wsRef.current = ws;
  }, [userId]);

  useEffect(() => {
    connect();

    return () => {
      clearTimeout(reconnectTimeoutRef.current);
      if (wsRef.current) {
        wsRef.current.close(1000, 'component unmount');
        wsRef.current = null;
      }
    };
  }, [connect]);

  const sendTyping = useCallback((conversationId: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: 'typing',
          data: { conversation_id: conversationId },
        }),
      );
    }
  }, []);

  return { sendTyping };
}
