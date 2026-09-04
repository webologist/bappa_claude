import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { SOCKET_URL } from '../api/client';

export function useSocket(tenantSlug) {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!tenantSlug) return;

    const instance = io(SOCKET_URL, {
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000
    });

    instance.on('connect', () => {
      setConnected(true);
      instance.emit('join-tenant', tenantSlug);
    });
    instance.on('disconnect', () => setConnected(false));

    setSocket(instance);
    return () => instance.disconnect();
  }, [tenantSlug]);

  return { socket, connected };
}
