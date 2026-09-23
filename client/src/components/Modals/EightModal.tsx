import React from 'react';
import { Card, Suit, SUIT_NAMES, SUIT_SYMBOLS } from '@game-108/shared';
import { CardView } from '../Card/CardView';
import { PlusCircle, Hand } from 'lucide-react';

interface EightModalProps {
  isOpen: boolean;
  phase: 'EIGHT_DRAW' | 'EIGHT_SELECT';
  activeSuit: Suit | null;
  hiddenDrawCards: Card[];
  hand: Card[];
  onDraw: () => void;
  onStop: () => void;
  onSelectCard: (cardId: string) => void;
}

export const EightModal: React.FC<EightModalProps> = ({
  isOpen,
  phase,
  activeSuit,
  hiddenDrawCards,
  hand,
  onDraw,
  onStop,
  onSelectCard
}) => {
  if (!isOpen) return null;

  const isRed = activeSuit === 'HEARTS' || activeSuit === 'DIAMONDS';

  // Cards eligible for play: matches 8's activeSuit, another 8, or any Queen
  const eligibleCards = (phase === 'EIGHT_SELECT' ? hand : hiddenDrawCards).filter(
    (c) => c.suit === activeSuit || c.rank === '8' || c.rank === 'Q'
  );

  const hasEligibleCard =
    hand.some((c) => c.suit === activeSuit || c.rank === '8' || c.rank === 'Q') ||
    hiddenDrawCards.some((c) => c.suit === activeSuit || c.rank === '8' || c.rank === 'Q');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
      <div className="w-full max-w-lg p-6 rounded-3xl bg-[#1d1611] border border-amber-500/50 shadow-2xl flex flex-col items-center text-white text-center">
        {/* Header */}
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xl font-bold text-amber-200">
            Скрытый добор восьмёрки
          </span>
          {activeSuit && (
            <span className={`text-2xl font-bold ${isRed ? 'text-rose-500' : 'text-slate-100'}`}>
              {SUIT_SYMBOLS[activeSuit]}
            </span>
          )}
        </div>

        <p className="text-xs text-white/70 mb-4 max-w-sm">
          {phase === 'EIGHT_DRAW'
            ? `Нужна масть ${activeSuit ? SUIT_NAMES[activeSuit] : ''}, любая 8 или Дама. Тяните карты, пока не попадётся подходящая.`
            : 'Выберите подходящую карту, чтобы перебить восьмёрку.'
          }
        </p>

        {/* Drawn cards tray */}
        <div className="w-full p-4 rounded-2xl bg-black/50 border border-white/10 mb-5 min-h-[140px] flex flex-col items-center justify-center">
          <span className="text-[11px] text-amber-200/60 font-semibold mb-2 block">
            {phase === 'EIGHT_DRAW'
              ? `Накопленные карты (${hiddenDrawCards.length}):`
              : 'Доступные карты для хода:'
            }
          </span>

          <div className="flex flex-wrap items-center justify-center gap-2 max-h-48 overflow-y-auto p-1">
            {phase === 'EIGHT_DRAW' ? (
              hiddenDrawCards.length > 0 ? (
                hiddenDrawCards.map((c) => {
                  const fits = c.suit === activeSuit || c.rank === '8' || c.rank === 'Q';
                  return (
                    <div key={c.id} className="relative">
                      <CardView card={c} size="sm" />
                      {fits && (
                        <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 text-black text-[9px] font-bold flex items-center justify-center">
                          ✓
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                <span className="text-xs text-white/40 italic">
                  Нажмите «Взять карту», чтобы начать добор
                </span>
              )
            ) : (
              eligibleCards.map((c) => (
                <div key={c.id} className="cursor-pointer hover:scale-105 active:scale-95 transition-transform">
                  <CardView
                    card={c}
                    isPlayable
                    onClick={() => onSelectCard(c.id)}
                    size="md"
                  />
                </div>
              ))
            )}
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex gap-3 w-full">
          {phase === 'EIGHT_DRAW' ? (
            <>
              <button
                onClick={onDraw}
                className="flex-1 py-3.5 rounded-2xl bg-gradient-to-r from-amber-600 to-amber-500 text-black font-bold text-sm flex items-center justify-center gap-2 shadow-lg hover:brightness-110 active:scale-95 transition-all"
              >
                <PlusCircle className="w-4 h-4" />
                Взять карту
              </button>

              <button
                onClick={onStop}
                disabled={!hasEligibleCard}
                className={`
                  flex-1 py-3.5 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 border transition-all
                  ${hasEligibleCard
                    ? 'bg-emerald-600/80 hover:bg-emerald-500/90 text-white border-emerald-400/50 shadow-lg active:scale-95'
                    : 'bg-white/5 text-white/30 border-white/5 cursor-not-allowed'
                  }
                `}
                title={hasEligibleCard ? 'Завершить добор и сыграть карту' : 'Тяните карты, пока не попадется подходящая'}
              >
                <Hand className="w-4 h-4" />
                {hasEligibleCard ? 'Выбрать карту' : 'Тяните карту...'}
              </button>
            </>
          ) : (
            <p className="text-xs text-amber-300 font-medium w-full text-center animate-pulse">
              Нажмите на подходящую карту выше, чтобы сыграть её!
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
