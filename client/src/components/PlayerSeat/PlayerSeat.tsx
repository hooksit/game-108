import React from 'react';
import { PlayerPublic } from '@game-108/shared';

interface PlayerSeatProps {
  player: PlayerPublic;
  isCurrentTurn: boolean;
  isLocalUser: boolean;
  positionClass: string;
}

export const PlayerSeat: React.FC<PlayerSeatProps> = ({
  player,
  isCurrentTurn,
  isLocalUser,
  positionClass
}) => {
  const avatarPath = `/assets/avatars/${player.avatar || 'player'}.png`;

  // Render fan of face-down cards for opponents
  const renderCardFan = () => {
    if (isLocalUser || player.cardCount === 0 || player.isEliminated) return null;
    const count = Math.min(player.cardCount, 8); // Display up to 8 visual cards in fan
    const cards = Array.from({ length: count });

    return (
      <div className="absolute -top-10 left-1/2 -translate-x-1/2 flex items-center justify-center pointer-events-none w-32 h-14">
        {cards.map((_, i) => {
          const total = cards.length;
          const angle = (i - (total - 1) / 2) * 9;
          const offsetX = (i - (total - 1) / 2) * 8;
          return (
            <div
              key={i}
              className="absolute w-8 h-12 rounded shadow-md overflow-hidden transition-transform duration-300"
              style={{
                transform: `translateX(${offsetX}px) rotate(${angle}deg)`,
                zIndex: i
              }}
            >
              <img
                src="/assets/cards/BACK.png"
                alt="card back"
                className="w-full h-full object-cover"
                draggable={false}
              />
            </div>
          );
        })}
        {/* Card Count Bubble */}
        <div className="absolute -right-3 -top-1 w-6 h-6 rounded-full bg-[#1b1714] border border-amber-400 text-amber-200 text-xs font-bold flex items-center justify-center shadow-lg z-20">
          {player.cardCount}
        </div>
      </div>
    );
  };

  return (
    <div className={`absolute flex flex-col items-center ${positionClass} transition-all duration-300`}>
      {/* Cards behind opponent */}
      {renderCardFan()}

      {/* Avatar Container */}
      <div className="relative group">
        <div
          className={`
            w-14 h-14 sm:w-16 sm:h-16 rounded-full overflow-hidden transition-all duration-300
            ${isCurrentTurn ? 'gold-active-ring scale-105' : 'shadow-xl'}
            ${player.isEliminated ? 'filter grayscale brightness-50' : ''}
          `}
        >
          <img
            src={avatarPath}
            alt={player.nickname}
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).src = '/assets/avatars/player.png';
            }}
          />
        </div>

        {/* Local user "Вы" badge tag */}
        {isLocalUser && (
          <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 px-2 py-0.2 rounded-full bg-amber-500 text-black text-[9px] font-black uppercase tracking-wider shadow">
            Вы
          </div>
        )}
      </div>

      {/* Name and Score Badge */}
      <div className="mt-1 flex flex-col items-center px-3 py-0.5 rounded-xl bg-black/75 border border-white/10 backdrop-blur-md shadow-lg min-w-[70px]">
        <span className="text-[11px] font-semibold text-white/95 truncate max-w-[85px] leading-tight">
          {player.nickname}
        </span>
        <span className={`text-xs font-bold ${player.score < 0 ? 'text-emerald-400' : 'text-amber-300'} leading-none mt-0.5`}>
          {player.isEliminated ? 'ВЫБЫЛ' : player.score}
        </span>
      </div>
    </div>
  );
};
