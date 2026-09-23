import React from 'react';
import { Card } from '@game-108/shared';
import { CardView } from '../Card/CardView';

interface PlayerHandProps {
  hand: Card[];
  validPlayableCardIds: string[];
  isMyTurn: boolean;
  onPlayCard: (cardId: string) => void;
}

export const PlayerHand: React.FC<PlayerHandProps> = ({
  hand,
  validPlayableCardIds,
  isMyTurn,
  onPlayCard
}) => {
  const totalCards = hand.length;

  return (
    <div className="relative flex justify-center items-end w-full h-36 sm:h-44 px-4 overflow-visible pointer-events-auto">
      <div className="relative flex justify-center items-end max-w-full">
        {hand.map((card, index) => {
          const isPlayable = isMyTurn && validPlayableCardIds.includes(card.id);
          
          // Fan calculation
          const mid = (totalCards - 1) / 2;
          const offsetIndex = index - mid;
          
          // Rotation angle and lateral offset
          const angle = totalCards > 1 ? offsetIndex * Math.min(6, 45 / totalCards) : 0;
          const translateX = offsetIndex * Math.min(38, Math.max(22, 260 / totalCards));
          const translateY = Math.abs(offsetIndex) * 3;

          return (
            <div
              key={card.id}
              className="absolute bottom-0 transition-transform duration-200"
              style={{
                transform: `translateX(${translateX}px) translateY(${translateY}px) rotate(${angle}deg)`,
                zIndex: index + 1
              }}
            >
              <CardView
                card={card}
                isPlayable={isPlayable}
                onClick={() => isPlayable && onPlayCard(card.id)}
                size="md"
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};
