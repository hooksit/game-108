import React from 'react';
import { Card, Suit, SUIT_NAMES, SUIT_SYMBOLS } from '@game-108/shared';
import { CardView } from '../Card/CardView';

interface QueenModalProps {
  isOpen: boolean;
  hand?: Card[];
  onSelectSuit: (suit: Suit) => void;
}

export const QueenModal: React.FC<QueenModalProps> = ({ isOpen, hand = [], onSelectSuit }) => {
  if (!isOpen) return null;

  const suits: Suit[] = ['HEARTS', 'DIAMONDS', 'CLUBS', 'SPADES'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md">
      <div className="w-full max-w-lg p-5 sm:p-6 rounded-3xl bg-[#1c1511] border border-amber-500/50 shadow-2xl flex flex-col items-center text-white text-center animate-scale-in">
        <h3 className="text-lg sm:text-xl font-bold text-amber-200 tracking-wide mb-1">
          Вы сыграли Даму!
        </h3>
        <p className="text-xs text-white/70 mb-3 sm:mb-4">
          Выберите масть, которой должен продолжить следующий игрок:
        </p>

        {/* 4 Suit selection buttons in a single row to save vertical space */}
        <div className="grid grid-cols-4 gap-2 sm:gap-2.5 w-full mb-4">
          {suits.map((suit) => {
            const isRed = suit === 'HEARTS' || suit === 'DIAMONDS';
            return (
              <button
                key={suit}
                onClick={() => onSelectSuit(suit)}
                className="flex flex-col items-center justify-center py-2.5 sm:py-3 px-1 rounded-2xl bg-black/50 border border-white/10 hover:border-amber-400 hover:bg-black/70 active:scale-95 transition-all shadow-md group cursor-pointer"
              >
                <span className={`text-2xl sm:text-3xl mb-0.5 drop-shadow ${isRed ? 'text-rose-500' : 'text-slate-100'} group-hover:scale-110 transition-transform`}>
                  {SUIT_SYMBOLS[suit]}
                </span>
                <span className="text-[11px] sm:text-xs font-semibold text-white/90">
                  {SUIT_NAMES[suit]}
                </span>
              </button>
            );
          })}
        </div>

        {/* Player's remaining cards to strategize (expanded view, no scroll) */}
        {hand.length > 0 && (
          <div className="w-full pt-3 border-t border-white/10 flex flex-col items-center">
            <span className="text-xs font-semibold text-amber-200/80 mb-2">
              Ваши оставшиеся карты ({hand.length}):
            </span>
            <div className="w-full p-2.5 sm:p-3 rounded-2xl bg-black/40 border border-white/10">
              <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-2.5 w-full max-h-[50vh] overflow-y-auto">
                {hand.map((card) => (
                  <div key={card.id} className="pointer-events-none drop-shadow-md">
                    <CardView card={card} size="sm" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
