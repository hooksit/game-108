import React from 'react';
import { Suit, SUIT_NAMES, SUIT_SYMBOLS } from '@game-108/shared';

interface QueenModalProps {
  isOpen: boolean;
  onSelectSuit: (suit: Suit) => void;
}

export const QueenModal: React.FC<QueenModalProps> = ({ isOpen, onSelectSuit }) => {
  if (!isOpen) return null;

  const suits: Suit[] = ['HEARTS', 'DIAMONDS', 'CLUBS', 'SPADES'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="w-full max-w-sm p-6 rounded-3xl bg-[#1c1511] border border-amber-500/50 shadow-2xl flex flex-col items-center text-white text-center animate-scale-in">
        <h3 className="text-xl font-bold text-amber-200 tracking-wide mb-1">
          Вы сыграли Даму!
        </h3>
        <p className="text-xs text-white/70 mb-5">
          Выберите масть, которой должен продолжить следующий игрок:
        </p>

        <div className="grid grid-cols-2 gap-3 w-full">
          {suits.map((suit) => {
            const isRed = suit === 'HEARTS' || suit === 'DIAMONDS';
            return (
              <button
                key={suit}
                onClick={() => onSelectSuit(suit)}
                className="flex flex-col items-center justify-center p-4 rounded-2xl bg-black/50 border border-white/10 hover:border-amber-400 active:scale-95 transition-all shadow-md group"
              >
                <span className={`text-4xl mb-1 drop-shadow ${isRed ? 'text-rose-500' : 'text-slate-100'} group-hover:scale-110 transition-transform`}>
                  {SUIT_SYMBOLS[suit]}
                </span>
                <span className="text-xs font-semibold text-white/90">
                  {SUIT_NAMES[suit]}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
