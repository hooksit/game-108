import { GameSession } from '../engine/GameSession';

export class RoomManager {
  private static instance: RoomManager;
  private rooms: Map<string, GameSession> = new Map();
  private playerRoomMap: Map<string, string> = new Map(); // socketId/playerId -> roomId

  private constructor() {}

  public static getInstance(): RoomManager {
    if (!RoomManager.instance) {
      RoomManager.instance = new RoomManager();
    }
    return RoomManager.instance;
  }

  public createRoom(playerId: string, nickname: string, avatar: string = 'player'): { roomId: string; session: GameSession } {
    // Generate clean 4-character room code
    let roomId = this.generateRoomId();
    while (this.rooms.has(roomId)) {
      roomId = this.generateRoomId();
    }

    const session = new GameSession(roomId);
    session.addPlayer(playerId, nickname, avatar);

    this.rooms.set(roomId, session);
    this.playerRoomMap.set(playerId, roomId);

    return { roomId, session };
  }

  public joinRoom(roomId: string, playerId: string, nickname: string, avatar: string = 'player'): { success: boolean; session?: GameSession; error?: string } {
    const cleanRoomId = roomId.trim().toUpperCase();
    const session = this.rooms.get(cleanRoomId);

    if (!session) {
      return { success: false, error: 'Комната с таким кодом не найдена' };
    }

    if (session.phase !== 'LOBBY') {
      // Check if this player is re-connecting
      const existing = session.players.find(p => p.id === playerId);
      if (existing) {
        existing.isConnected = true;
        this.playerRoomMap.set(playerId, cleanRoomId);
        return { success: true, session };
      }
      return { success: false, error: 'Игра в этой комнате уже началась' };
    }

    const added = session.addPlayer(playerId, nickname, avatar);
    if (!added) {
      return { success: false, error: 'Не удалось присоединиться (комната заполнена или игрок уже в ней)' };
    }

    this.playerRoomMap.set(playerId, cleanRoomId);
    return { success: true, session };
  }

  public leaveRoom(playerId: string): { roomId?: string; session?: GameSession } {
    const roomId = this.playerRoomMap.get(playerId);
    if (!roomId) return {};

    const session = this.rooms.get(roomId);
    this.playerRoomMap.delete(playerId);

    if (session) {
      session.removePlayer(playerId);
      // If room is empty, clean it up
      if (session.players.every(p => !p.isConnected)) {
        this.rooms.delete(roomId);
      }
      return { roomId, session };
    }

    return {};
  }

  public getSession(roomId: string): GameSession | undefined {
    return this.rooms.get(roomId.toUpperCase());
  }

  public getSessionByPlayerId(playerId: string): GameSession | undefined {
    const roomId = this.playerRoomMap.get(playerId);
    return roomId ? this.rooms.get(roomId) : undefined;
  }

  private generateRoomId(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 4; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }
}
