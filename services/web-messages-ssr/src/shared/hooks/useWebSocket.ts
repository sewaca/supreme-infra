'use client';

import { useCallback, useEffect, useRef } from 'react';
import { messagesWsDebug } from '../lib/messagesWsDebug';

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
    if (!userId) {
      messagesWsDebug('useWebSocket', 'connect_skipped_no_userId', {});
      return;
    }

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    // Браузер не позволяет передать Authorization на WebSocket-handshake; тот же JWT уходит в cookie auth_token (same-origin).
    const wsUrl = `${protocol}//${window.location.host}/core-messages/ws`;

    messagesWsDebug('useWebSocket', 'connect_start', { userId, url: wsUrl });

    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log('[ws] connected');
      messagesWsDebug('useWebSocket', 'open', { userId, readyState: String(ws.readyState) });
    };

    ws.onmessage = (event) => {
      try {
        const raw: unknown = JSON.parse(event.data);
        if (typeof raw !== 'object' || raw === null || !('type' in raw) || !('data' in raw)) {
          messagesWsDebug('useWebSocket', 'frame_skip_bad_shape', {
            userId,
            preview: typeof event.data === 'string' ? event.data.slice(0, 200) : 'non-string',
          });
          return;
        }
        const data = raw as WsClientEvent;
        const d = data.data;
        const summary: Record<string, string> = { userId, type: data.type };
        if (data.type === 'new_message') {
          if (d.id != null) summary.msgId = String(d.id);
          if (d.conversation_id != null) summary.convId = String(d.conversation_id);
          if (d.sender_id != null) summary.senderId = String(d.sender_id);
        } else if (data.type === 'message_edited' || data.type === 'message_deleted') {
          if (d.conversation_id != null) summary.convId = String(d.conversation_id);
          if (d.message_id != null) summary.messageId = String(d.message_id);
        }
        messagesWsDebug('useWebSocket', 'frame', summary);
        onMessageRef.current(data);
        window.dispatchEvent(new CustomEvent('ws-message', { detail: data }));
      } catch {
        console.error('[ws] failed to parse message');
        messagesWsDebug('useWebSocket', 'parse_error', { userId });
      }
    };

    ws.onclose = (event) => {
      console.log('[ws] disconnected:', event.code, event.reason);
      messagesWsDebug('useWebSocket', 'close', {
        userId,
        code: String(event.code),
        reason: event.reason || '',
        wasClean: String(event.wasClean),
      });
      wsRef.current = null;
      if (event.code !== 4001) {
        messagesWsDebug('useWebSocket', 'reconnect_scheduled_3s', { userId });
        reconnectTimeoutRef.current = setTimeout(connect, 3000);
      }
    };

    ws.onerror = () => {
      console.error('[ws] error');
      messagesWsDebug('useWebSocket', 'error_event', { userId, readyState: String(ws.readyState) });
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
