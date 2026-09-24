import React, { useState, useEffect } from 'react';
import { Card } from '@game-108/shared';
import { CardView } from '../Card/CardView';

interface PlayerHandProps {
  hand: Card[];
  validPlayableCardIds: string[];
  isMyTurn: boolean;
  selectedCardId?: string | null;
  onSelectCard?: (cardId: string | null) => void;
  onPlayCard: (cardId: string) => void;
}

export const PlayerHand: React.FC<PlayerHandProps> = ({
  hand,
  validPlayableCardIds,
  isMyTurn,
  selectedCardId: propSelectedId,
  onSelectCard,
  onPlayCard
}) => {
  const [internalSelectedId, setInternalSelectedId] = useState<string | null>(null);
  const selectedId = propSelectedId !== undefined ? propSelectedId : internalSelectedId;

  const handleSelect = (id: string | null) => {
    if (onSelectCard) onSelectCard(id);
    setInternalSelectedId(id);
  };

  // Reset selection if turn ends or hand changes
  useEffect(() => {
    if (!isMyTurn && selectedId) {
      handleSelect(null);
    }
  }, [isMyTurn]);

  useEffect(() => {
    if (selectedId && !hand.some((c) => c.id === selectedId)) {
      handleSelect(null);
    }
  }, [hand, selectedId]);

  const handleCardClick = (cardId: string, isPlayable: boolean) => {
    if (!isPlayable) return;

    if (selectedId === cardId) {
      // Confirmed tap on selected card -> throw card!
      handleSelect(null);
      onPlayCard(cardId);
    } else {
      // First tap -> select and lift card
      handleSelect(cardId);
    }
  };

  const totalCards = hand.length;

  return (
    <div
      id="player-hand-container"
      className="relative flex justify-center items-end w-full h-36 sm:h-44 px-4 overflow-visible pointer-events-auto"
      onClick={(e) => {
        // Deselect if clicking outside cards
        if (e.target === e.currentTarget && selectedId) {
          handleSelect(null);
        }
      }}
    >
      <div className="relative flex justify-center items-end max-w-full">
        {hand.map((card, index) => {
          const isPlayable = isMyTurn && validPlayableCardIds.includes(card.id);
          const isSelected = isPlayable && selectedId === card.id;

          // Fan calculation
          const mid = (totalCards - 1) / 2;
          const offsetIndex = index - mid;

          // Rotation angle and lateral offset
          const baseAngle = totalCards > 1 ? offsetIndex * Math.min(6, 45 / totalCards) : 0;
          const baseTranslateX = offsetIndex * Math.min(38, Math.max(22, 260 / totalCards));
          const baseTranslateY = Math.abs(offsetIndex) * 3;

          // Dynamic card parting & layering when a card is selected
          // Ensures the card to the right is NEVER covered and its suit & rank remain 100% visible
          let effectiveTranslateX = baseTranslateX;
          let effectiveTranslateY = baseTranslateY;
          let effectiveAngle = baseAngle;
          let effectiveScale = 1;
          let zIndex = index + 1;

          if (selectedId) {
            const selectedIndex = hand.findIndex((c) => c.id === selectedId);
            if (selectedIndex !== -1) {
              const partDistance = totalCards > 7 ? 30 : 36;
              if (index < selectedIndex) {
                // Cards to the left shift slightly left
                effectiveTranslateX = baseTranslateX - 10;
                zIndex = index + 1;
              } else if (index === selectedIndex) {
                // Selected card lifts high out of the fan and straightens up
                effectiveTranslateX = baseTranslateX;
                effectiveTranslateY = baseTranslateY - 40;
                effectiveScale = 1.05;
                effectiveAngle = 0; // Stand straight so corners don't lean into neighbor
                zIndex = 25;
              } else {
                // All cards to the right shift right by 36px to expose their rank & suit!
                // AND have higher z-index (30 + index) so they sit IN FRONT of the selected card
                effectiveTranslateX = baseTranslateX + partDistance;
                zIndex = 30 + index;
              }
            }
          }

          return (
            <div
              key={card.id}
              id={`hand-card-${card.id}`}
              className="absolute bottom-0 transition-all duration-200"
              style={{
                transform: `translateX(${effectiveTranslateX}px) translateY(${effectiveTranslateY}px) rotate(${effectiveAngle}deg) scale(${effectiveScale})`,
                zIndex
              }}
            >
              {/* "Бросить ↑" indicator badge above selected card */}
              {isSelected && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSelect(null);
                    onPlayCard(card.id);
                  }}
                  className="absolute -top-9 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 text-black font-black text-[11px] shadow-[0_0_14px_rgba(245,158,11,0.9)] border border-amber-200 flex items-center gap-1 animate-bounce z-50 pointer-events-auto whitespace-nowrap active:scale-95 transition-transform"
                  title="Нажмите, чтобы бросить на стол"
                >
                  <span>Бросить</span>
                  <span className="text-xs">↑</span>
                </button>
              )}

              <CardView
                card={card}
                isPlayable={isPlayable}
                isSelected={isSelected}
                onClick={() => handleCardClick(card.id, isPlayable)}
                size="md"
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};

