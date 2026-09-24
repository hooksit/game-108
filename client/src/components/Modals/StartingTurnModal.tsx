import React, { useEffect } from 'react';
import { StartingTurnInfo } from '@game-108/shared';
import { Dices, Play } from 'lucide-react';
import { CardView } from '../Card/CardView';

interface StartingTurnModalProps {
  startingInfo?: StartingTurnInfo | null;
  onClose: () => void;
}

export const StartingTurnModal: React.FC<StartingTurnModalProps> = ({
  startingInfo,
  onClose
}) => {
  useEffect(() => {
    if (!startingInfo) return;
    const timer = setTimeout(() => {
      onClose();
    }, 4500);
    return () => clearTimeout(timer);
  }, [startingInfo, onClose]);

  if (!startingInfo) return null;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in select-none cursor-pointer"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm p-6 rounded-3xl bg-[#1c1511] border border-amber-500/50 shadow-2xl flex flex-col items-center text-center text-white cursor-default"
      >
        {/* Header Icon */}
        <div className="w-12 h-12 rounded-full bg-amber-500/20 border border-amber-400 flex items-center justify-center text-amber-300 mb-2 shadow-[0_0_15px_rgba(216,175,92,0.4)]">
          <Dices className="w-6 h-6" />
        </div>

        <h3 className="text-xl font-extrabold text-amber-200 tracking-wide">
          {startingInfo.isFirstRound ? 'Жеребьёвка первого хода' : 'Начало раунда'}
        </h3>

        {/* Selected Starter Player */}
        <div className="flex flex-col items-center my-3">
          <div className="relative mb-1">
            <img
              src={`/assets/avatars/${startingInfo.starterAvatar || 'player'}.png`}
              alt={startingInfo.starterNickname}
              className="w-14 h-14 rounded-full border-2 border-amber-400 object-cover shadow-lg"
            />
            <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-400 border-2 border-black" />
          </div>
          <span className="text-xs text-amber-200/70">Первым ходит:</span>
          <span className="text-base font-black text-amber-300">
            {startingInfo.starterNickname}
          </span>
        </div>

        {/* Starting Card */}
        <div className="my-2 flex flex-col items-center">
          <CardView card={startingInfo.startingCard} size="md" />
          <span className="text-[10px] text-amber-200/60 mt-1 uppercase tracking-wider">
            Стартовая карта на столе
          </span>
        </div>

        {/* Starting Rule Effect Description */}
        <div className="w-full mt-2 p-2.5 rounded-2xl bg-black/50 border border-amber-500/30 text-xs text-amber-200/90 font-medium">
          {startingInfo.effectText}
        </div>

        {/* Dismiss Button */}
        <button
          onClick={onClose}
          className="w-full mt-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 text-black font-extrabold text-xs tracking-wider uppercase flex items-center justify-center gap-1.5 shadow-lg hover:brightness-110 active:scale-98 transition-all"
        >
          <Play className="w-4 h-4 fill-current" />
          К игре
        </button>
      </div>
    </div>
  );
};
