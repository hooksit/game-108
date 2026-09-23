import { useEffect, useState, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import {
  ClientToServerEvents,
  ServerToClientEvents,
  GameStateView,
  LobbyInfo,
  Suit
} from '@game-108/shared';

export interface ChatMessage {
  id: string;
  senderId: string;
  nickname: string;
  message: string;
  timestamp: number;
}

export function useGameSocket() {
  const socketRef = useRef<Socket<ServerToClientEvents, ClientToServerEvents> | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [gameState, setGameState] = useState<GameStateView | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ text: string; type?: string } | null>(null);
  const [lobbyInfo, setLobbyInfo] = useState<LobbyInfo | null>(null);

  useEffect(() => {
    // Determine server URL: in prod use same origin, in dev proxy or port 3000
    const serverUrl = window.location.port === '5173' ? 'http://localhost:3000' : '/';
    const socket: Socket<ServerToClientEvents, ClientToServerEvents> = io(serverUrl, {
      transports: ['websocket', 'polling']
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setIsConnected(true);
      console.log('Connected to Game 108 server, socketId:', socket.id);
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
      console.log('Disconnected from Game 108 server');
    });

    socket.on('lobby:info', (info: LobbyInfo | null) => {
      setLobbyInfo(info);
    });

    socket.on('game:state', (state: GameStateView) => {
      setGameState(state);
    });

    socket.on('game:error', ({ message }) => {
      setErrorMessage(message);
      setTimeout(() => setErrorMessage(null), 4000);
    });

    socket.on('chat:message', (msg) => {
      setMessages((prev) => [...prev, { ...msg, id: `${msg.timestamp}_${Math.random()}` }]);
    });

    socket.on('action:notice', (n) => {
      setNotice(n);
      setTimeout(() => setNotice(null), 3500);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const quickJoin = useCallback((nickname: string, avatar: string = 'player'): Promise<{ success: boolean; roomId?: string; error?: string }> => {
    return new Promise((resolve) => {
      if (!socketRef.current) return resolve({ success: false, error: 'Нет связи с сервером' });
      socketRef.current.emit('room:quickJoin', { nickname, avatar }, (res) => {
        resolve(res);
      });
    });
  }, []);

  const createRoom = useCallback((nickname: string, avatar: string = 'player'): Promise<{ success: boolean; roomId?: string; error?: string }> => {
    return new Promise((resolve) => {
      if (!socketRef.current) return resolve({ success: false, error: 'Нет связи с сервером' });
      socketRef.current.emit('room:create', { nickname, avatar }, (res) => {
        resolve(res);
      });
    });
  }, []);

  const joinRoom = useCallback((roomId: string, nickname: string, avatar: string = 'player'): Promise<{ success: boolean; error?: string }> => {
    return new Promise((resolve) => {
      if (!socketRef.current) return resolve({ success: false, error: 'Нет связи с сервером' });
      socketRef.current.emit('room:join', { roomId, nickname, avatar }, (res) => {
        resolve(res);
      });
    });
  }, []);

  const startGame = useCallback((): Promise<{ success: boolean; error?: string }> => {
    return new Promise((resolve) => {
      if (!socketRef.current) return resolve({ success: false, error: 'Нет связи' });
      socketRef.current.emit('game:start', (res) => {
        resolve(res || { success: true });
      });
    });
  }, []);

  const playCard = useCallback((cardId: string): Promise<{ success: boolean; error?: string }> => {
    return new Promise((resolve) => {
      if (!socketRef.current) return resolve({ success: false, error: 'Нет связи' });
      socketRef.current.emit('card:play', { cardId }, (res) => {
        if (res && !res.success) {
          setErrorMessage(res.error || 'Невозможно сделать этот ход');
          setTimeout(() => setErrorMessage(null), 3000);
        }
        resolve(res || { success: true });
      });
    });
  }, []);

  const drawCard = useCallback((): Promise<{ success: boolean; error?: string }> => {
    return new Promise((resolve) => {
      if (!socketRef.current) return resolve({ success: false, error: 'Нет связи' });
      socketRef.current.emit('card:draw', (res) => {
        if (res && !res.success) {
          setErrorMessage(res.error || 'Нельзя взять карту');
          setTimeout(() => setErrorMessage(null), 3000);
        }
        resolve(res || { success: true });
      });
    });
  }, []);

  const passTurn = useCallback((): Promise<{ success: boolean; error?: string }> => {
    return new Promise((resolve) => {
      if (!socketRef.current) return resolve({ success: false, error: 'Нет связи' });
      socketRef.current.emit('card:pass', (res) => {
        if (res && !res.success) {
          setErrorMessage(res.error || 'Нельзя спасовать');
          setTimeout(() => setErrorMessage(null), 3000);
        }
        resolve(res || { success: true });
      });
    });
  }, []);

  const selectQueenSuit = useCallback((suit: Suit): Promise<{ success: boolean; error?: string }> => {
    return new Promise((resolve) => {
      if (!socketRef.current) return resolve({ success: false, error: 'Нет связи' });
      socketRef.current.emit('queen:selectSuit', { suit }, (res) => {
        resolve(res || { success: true });
      });
    });
  }, []);

  const eightDraw = useCallback((): Promise<{ success: boolean; error?: string }> => {
    return new Promise((resolve) => {
      if (!socketRef.current) return resolve({ success: false, error: 'Нет связи' });
      socketRef.current.emit('eight:draw', (res) => {
        resolve(res || { success: true });
      });
    });
  }, []);

  const eightStop = useCallback((): Promise<{ success: boolean; error?: string }> => {
    return new Promise((resolve) => {
      if (!socketRef.current) return resolve({ success: false, error: 'Нет связи' });
      socketRef.current.emit('eight:stop', (res) => {
        resolve(res || { success: true });
      });
    });
  }, []);

  const eightSelect = useCallback((cardId: string): Promise<{ success: boolean; error?: string }> => {
    return new Promise((resolve) => {
      if (!socketRef.current) return resolve({ success: false, error: 'Нет связи' });
      socketRef.current.emit('eight:select', { cardId }, (res) => {
        resolve(res || { success: true });
      });
    });
  }, []);

  const nextRound = useCallback((): Promise<{ success: boolean; error?: string }> => {
    return new Promise((resolve) => {
      if (!socketRef.current) return resolve({ success: false, error: 'Нет связи' });
      socketRef.current.emit('round:next', (res) => {
        resolve(res || { success: true });
      });
    });
  }, []);

  const proposeRestart = useCallback((): Promise<{ success: boolean; error?: string }> => {
    return new Promise((resolve) => {
      if (!socketRef.current) return resolve({ success: false, error: 'Нет связи' });
      socketRef.current.emit('game:proposeRestart', (res) => {
        resolve(res || { success: true });
      });
    });
  }, []);

  const voteRestart = useCallback((): Promise<{ success: boolean; error?: string }> => {
    return new Promise((resolve) => {
      if (!socketRef.current) return resolve({ success: false, error: 'Нет связи' });
      socketRef.current.emit('game:voteRestart', (res) => {
        resolve(res || { success: true });
      });
    });
  }, []);

  const sendMessage = useCallback((message: string) => {
    if (!socketRef.current) return;
    socketRef.current.emit('chat:send', { message });
  }, []);

  return {
    isConnected,
    gameState,
    messages,
    errorMessage,
    notice,
    lobbyInfo,
    quickJoin,
    createRoom,
    joinRoom,
    startGame,
    playCard,
    drawCard,
    passTurn,
    selectQueenSuit,
    eightDraw,
    eightStop,
    eightSelect,
    nextRound,
    proposeRestart,
    voteRestart,
    sendMessage
  };
}
