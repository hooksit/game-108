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
      <div className="absolute -top-7 left-1/2 -translate-x-1/2 flex items-center justify-center pointer-events-none w-24 h-10">
        {cards.map((_, i) => {
          const total = cards.length;
          const angle = (i - (total - 1) / 2) * 8;
          const offsetX = (i - (total - 1) / 2) * 5;
          return (
            <div
              key={i}
              className="absolute w-5 h-7 sm:w-6 sm:h-8 rounded shadow overflow-hidden transition-transform duration-300"
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
        <div className="absolute -right-2 -top-1 w-5 h-5 rounded-full bg-[#1b1714] border border-amber-400 text-amber-200 text-[10px] font-bold flex items-center justify-center shadow-lg z-20">
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
            w-11 h-11 sm:w-12 sm:h-12 rounded-full overflow-hidden transition-all duration-300
            ${isCurrentTurn ? 'gold-active-ring scale-105' : 'shadow-lg border-2 border-amber-500/30'}
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
          <div className="absolute -top-1 left-1/2 -translate-x-1/2 px-2 py-0.2 rounded-full bg-amber-500 text-black text-[9px] font-black uppercase tracking-wider shadow">
            Вы
          </div>
        )}
      </div>

      {/* Name and Score Badge */}
      <div className="mt-0.5 flex flex-col items-center px-2 py-0.5 rounded-lg bg-black/80 border border-white/15 backdrop-blur-md shadow-md min-w-[56px] max-w-[76px]">
        <span className="text-[10px] font-semibold text-white/95 truncate max-w-[68px] leading-tight">
          {player.nickname}
        </span>
        <span className={`text-[10px] font-bold ${player.score < 0 ? 'text-emerald-400' : 'text-amber-300'} leading-none mt-0.5`}>
          {player.isEliminated ? 'ВЫБЫЛ' : `${player.score} оч.`}
        </span>
      </div>
    </div>
  );
};
