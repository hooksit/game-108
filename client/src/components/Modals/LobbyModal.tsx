import React, { useState } from 'react';
import { PlayerPublic, LobbyInfo } from '@game-108/shared';
import { Users, Play, Crown, MessageSquare } from 'lucide-react';

interface LobbyModalProps {
  roomId?: string;
  players: PlayerPublic[];
  isHost: boolean;
  myPlayerId: string;
  lobbyInfo?: LobbyInfo | null;
  unreadChatCount?: number;
  onOpenChat?: () => void;
  onQuickJoin: (nickname: string, avatar: string) => void;
  onStartGame: () => void;
}

const AVATARS = ['player', 'adam', 'ramil', 'kamil', 'zara', 'murad'];

export const LobbyModal: React.FC<LobbyModalProps> = ({
  roomId,
  players,
  isHost,
  myPlayerId,
  lobbyInfo,
  unreadChatCount = 0,
  onOpenChat,
  onQuickJoin,
  onStartGame
}) => {
  const [nickname, setNickname] = useState(() => localStorage.getItem('player_nick') || 'Игрок');
  const [selectedAvatar, setSelectedAvatar] = useState(() => localStorage.getItem('player_avatar') || 'player');

  const saveProfile = (nick: string, av: string) => {
    setNickname(nick);
    localStorage.setItem('player_nick', nick);
    setSelectedAvatar(av);
    localStorage.setItem('player_avatar', av);
  };

  const handleJoin = () => {
    if (!nickname.trim()) return;
    saveProfile(nickname.trim(), selectedAvatar);
    onQuickJoin(nickname.trim(), selectedAvatar);
  };

  // If already joined a lobby, display waiting room
  if (roomId) {
    const hostPlayer = players.find(p => p.isHost);
    const canStart = players.length >= 2;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md select-none">
        <div className="w-full max-w-md p-6 sm:p-7 rounded-3xl bg-[#1c1511] border border-amber-500/40 shadow-2xl flex flex-col items-center text-white">
          <div className="w-12 h-1 bg-amber-500/40 rounded-full mb-3" />
          
          <div className="flex items-center justify-between w-full mb-1 px-1">
            <div className="w-8" />
            <h2 className="text-2xl font-extrabold text-amber-200 tracking-wide text-center">
              Лобби игры
            </h2>
            {onOpenChat ? (
              <button
                onClick={onOpenChat}
                className="relative p-2 rounded-xl bg-black/60 border border-amber-500/30 text-amber-200 hover:bg-black/80 hover:border-amber-400 transition-all shadow active:scale-95"
                title="Чат лобби"
              >
                <MessageSquare className="w-4 h-4 text-amber-300" />
                {unreadChatCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 flex items-center justify-center w-4 h-4 rounded-full bg-rose-600 text-white text-[9px] font-black shadow">
                    {unreadChatCount}
                  </span>
                )}
              </button>
            ) : <div className="w-8" />}
          </div>
          <p className="text-xs text-amber-200/60 mb-5">
            {canStart ? 'Все готово к началу партии' : 'Ожидаем подключения участников...'}
          </p>

          {/* Players List Card */}
          <div className="w-full mb-6">
            <div className="flex justify-between items-center text-xs text-amber-200/80 mb-2.5 px-1 font-medium">
              <span>Подключились ({players.length}/6):</span>
              <span className={canStart ? 'text-emerald-400 font-semibold' : 'text-amber-300'}>
                {canStart ? '✓ Готовы к старту' : 'Нужно от 2 игроков'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              {players.map((p) => {
                const isMe = p.id === myPlayerId;
                return (
                  <div
                    key={p.id}
                    className={`flex items-center gap-2.5 p-2.5 rounded-2xl bg-black/50 border transition-all ${
                      isMe ? 'border-amber-400/60 shadow-[0_0_10px_rgba(216,175,92,0.2)]' : 'border-white/10'
                    }`}
                  >
                    <div className="relative shrink-0">
                      <img
                        src={`/assets/avatars/${p.avatar || 'player'}.png`}
                        alt={p.nickname}
                        className="w-10 h-10 rounded-full border border-amber-400/40 object-cover"
                      />
                      {/* Online dot */}
                      <div className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-400 border border-black" />
                    </div>

                    <div className="flex flex-col min-w-0">
                      <div className="flex items-center gap-1">
                        <span className="text-xs font-semibold truncate text-white">
                          {p.nickname}
                        </span>
                        {p.isHost && (
                          <span title="Создатель игры">
                            <Crown className="w-3 h-3 text-amber-400 shrink-0" />
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-amber-400/80">
                        {isMe ? 'Вы (Готов)' : p.isHost ? 'Создатель' : 'Готов к игре'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Host Start Button or Waiting Info */}
          {isHost ? (
            <button
              onClick={onStartGame}
              disabled={!canStart}
              className={`
                w-full py-4 rounded-2xl font-extrabold text-base flex items-center justify-center gap-2 transition-all shadow-xl
                ${canStart
                  ? 'bg-gradient-to-r from-amber-600 to-amber-500 text-black hover:brightness-110 active:scale-98 shadow-[0_0_20px_rgba(216,175,92,0.4)] cursor-pointer'
                  : 'bg-white/10 text-white/30 cursor-not-allowed border border-white/5'
                }
              `}
            >
              <Play className="w-5 h-5 fill-current" />
              {canStart ? 'Начать игру' : 'Ожидание игроков (нужно от 2)...'}
            </button>
          ) : (
            <div className="flex flex-col items-center gap-1.5 py-2 text-center w-full">
              <div className="flex items-center gap-2 text-sm text-amber-200/90 font-medium animate-pulse">
                <Users className="w-4 h-4 text-amber-400" />
                Ожидание запуска игры создателем...
              </div>
              <span className="text-xs text-white/40">
                Запускает: {hostPlayer?.nickname || 'Создатель'}
              </span>
            </div>
          )}

          {/* Lobby Chat Button */}
          {onOpenChat && (
            <button
              onClick={onOpenChat}
              className="w-full mt-3 py-2.5 px-3 rounded-2xl bg-black/40 border border-white/10 hover:border-amber-400/50 text-amber-200 text-xs font-semibold flex items-center justify-center gap-2 transition-all active:scale-98 shadow"
            >
              <MessageSquare className="w-3.5 h-3.5 text-amber-300" />
              <span>Чат комнаты {unreadChatCount > 0 ? `(${unreadChatCount})` : ''}</span>
            </button>
          )}
        </div>
      </div>
    );
  }

  // Initial Join Screen
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md select-none">
      <div className="w-full max-w-md p-6 sm:p-8 rounded-3xl bg-[#1d1611] border border-amber-500/40 shadow-2xl flex flex-col items-center text-white">
        {/* Brand header with Chat Button */}
        <div className="flex items-center justify-between w-full mb-4 px-1">
          <div className="w-9" />
          <div className="text-center">
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-wider text-amber-300 drop-shadow-md">
              108
            </h1>
            <p className="text-[11px] uppercase tracking-widest text-amber-200/70 mt-0.5">
              Карточная игра
            </p>
          </div>
          {onOpenChat ? (
            <button
              type="button"
              onClick={onOpenChat}
              className="relative p-2.5 rounded-2xl bg-black/60 border border-amber-500/30 text-amber-200 hover:bg-black/80 hover:border-amber-400 transition-all shadow active:scale-95 cursor-pointer"
              title="Чат игры"
            >
              <MessageSquare className="w-4 h-4 text-amber-300" />
              {unreadChatCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 flex items-center justify-center w-4 h-4 rounded-full bg-rose-600 text-white text-[9px] font-black shadow">
                  {unreadChatCount}
                </span>
              )}
            </button>
          ) : <div className="w-9" />}
        </div>

        {/* Live Lobby Active Game Notice */}
        {lobbyInfo && lobbyInfo.players.length > 0 && (
          <div className="w-full mb-5 p-3.5 rounded-2xl bg-black/50 border border-amber-500/40 shadow-inner flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-amber-200">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>
                  <strong className="text-amber-300 font-bold">{lobbyInfo.hostNickname}</strong> {lobbyInfo.phase === 'PLAYING' ? 'играет партию' : 'создал игру'}
                </span>
              </div>
              <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-semibold border border-amber-500/30">
                {lobbyInfo.phase === 'PLAYING' ? 'Идёт партия' : `${lobbyInfo.playerCount}/6 игроков`}
              </span>
            </div>

            <div className="flex items-center gap-2 pt-2 border-t border-white/10">
              <span className="text-[11px] text-white/60 shrink-0">В сети:</span>
              <div className="flex items-center gap-1.5 overflow-x-auto py-0.5 scrollbar-thin">
                {lobbyInfo.players.map((p, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-1.5 px-2 py-1 rounded-xl bg-black/40 border border-white/10 shrink-0"
                  >
                    <div className="relative">
                      <img
                        src={`/assets/avatars/${p.avatar || 'player'}.png`}
                        alt={p.nickname}
                        className="w-5 h-5 rounded-full object-cover border border-amber-400/40"
                      />
                      <span className="absolute bottom-0 right-0 w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    </div>
                    <span className="text-xs text-white/90 truncate max-w-[85px]">
                      {p.nickname}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Nickname Input */}
        <div className="w-full mb-5">
          <label className="block text-xs font-semibold text-amber-200/80 mb-1.5 px-1">
            Ваше имя в игре:
          </label>
          <input
            type="text"
            value={nickname}
            maxLength={16}
            onChange={(e) => {
              setNickname(e.target.value);
              localStorage.setItem('player_nick', e.target.value);
            }}
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
                type="button"
                onClick={() => {
                  setSelectedAvatar(av);
                  localStorage.setItem('player_avatar', av);
                }}
                className={`
                  relative rounded-full overflow-hidden transition-all duration-200 aspect-square cursor-pointer
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

        {/* Join / Spectate Button */}
        <div className="w-full">
          <button
            onClick={handleJoin}
            disabled={!nickname.trim()}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-600 to-amber-500 text-black font-extrabold text-base flex items-center justify-center gap-2 shadow-xl hover:brightness-110 active:scale-98 transition-all disabled:opacity-50 cursor-pointer"
          >
            <Play className="w-5 h-5 fill-current" />
            {lobbyInfo?.phase === 'PLAYING' ? 'Смотреть игру (Наблюдатель)' : 'Присоединиться к игре'}
          </button>

          {/* Lobby Entrance Chat Button */}
          {onOpenChat && (
            <button
              type="button"
              onClick={onOpenChat}
              className="w-full mt-2.5 py-2.5 px-3 rounded-2xl bg-black/40 border border-white/10 hover:border-amber-400/50 text-amber-200 text-xs font-semibold flex items-center justify-center gap-2 transition-all active:scale-98 shadow cursor-pointer"
            >
              <MessageSquare className="w-3.5 h-3.5 text-amber-300" />
              <span>Чат игры {unreadChatCount > 0 ? `(${unreadChatCount})` : ''}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
