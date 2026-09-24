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

  // Send current lobby info to newly connected client
  socket.emit('lobby:info', roomManager.getLobbyInfo());

  function broadcastLobbyInfo() {
    io.emit('lobby:info', roomManager.getLobbyInfo());
  }

  // Helper to broadcast individual sanitized view to each connected player and spectator in a room
  function broadcastSessionState(session: GameSession) {
    for (const player of session.players) {
      if (player.isConnected) {
        const playerView = session.getPlayerView(player.id);
        io.to(player.id).emit('game:state', playerView);
      }
    }
    for (const spec of session.spectators) {
      if (spec.isConnected) {
        const specView = session.getPlayerView(spec.id);
        io.to(spec.id).emit('game:state', specView);
      }
    }
    broadcastLobbyInfo();
  }

  // 1. Create Room
  socket.on('room:create', ({ nickname, avatar }, callback) => {
    const cleanNick = (nickname || 'Игрок').trim().slice(0, 16);
    const { roomId, session } = roomManager.createRoom(socket.id, cleanNick, avatar || 'player');

    socket.join(roomId);
    socket.join(socket.id);

    callback({ success: true, roomId });
    socket.emit('chat:history', session.chatMessages);
    broadcastSessionState(session);
  });

  // 2. Quick Join (Common lobby without code)
  socket.on('room:quickJoin', ({ nickname, avatar }, callback) => {
    const cleanNick = (nickname || 'Игрок').trim().slice(0, 16);
    const { roomId, session } = roomManager.quickJoin(socket.id, cleanNick, avatar || 'player');

    socket.join(roomId);
    socket.join(socket.id);

    callback({ success: true, roomId });
    socket.emit('chat:history', session.chatMessages);
    broadcastSessionState(session);
  });

  // 3. Join Room by code (backward compatibility)
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
    socket.emit('chat:history', res.session.chatMessages);
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

  // 10. Propose Restart
  socket.on('game:proposeRestart', (callback) => {
    const session = roomManager.getSessionByPlayerId(socket.id);
    if (!session) {
      callback?.({ success: false, error: 'Вы не в комнате' });
      return;
    }
    const res = session.proposeRestart(socket.id);
    callback?.(res);
    broadcastSessionState(session);
  });

  // 11. Vote Restart
  socket.on('game:voteRestart', (callback) => {
    const session = roomManager.getSessionByPlayerId(socket.id);
    if (!session) {
      callback?.({ success: false, error: 'Вы не в комнате' });
      return;
    }
    const res = session.voteRestart(socket.id);
    callback?.(res);
    broadcastSessionState(session);
  });

  // 12. Chat Message
  socket.on('chat:send', ({ message }) => {
    const session = roomManager.getSessionByPlayerId(socket.id);
    if (!session) return;

    let nick = 'Игрок';
    let avatar = 'player';
    const player = session.players.find(p => p.id === socket.id);
    if (player) {
      nick = player.nickname;
      avatar = player.avatar || 'player';
    } else {
      const spec = session.spectators.find(s => s.id === socket.id);
      if (spec) {
        nick = `${spec.nickname} (зритель)`;
        avatar = spec.avatar || 'player';
      } else {
        return;
      }
    }

    const cleanMsg = message.trim().slice(0, 100);
    if (!cleanMsg) return;

    const chatMsg = {
      id: `${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      senderId: socket.id,
      nickname: nick,
      avatar,
      message: cleanMsg,
      timestamp: Date.now()
    };

    session.addChatMessage(chatMsg);
    io.to(session.id).emit('chat:message', chatMsg);
  });

  // 11. Disconnect
  socket.on('disconnect', () => {
    const existingSession = roomManager.getSessionByPlayerId(socket.id);
    const player = existingSession?.players.find(p => p.id === socket.id);
    const nick = player?.nickname || 'Игрок';
    const isPlaying = existingSession && existingSession.phase !== 'LOBBY';

    const { session } = roomManager.leaveRoom(socket.id);
    if (session) {
      if (isPlaying) {
        io.to(session.id).emit('action:notice', {
          text: `${nick} потерял связь и выбыл`,
          type: 'special'
        });
      }
      broadcastSessionState(session);
    }
  });
}
