import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './useAuth';

const SocketContext = createContext(null);

export function SocketProvider({ children }) {
  const { currentUser } = useAuth();
  const socketRef = useRef(null);
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    if (!currentUser) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setSocket(null);
      }
      return;
    }

    async function connect() {
      const token = await currentUser.getIdToken(/* forceRefresh */ true);
      const s = io(import.meta.env.VITE_API_URL || 'http://localhost:5000', {
        auth: { token },
        reconnectionAttempts: 5,
      });

      s.on('connect', () => setSocket(s));
      s.on('connect_error', (err) => {
        console.error('Socket connect_error:', err.message);
      });

      socketRef.current = s;
    }

    connect();

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setSocket(null);
      }
    };
  }, [currentUser]);

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  return useContext(SocketContext);
}
