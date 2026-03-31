'use client';

import { useCallback, useEffect, useRef } from 'react';

export type WsClientEvent = { type: string; data: Record<string, unknown> };

interface UseWebSocketProps {
  token: string | null;
  onMessage: (event: WsClientEvent) => void;
}

export function useWebSocket({ token, onMessage }: UseWebSocketProps) {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const onMessageRef = useRef(onMessage);
  onMessageRef.current = onMessage;

  const connect = useCallback(() => {
    if (!token) return;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/core-messages/ws?token=${token}`;

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
  }, [token]);

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
