import React from 'react';
import { Card } from '@game-108/shared';

export interface FlyingCardItem {
  id: string;
  type: 'throw' | 'draw';
  card?: Card;
  isBack?: boolean;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  startRot: number;
  endRot: number;
  width: number;
  height: number;
  durationMs: number;
}

interface CardAnimationLayerProps {
  cards: FlyingCardItem[];
  onComplete: (id: string, type: 'throw' | 'draw') => void;
}

export const CardAnimationLayer: React.FC<CardAnimationLayerProps> = ({
  cards,
  onComplete
}) => {
  if (cards.length === 0) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-[85] overflow-hidden">
      {cards.map((item) => {
        const imageSrc = item.isBack || !item.card
          ? '/assets/cards/BACK.webp'
          : `/assets/cards/${item.card.suit}_${item.card.rank}.webp`;

        const animClass = item.type === 'throw' ? 'anim-card-throw' : 'anim-card-draw';

        const style = {
          '--start-x': `${item.startX}px`,
          '--start-y': `${item.startY}px`,
          '--end-x': `${item.endX}px`,
          '--end-y': `${item.endY}px`,
          '--start-rot': `${item.startRot}deg`,
          '--end-rot': `${item.endRot}deg`,
          '--fly-duration': `${item.durationMs}ms`,
          width: `${item.width}px`,
          height: `${item.height}px`
        } as React.CSSProperties;

        return (
          <div
            key={item.id}
            className={`${animClass} rounded-lg overflow-hidden shadow-2xl`}
            style={style}
            onAnimationEnd={() => onComplete(item.id, item.type)}
          >
            <img
              src={imageSrc}
              alt="flying card"
              className="w-full h-full object-fill drop-shadow-md"
            />
          </div>
        );
      })}
    </div>
  );
};
