/**
 * Thin, singleton-per-tab socket hook.
 *
 * Usage:
 *   const { socket, connected } = useSocket();
 *
 * The socket connects to the /messages namespace on the backend.
 * It automatically reconnects and disconnects when the component
 * tree unmounts.
 */
'use client';

import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '@/store/auth.store';

const BACKEND_URL =
  (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_API_URL) ||
  'http://localhost:3001';

export function useSocket() {
  const socketRef = useRef<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const accessToken = useAuthStore((s) => s.accessToken);

  useEffect(() => {
    if (!accessToken) return;

    const socket = io(`${BACKEND_URL}/messages`, {
      transports: ['websocket', 'polling'],
      query: { token: accessToken },
      auth: { token: accessToken },
      autoConnect: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
    });

    socketRef.current = socket;

    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));

    return () => {
      socket.disconnect();
      socketRef.current = null;
      setConnected(false);
    };
  }, [accessToken]);

  return { socket: socketRef.current, connected };
}
