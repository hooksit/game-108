import React, { useState } from 'react';
import { PlayerPublic } from '@game-108/shared';
import { Users, Play, Copy, Check, LogIn, PlusCircle } from 'lucide-react';

interface LobbyModalProps {
  roomId?: string;
  players: PlayerPublic[];
  isHost: boolean;
  myPlayerId: string;
  onCreateRoom: (nickname: string, avatar: string) => void;
  onJoinRoom: (roomId: string, nickname: string, avatar: string) => void;
  onStartGame: () => void;
}

const AVATARS = ['player', 'adam', 'ramil', 'kamil', 'zara', 'murad'];

export const LobbyModal: React.FC<LobbyModalProps> = ({
  roomId,
  players,
  isHost,
  myPlayerId,
  onCreateRoom,
  onJoinRoom,
  onStartGame
}) => {
  const [nickname, setNickname] = useState(() => localStorage.getItem('player_nick') || 'Игрок');
  const [selectedAvatar, setSelectedAvatar] = useState(() => localStorage.getItem('player_avatar') || 'player');
  const [joinCode, setJoinCode] = useState('');
  const [copied, setCopied] = useState(false);
  const [joinError, setJoinError] = useState('');

  const saveProfile = (nick: string, av: string) => {
    setNickname(nick);
    localStorage.setItem('player_nick', nick);
    setSelectedAvatar(av);
    localStorage.setItem('player_avatar', av);
  };

  const handleCreate = () => {
    if (!nickname.trim()) return;
    saveProfile(nickname.trim(), selectedAvatar);
    onCreateRoom(nickname.trim(), selectedAvatar);
  };

  const handleJoin = () => {
    if (!nickname.trim()) return;
    if (!joinCode.trim()) {
      setJoinError('Введите 4-значный код комнаты');
      return;
    }
    saveProfile(nickname.trim(), selectedAvatar);
    onJoinRoom(joinCode.trim().toUpperCase(), nickname.trim(), selectedAvatar);
  };

  const copyRoomCode = () => {
    if (!roomId) return;
    navigator.clipboard.writeText(roomId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // If already in a room, show room waiting room
  if (roomId) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
        <div className="w-full max-w-md p-6 rounded-3xl bg-[#1c1511] border border-amber-500/40 shadow-2xl flex flex-col items-center text-white">
          <div className="w-12 h-1 bg-amber-500/40 rounded-full mb-4" />
          
          <h2 className="text-xl font-bold text-amber-200 tracking-wide mb-1">
            Комната ожидания
          </h2>
          
          <div className="flex items-center gap-2 px-4 py-2 mt-2 mb-5 rounded-2xl bg-black/60 border border-amber-500/30">
            <span className="text-xs text-white/60">Код комнаты:</span>
            <span className="text-xl font-mono font-bold tracking-widest text-amber-300">{roomId}</span>
            <button
              onClick={copyRoomCode}
              className="ml-2 p-1.5 rounded-lg bg-white/10 hover:bg-white/20 active:scale-95 transition-all text-amber-200"
              title="Скопировать"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>

          <div className="w-full mb-6">
            <div className="flex justify-between items-center text-xs text-amber-200/70 mb-2 px-1">
              <span>Игроки за столом ({players.length}/6):</span>
              <span>{players.length >= 2 ? 'Готовы к игре' : 'Нужно от 2 игроков'}</span>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              {players.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center gap-2.5 p-2 rounded-2xl bg-black/40 border border-white/5 shadow-sm"
                >
                  <img
                    src={`/assets/avatars/${p.avatar || 'player'}.png`}
                    alt={p.nickname}
                    className="w-10 h-10 rounded-full border border-amber-400/40 object-cover"
                  />
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs font-semibold truncate text-white">
                      {p.nickname}
                    </span>
                    <span className="text-[10px] text-amber-400/80">
                      {p.id === myPlayerId ? 'Вы' : p.isHost ? 'Создатель' : 'Игрок'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {isHost ? (
            <button
              onClick={onStartGame}
              disabled={players.length < 2}
              className={`
                w-full py-3.5 rounded-2xl font-bold text-base flex items-center justify-center gap-2 transition-all shadow-xl
                ${players.length >= 2
                  ? 'bg-gradient-to-r from-amber-600 to-amber-500 text-black hover:brightness-110 active:scale-98 shadow-[0_0_20px_rgba(216,175,92,0.4)]'
                  : 'bg-white/10 text-white/30 cursor-not-allowed'
                }
              `}
            >
              <Play className="w-5 h-5 fill-current" />
              Начать игру
            </button>
          ) : (
            <div className="flex items-center gap-2 text-xs text-amber-200/70 animate-pulse py-2">
              <Users className="w-4 h-4" />
              Ожидание запуска игры создателем комнаты...
            </div>
          )}
        </div>
      </div>
    );
  }

  // Initial Welcome / Create / Join Screen
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
      <div className="w-full max-w-md p-6 sm:p-8 rounded-3xl bg-[#1d1611] border border-amber-500/40 shadow-2xl flex flex-col items-center text-white">
        {/* Brand header */}
        <div className="text-center mb-6">
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-wider text-amber-300 drop-shadow-md">
            108
          </h1>
          <p className="text-xs uppercase tracking-widest text-amber-200/70 mt-1">
            Карточная игра
          </p>
        </div>

        {/* Nickname Input */}
        <div className="w-full mb-5">
          <label className="block text-xs font-semibold text-amber-200/80 mb-1.5 px-1">
            Ваше имя в игре:
          </label>
          <input
            type="text"
            value={nickname}
            maxLength={16}
            onChange={(e) => setNickname(e.target.value)}
            placeholder="Введите имя..."
            className="w-full px-4 py-3 rounded-2xl bg-black/50 border border-white/10 text-white font-medium focus:outline-none focus:border-amber-400 transition-colors shadow-inner"
          />
        </div>

        {/* Avatar Selection */}
        <div className="w-full mb-6">
          <label className="block text-xs font-semibold text-amber-200/80 mb-2 px-1">
            Выберите аватар:
          </label>
          <div className="grid grid-cols-6 gap-2">
            {AVATARS.map((av) => (
              <button
                key={av}
                onClick={() => setSelectedAvatar(av)}
                className={`
                  relative rounded-full overflow-hidden transition-all duration-200 aspect-square
                  ${selectedAvatar === av
                    ? 'ring-3 ring-amber-400 scale-105 shadow-[0_0_12px_rgba(216,175,92,0.8)]'
                    : 'opacity-70 hover:opacity-100 hover:scale-102'
                  }
                `}
              >
                <img
                  src={`/assets/avatars/${av}.png`}
                  alt={av}
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="w-full space-y-3">
          <button
            onClick={handleCreate}
            disabled={!nickname.trim()}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-600 to-amber-500 text-black font-bold text-base flex items-center justify-center gap-2 shadow-xl hover:brightness-110 active:scale-98 transition-all disabled:opacity-50"
          >
            <PlusCircle className="w-5 h-5" />
            Создать новую комнату
          </button>

          <div className="relative flex items-center justify-center my-3">
            <div className="border-t border-white/10 w-full" />
            <span className="bg-[#1d1611] px-3 text-[11px] text-white/40 uppercase tracking-widest">
              или
            </span>
            <div className="border-t border-white/10 w-full" />
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={joinCode}
              onChange={(e) => {
                setJoinCode(e.target.value.toUpperCase());
                setJoinError('');
              }}
              maxLength={4}
              placeholder="КОД"
              className="w-28 text-center uppercase tracking-widest font-mono font-bold text-lg px-3 py-3 rounded-2xl bg-black/50 border border-white/10 text-amber-300 focus:outline-none focus:border-amber-400 shadow-inner"
            />
            <button
              onClick={handleJoin}
              disabled={!nickname.trim() || !joinCode.trim()}
              className="flex-1 py-3 rounded-2xl bg-white/10 hover:bg-white/20 active:scale-98 text-amber-200 font-bold flex items-center justify-center gap-2 border border-white/10 transition-all disabled:opacity-50"
            >
              <LogIn className="w-5 h-5" />
              Войти по коду
            </button>
          </div>
          {joinError && (
            <p className="text-xs text-rose-400 text-center mt-1">{joinError}</p>
          )}
        </div>
      </div>
    </div>
  );
};
