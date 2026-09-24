import React from 'react';
import { Card, Suit, PenaltyState, SUIT_SYMBOLS, SUIT_NAMES } from '@game-108/shared';
import { CardView } from '../Card/CardView';

interface DiscardZoneProps {
  discardPileTop: Card[];
  topCard: Card | null;
  activeSuit: Suit | null;
  deckCount: number;
  currentTurnNickname: string;
  isMyTurn: boolean;
  penalty: PenaltyState;
  canDrawCard: boolean;
  onDrawCard: () => void;
  isDiscardImpact?: boolean;
  isDeckPress?: boolean;
  hasSelectedCard?: boolean;
  onDiscardPileClick?: () => void;
}

export const DiscardZone: React.FC<DiscardZoneProps> = ({
  discardPileTop,
  topCard,
  activeSuit,
  deckCount,
  currentTurnNickname,
  isMyTurn,
  penalty,
  canDrawCard,
  onDrawCard,
  isDiscardImpact = false,
  isDeckPress = false,
  hasSelectedCard = false,
  onDiscardPileClick
}) => {
  // Positional offsets for cards lying on the table
  const cardOffsets = [
    { x: -16, y: -6, rot: -7 },
    { x: 12, y: -8, rot: 5 },
    { x: -8, y: 10, rot: -3 },
    { x: 0, y: 0, rot: 0 } // Top card
  ];

  return (
    <div className="relative flex flex-col items-center justify-center w-full max-w-sm h-64 sm:h-72 select-none">
      {/* Center Table Play Area & Deck */}
      <div className="relative flex items-center justify-center w-full h-44">
        {/* Discard Pile (Center) */}
        <div
          id="table-discard-pile"
          onClick={hasSelectedCard && onDiscardPileClick ? onDiscardPileClick : undefined}
          className={`
            relative w-24 h-36 flex items-center justify-center transition-transform duration-200
            ${isDiscardImpact ? 'impact-pulse' : ''}
            ${hasSelectedCard ? 'cursor-pointer hover:scale-105 active:scale-95' : ''}
          `}
          title={hasSelectedCard ? 'Нажмите, чтобы бросить выбранную карту' : undefined}
        >
          {/* Subtle guide ring when a card in hand is selected */}
          {hasSelectedCard && (
            <div className="absolute -inset-2 rounded-2xl border-2 border-dashed border-amber-400/70 bg-amber-400/10 animate-pulse pointer-events-none z-30 flex items-center justify-center">
              <span className="text-[10px] font-black text-amber-300 uppercase tracking-widest bg-black/60 px-2 py-0.5 rounded-full">
                Бросить
              </span>
            </div>
          )}

          {discardPileTop.map((card, i) => {
            const isTop = i === discardPileTop.length - 1;
            const offset = cardOffsets[Math.min(i, cardOffsets.length - 1)];
            return (
              <div
                key={`${card.id}_${i}`}
                className="absolute transition-all duration-300"
                style={{
                  transform: `translate(${offset.x}px, ${offset.y}px) rotate(${offset.rot}deg)`,
                  zIndex: i + 1
                }}
              >
                <CardView
                  card={card}
                  size="md"
                  className={isTop ? 'shadow-2xl' : 'shadow-md'}
                />
              </div>
            );
          })}

          {!topCard && (
            <div className="w-20 h-30 rounded-lg border-2 border-dashed border-white/20 flex items-center justify-center text-xs text-white/40">
              Стол
            </div>
          )}
        </div>

        {/* Draw Deck (Right of center) */}
        <div
          id="table-draw-deck"
          onClick={canDrawCard ? onDrawCard : undefined}
          className={`
            absolute right-4 sm:right-8 flex flex-col items-center
            ${canDrawCard ? 'cursor-pointer hover:scale-105 active:scale-95 group' : 'cursor-default'}
            ${isDeckPress ? 'deck-press-effect' : ''}
            transition-all duration-200 select-none
          `}
          title={canDrawCard ? 'Нажмите, чтобы взять карту' : 'Колода добора'}
        >
          <div className="relative w-20 h-28 sm:w-24 sm:h-34 flex items-center justify-center">
            <img
              src="/assets/cards/DECK.webp"
              alt="Колода добора"
              loading="eager"
              decoding="async"
              className={`
                w-full h-full object-contain pointer-events-none drop-shadow-xl transition-all
                ${canDrawCard ? 'group-hover:brightness-110 drop-shadow-[0_0_15px_rgba(216,175,92,0.7)]' : ''}
              `}
              draggable={false}
            />
            {/* Remaining Cards Badge */}
            <div className="absolute -bottom-1 -right-1 px-2 py-0.5 rounded-full bg-[#1e1510] border border-amber-400 text-amber-200 text-[11px] font-bold shadow-lg z-10">
              {deckCount}
            </div>
          </div>
        </div>
      </div>

      {/* Turn Indicator Banner */}
      <div className="mt-3 flex flex-col items-center">
        <div className="flex items-center gap-2 px-4 py-1 rounded-full bg-black/60 border border-amber-500/30 backdrop-blur-md shadow-lg">
          <span className="text-xs text-amber-200/70 font-medium">Ход:</span>
          <span className={`text-sm font-bold tracking-wide ${isMyTurn ? 'text-amber-300 animate-pulse' : 'text-white'}`}>
            {isMyTurn ? 'Вы' : currentTurnNickname}
          </span>
        </div>

        {/* Penalty Notification Badge */}
        {penalty.amount > 0 && (
          <div className="mt-1.5 px-3 py-0.5 rounded-full bg-rose-950/80 border border-rose-500/60 text-rose-300 text-xs font-bold tracking-wide shadow-md animate-bounce">
            Штраф: +{penalty.amount} {penalty.amount === 1 ? 'карта' : penalty.amount < 5 ? 'карты' : 'карт'}
          </div>
        )}

        {/* Declared Suit Badge if Queen was played */}
        {topCard?.rank === 'Q' && activeSuit && (
          <div className="mt-1.5 px-3 py-0.5 rounded-full bg-amber-950/80 border border-amber-400/60 text-amber-200 text-xs font-semibold shadow-md flex items-center gap-1.5">
            <span>Масть:</span>
            <span className={`text-sm font-bold ${activeSuit === 'HEARTS' || activeSuit === 'DIAMONDS' ? 'text-rose-400' : 'text-white'}`}>
              {SUIT_SYMBOLS[activeSuit]} {SUIT_NAMES[activeSuit]}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
