import { useEffect, useState, useRef } from 'react';
import io from 'socket.io-client';

export const useSocket = (namespace = '/') => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef(null);

  useEffect(() => {
    const socketUrl = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';
    
    const newSocket = io(`${socketUrl}${namespace}`, {
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5
    });

    newSocket.on('connect', () => {
      setIsConnected(true);
      console.log(`Connected to ${namespace} namespace`);
    });

    newSocket.on('disconnect', () => {
      setIsConnected(false);
      console.log(`Disconnected from ${namespace} namespace`);
    });

    newSocket.on('error', (error) => {
      console.error(`Socket error on ${namespace}:`, error);
    });

    socketRef.current = newSocket;
    setSocket(newSocket);

    return () => {
      if (newSocket) {
        newSocket.disconnect();
      }
    };
  }, [namespace]);

  return { socket, isConnected };
};
