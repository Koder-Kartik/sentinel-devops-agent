"use client";

import { useEffect, useRef, useState, useCallback } from 'react';
import { WS_URL, WebSocketMessage } from '../lib/websocket';

interface UseWebSocketOptions {
  onMessage?: (data: WebSocketMessage) => void;
  reconnectInterval?: number;
  enabled?: boolean;
}

export function useWebSocket({ onMessage, reconnectInterval = 3000, enabled = true }: UseWebSocketOptions = {}) {
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | number | undefined>(undefined);

  const connect = useCallback(() => {
    if (!enabled) return;

    // Close existing connection if any
    if (wsRef.current) {
      wsRef.current.close();
    }

    const ws = new WebSocket(WS_URL);

    ws.onopen = () => {
      setIsConnected(true);
      console.log('🔌 WebSocket connected');
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        setLastMessage(data);
        onMessage?.(data);
      } catch (e) {
        console.error("Failed to parse WebSocket message:", e);
      }
    };

    ws.onclose = () => {
      setIsConnected(false);
      // Reconnect with backoff
      reconnectTimeoutRef.current = setTimeout(() => {
        console.log('🔄 Reconnecting WebSocket...');
        connect();
      }, reconnectInterval);
    };

    ws.onerror = (error) => {
      console.error("WebSocket error:", error);
      ws.close();
    };

    wsRef.current = ws;
  }, [onMessage, reconnectInterval, enabled]);

  useEffect(() => {
    connect();
    return () => {
      wsRef.current?.close();
      clearTimeout(reconnectTimeoutRef.current);
    };
  }, [connect]);

  return { isConnected, lastMessage };
}

