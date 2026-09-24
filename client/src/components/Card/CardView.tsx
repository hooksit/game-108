import React from 'react';
import { Card } from '@game-108/shared';

interface CardViewProps {
  card?: Card;
  isBack?: boolean;
  isPlayable?: boolean;
  isSelected?: boolean;
  onClick?: () => void;
  className?: string;
  style?: React.CSSProperties;
  size?: 'sm' | 'md' | 'lg';
}

export const CardView: React.FC<CardViewProps> = ({
  card,
  isBack = false,
  isPlayable = false,
  isSelected = false,
  onClick,
  className = '',
  style,
  size = 'md'
}) => {
  const sizeClasses = {
    sm: 'w-12 h-18 sm:w-14 sm:h-[84px] aspect-[2/3]',
    md: 'w-16 h-24 sm:w-20 sm:h-30 md:w-24 md:h-36 aspect-[2/3]',
    lg: 'w-24 h-36 sm:w-28 sm:h-42 md:w-32 md:h-48 aspect-[2/3]'
  };

  const imageSrc = isBack || !card
    ? '/assets/cards/BACK.webp'
    : `/assets/cards/${card.suit}_${card.rank}.webp`;

  return (
    <div
      onClick={isPlayable && onClick ? onClick : undefined}
      style={style}
      className={`
        relative select-none transition-all duration-200 rounded-lg overflow-hidden
        ${sizeClasses[size]}
        ${isPlayable ? 'card-playable cursor-pointer hover:shadow-2xl' : ''}
        ${isSelected ? 'ring-4 ring-amber-400 -translate-y-4' : ''}
        ${!isBack && !isPlayable && card ? 'hover:brightness-95' : ''}
        shadow-[0_4px_12px_rgba(0,0,0,0.5)]
        ${className}
      `}
    >
      <img
        src={imageSrc}
        alt={card ? `${card.rank} ${card.suit}` : 'Рубашка'}
        loading="eager"
        decoding="async"
        onError={(e) => {
          const target = e.target as HTMLImageElement;
          if (target.src.endsWith('.webp')) {
            target.src = target.src.replace('.webp', '.png');
          }
        }}
        className="w-full h-full object-fill pointer-events-none drop-shadow-sm"
        draggable={false}
      />
      {isPlayable && (
        <div className="absolute inset-0 rounded-lg ring-2 ring-amber-300/80 pointer-events-none" />
      )}
    </div>
  );
};
