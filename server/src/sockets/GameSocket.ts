import { Server, Socket } from 'socket.io';
import {
  ClientToServerEvents,
  ServerToClientEvents,
  Suit
} from '@game-108/shared';
import { RoomManager } from './RoomManager';
import { GameSession } from '../engine/GameSession';

export function registerSocketHandlers(
  io: Server<ClientToServerEvents, ServerToClientEvents>,
  socket: Socket<ClientToServerEvents, ServerToClientEvents>
) {
  const roomManager = RoomManager.getInstance();

  // Helper to broadcast individual sanitized view to each connected player in a room
  function broadcastSessionState(session: GameSession) {
    for (const player of session.players) {
      if (player.isConnected) {
        const playerView = session.getPlayerView(player.id);
        io.to(player.id).emit('game:state', playerView);
      }
    }
  }

  // 1. Create Room
  socket.on('room:create', ({ nickname, avatar }, callback) => {
    const cleanNick = (nickname || 'Игрок').trim().slice(0, 16);
    const { roomId, session } = roomManager.createRoom(socket.id, cleanNick, avatar || 'player');

    socket.join(roomId);
    socket.join(socket.id);

    callback({ success: true, roomId });
    broadcastSessionState(session);
  });

  // 2. Join Room
  socket.on('room:join', ({ roomId, nickname, avatar }, callback) => {
    const cleanNick = (nickname || 'Игрок').trim().slice(0, 16);
    const res = roomManager.joinRoom(roomId, socket.id, cleanNick, avatar || 'player');

    if (!res.success || !res.session) {
      callback({ success: false, error: res.error || 'Ошибка подключения' });
      return;
    }

    socket.join(res.session.id);
    socket.join(socket.id);

    callback({ success: true });
    broadcastSessionState(res.session);
  });

  // 3. Start Game
  socket.on('game:start', (callback) => {
    const session = roomManager.getSessionByPlayerId(socket.id);
    if (!session) {
      callback?.({ success: false, error: 'Вы не находитесь в комнате' });
      return;
    }

    const player = session.players.find(p => p.id === socket.id);
    if (!player?.isHost) {
      callback?.({ success: false, error: 'Только создатель комнаты может начать игру' });
      return;
    }

    if (session.players.length < 2) {
      callback?.({ success: false, error: 'Для игры нужно минимум 2 игрока' });
      return;
    }

    const started = session.startMatch();
    if (!started) {
      callback?.({ success: false, error: 'Не удалось запустить игру' });
      return;
    }

    callback?.({ success: true });
    broadcastSessionState(session);
  });

  // 4. Play Card
  socket.on('card:play', ({ cardId }, callback) => {
    const session = roomManager.getSessionByPlayerId(socket.id);
    if (!session) {
      callback?.({ success: false, error: 'Сессия не найдена' });
      return;
    }

    const res = session.playCard(socket.id, cardId);
    callback?.(res);

    if (res.success) {
      broadcastSessionState(session);
    }
  });

  // 5. Draw Card (normal draw or penalty draw or start 8-draw)
  socket.on('card:draw', (callback) => {
    const session = roomManager.getSessionByPlayerId(socket.id);
    if (!session) {
      callback?.({ success: false, error: 'Сессия не найдена' });
      return;
    }

    const res = session.drawCard(socket.id);
    callback?.(res);

    if (res.success) {
      broadcastSessionState(session);
    }
  });

  // 6. Pass Turn
  socket.on('card:pass', (callback) => {
    const session = roomManager.getSessionByPlayerId(socket.id);
    if (!session) {
      callback?.({ success: false, error: 'Сессия не найдена' });
      return;
    }

    const res = session.passTurn(socket.id);
    callback?.(res);

    if (res.success) {
      broadcastSessionState(session);
    }
  });

  // 7. Select Queen Suit
  socket.on('queen:selectSuit', ({ suit }, callback) => {
    const session = roomManager.getSessionByPlayerId(socket.id);
    if (!session) {
      callback?.({ success: false, error: 'Сессия не найдена' });
      return;
    }

    const res = session.selectQueenSuit(socket.id, suit);
    callback?.(res);

    if (res.success) {
      broadcastSessionState(session);
    }
  });

  // 8. Eight Mechanics: Draw, Stop, Select
  socket.on('eight:draw', (callback) => {
    const session = roomManager.getSessionByPlayerId(socket.id);
    if (!session) {
      callback?.({ success: false, error: 'Сессия не найдена' });
      return;
    }

    const res = session.eightDraw(socket.id);
    callback?.(res);

    if (res.success) {
      broadcastSessionState(session);
    }
  });

  socket.on('eight:stop', (callback) => {
    const session = roomManager.getSessionByPlayerId(socket.id);
    if (!session) {
      callback?.({ success: false, error: 'Сессия не найдена' });
      return;
    }

    const res = session.eightStop(socket.id);
    callback?.(res);

    if (res.success) {
      broadcastSessionState(session);
    }
  });

  socket.on('eight:select', ({ cardId }, callback) => {
    const session = roomManager.getSessionByPlayerId(socket.id);
    if (!session) {
      callback?.({ success: false, error: 'Сессия не найдена' });
      return;
    }

    const res = session.eightSelect(socket.id, cardId);
    callback?.(res);

    if (res.success) {
      broadcastSessionState(session);
    }
  });

  // 9. Next Round
  socket.on('round:next', (callback) => {
    const session = roomManager.getSessionByPlayerId(socket.id);
    if (!session) {
      callback?.({ success: false, error: 'Сессия не найдена' });
      return;
    }

    if (session.phase === 'ROUND_END') {
      session.startNewRound(false);
      callback?.({ success: true });
      broadcastSessionState(session);
    } else {
      callback?.({ success: false, error: 'Раунд еще не окончен' });
    }
  });

  // 10. Chat Message
  socket.on('chat:send', ({ message }) => {
    const session = roomManager.getSessionByPlayerId(socket.id);
    if (!session) return;

    const player = session.players.find(p => p.id === socket.id);
    if (!player) return;

    const cleanMsg = message.trim().slice(0, 100);
    if (!cleanMsg) return;

    io.to(session.id).emit('chat:message', {
      senderId: socket.id,
      nickname: player.nickname,
      message: cleanMsg,
      timestamp: Date.now()
    });
  });

  // 11. Disconnect
  socket.on('disconnect', () => {
    const { session } = roomManager.leaveRoom(socket.id);
    if (session) {
      broadcastSessionState(session);
    }
  });
}
