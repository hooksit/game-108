import React from 'react';
import { MessageSquare } from 'lucide-react';
import { Suit, SUIT_SYMBOLS, PenaltyState } from '@game-108/shared';

interface ControlsProps {
  activeSuit: Suit | null;
  roundNumber: number;
  isMyTurn: boolean;
  canDrawCard: boolean;
  canPass: boolean;
  penalty: PenaltyState;
  onDrawCard: () => void;
  onPassTurn: () => void;
  onOpenChat: () => void;
  unreadChatCount?: number;
}

export const Controls: React.FC<ControlsProps> = ({
  activeSuit,
  roundNumber,
  isMyTurn,
  canDrawCard,
  canPass,
  penalty,
  onDrawCard,
  onPassTurn,
  onOpenChat,
  unreadChatCount = 0
}) => {
  const isRedSuit = activeSuit === 'HEARTS' || activeSuit === 'DIAMONDS';

  // Determine action button label & handler
  let actionLabel = 'Ожидание';
  let actionHandler: (() => void) | undefined = undefined;
  let isActionEnabled = false;

  if (isMyTurn) {
    if (penalty.amount > 0) {
      actionLabel = `Взять +${penalty.amount}`;
      actionHandler = onDrawCard;
      isActionEnabled = true;
    } else if (canPass) {
      actionLabel = 'Пас';
      actionHandler = onPassTurn;
      isActionEnabled = true;
    } else if (canDrawCard) {
      actionLabel = 'Взять карту';
      actionHandler = onDrawCard;
      isActionEnabled = true;
    }
  }

  return (
    <div className="relative z-20 flex items-center justify-between w-full px-4 py-2 pointer-events-auto">
      {/* Bottom Left: Trump / Suit Info Box */}
      <div className="flex flex-col items-center justify-center w-24 h-24 rounded-2xl bg-black/60 border border-white/10 backdrop-blur-md shadow-xl p-2">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-amber-200/70">
          Масть
        </span>
        <div className={`text-3xl my-0.5 leading-none ${isRedSuit ? 'text-rose-500' : 'text-slate-100'} drop-shadow`}>
          {activeSuit ? SUIT_SYMBOLS[activeSuit] : '—'}
        </div>
        <div className="mt-1 pt-1 border-t border-white/10 w-full text-center">
          <span className="text-[9px] text-white/50 block leading-tight">Раунд</span>
          <span className="text-[11px] font-bold text-amber-300 leading-tight">
            {roundNumber > 0 ? `${roundNumber}/12` : '1/12'}
          </span>
        </div>
      </div>

      {/* Bottom Right: Chat & Main Action Button */}
      <div className="flex items-center gap-3">
        {/* Chat Button */}
        <button
          onClick={onOpenChat}
          className="relative flex items-center justify-center w-12 h-12 rounded-2xl bg-black/60 border border-amber-500/30 text-amber-200 backdrop-blur-md active:scale-95 hover:bg-black/80 transition-all shadow-xl"
          title="Чат"
        >
          <MessageSquare className="w-5 h-5" />
          {unreadChatCount > 0 && (
            <span className="absolute -top-1 -right-1 flex items-center justify-center w-5 h-5 rounded-full bg-rose-600 text-white text-[10px] font-black shadow">
              {unreadChatCount}
            </span>
          )}
        </button>

        {/* Action Button: Пас / Взять карту */}
        <button
          onClick={isActionEnabled ? actionHandler : undefined}
          disabled={!isActionEnabled}
          className={`
            min-w-[110px] sm:min-w-[130px] h-12 px-6 rounded-2xl font-bold text-base tracking-wide transition-all shadow-xl
            ${isActionEnabled
              ? 'bg-gradient-to-b from-[#2a221b] to-[#16120e] text-amber-200 border border-amber-400/80 hover:brightness-110 active:scale-95 shadow-[0_0_15px_rgba(216,175,92,0.3)]'
              : 'bg-black/40 text-white/30 border border-white/5 cursor-not-allowed'
            }
          `}
        >
          {actionLabel}
        </button>
      </div>
    </div>
  );
};
