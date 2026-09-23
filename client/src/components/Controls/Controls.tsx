import React from 'react';
import { MessageSquare, RotateCcw, Volume2, VolumeX } from 'lucide-react';
import { Suit, SUIT_SYMBOLS, PenaltyState, PlayerPublic, RestartVote } from '@game-108/shared';

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
  myPlayer?: PlayerPublic;
  myHandScore?: number;
  restartVote?: RestartVote | null;
  myPlayerId?: string;
  isSpectator?: boolean;
  isMuted?: boolean;
  onToggleMute?: () => void;
  onProposeRestart?: () => void;
  onVoteRestart?: () => void;
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
  unreadChatCount = 0,
  myPlayer,
  myHandScore,
  restartVote,
  myPlayerId,
  isSpectator,
  isMuted,
  onToggleMute,
  onProposeRestart,
  onVoteRestart
}) => {
  const isRedSuit = activeSuit === 'HEARTS' || activeSuit === 'DIAMONDS';
  const hasVotedRestart = restartVote && myPlayerId && restartVote.agreedPlayerIds.includes(myPlayerId);

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
    <div className="relative z-20 flex items-end justify-between w-full px-3 py-1 pointer-events-auto">
      {/* Bottom Left: Restart Button + Current Round Box */}
      <div className="flex flex-col items-center gap-1 shrink-0">
        {!isSpectator && onProposeRestart && (
          <button
            onClick={hasVotedRestart ? undefined : (restartVote ? onVoteRestart : onProposeRestart)}
            className={`
              flex items-center justify-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold transition-all shadow-md active:scale-95
              ${restartVote
                ? hasVotedRestart
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 cursor-default'
                  : 'bg-gradient-to-r from-emerald-500 to-amber-500 text-black border border-emerald-300 animate-pulse shadow-[0_0_12px_rgba(52,211,153,0.7)] cursor-pointer'
                : 'bg-black/60 text-amber-200/80 border border-white/10 hover:text-amber-100 hover:border-amber-400/50'
              }
            `}
            title="Предложить начать заново"
          >
            <RotateCcw className="w-2.5 h-2.5" />
            <span>
              {restartVote
                ? hasVotedRestart
                  ? `Ждём (${restartVote.agreedPlayerIds.length}/${restartVote.totalNeeded})`
                  : `Одобрить (${restartVote.agreedPlayerIds.length}/${restartVote.totalNeeded})`
                : 'Заново'}
            </span>
          </button>
        )}

        {/* Current Round & Suit Box (Shows current round without 12-round limit) */}
        <div className="flex flex-col items-center justify-center w-16 h-14 sm:w-20 sm:h-16 rounded-xl bg-black/60 border border-white/10 backdrop-blur-md shadow-lg p-1">
          <span className="text-[9px] sm:text-[10px] font-extrabold uppercase tracking-wider text-amber-300">
            Раунд {roundNumber > 0 ? roundNumber : 1}
          </span>
          <div className={`text-xl sm:text-2xl leading-none ${isRedSuit ? 'text-rose-500' : 'text-slate-100'} drop-shadow my-0.5`}>
            {activeSuit ? SUIT_SYMBOLS[activeSuit] : '—'}
          </div>
          <span className="text-[8px] text-white/50 leading-none">
            масть
          </span>
        </div>
      </div>

      {/* Center: Local Player Avatar & Badge (Located directly under player cards) */}
      {myPlayer && (
        <div className="flex flex-col items-center justify-center mx-1 shrink-0">
          <div className="relative">
            <div
              className={`
                w-11 h-11 sm:w-13 sm:h-13 rounded-full overflow-hidden transition-all duration-300
                ${isMyTurn ? 'gold-active-ring scale-105' : 'shadow-xl border-2 border-amber-500/40'}
                ${myPlayer.isEliminated ? 'filter grayscale brightness-50' : ''}
              `}
            >
              <img
                src={`/assets/avatars/${myPlayer.avatar || 'player'}.png`}
                alt={myPlayer.nickname}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/assets/avatars/player.png';
                }}
              />
            </div>
            {/* Online Status Dot */}
            <div
              className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-black ${
                myPlayer.isConnected !== false ? 'bg-emerald-400' : 'bg-rose-500'
              }`}
              title={myPlayer.isConnected !== false ? 'В сети' : 'Не в сети'}
            />

            {/* "Вы" badge */}
            <div className="absolute -top-1 left-1/2 -translate-x-1/2 px-2 py-0.2 rounded-full bg-amber-500 text-black text-[9px] font-black uppercase tracking-wider shadow">
              Вы
            </div>
          </div>

          {/* Nickname, Score & Real-time Hand Score */}
          <div className="mt-0.5 flex flex-col items-center px-2 py-0.5 rounded-lg bg-black/80 border border-white/15 shadow-md min-w-[60px] max-w-[95px]">
            <span className="text-[10px] sm:text-[11px] font-semibold text-white/95 truncate max-w-[85px] leading-tight">
              {myPlayer.nickname}
            </span>
            <div className="flex items-center gap-1 leading-none mt-0.5">
              <span className={`text-[10px] sm:text-[11px] font-bold ${myPlayer.score < 0 ? 'text-emerald-400' : 'text-amber-300'}`}>
                {myPlayer.isEliminated ? 'ВЫБЫЛ' : `${myPlayer.score} оч.`}
              </span>
            </div>
            {myHandScore !== undefined && !myPlayer.isEliminated && (
              <span className="text-[9px] font-semibold text-emerald-400 leading-tight mt-0.5 whitespace-nowrap" title="Сумма очков карт на руках">
                в руке {myHandScore} оч.
              </span>
            )}
          </div>
        </div>
      )}

      {/* Bottom Right: Chat & Main Action Button with Sound Toggle above */}
      <div className="flex flex-col items-end gap-1 shrink-0">
        {/* Sound toggle button positioned directly above the action button */}
        {onToggleMute && (
          <button
            onClick={onToggleMute}
            className="flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-black/60 border border-white/10 hover:border-amber-400/50 text-amber-200 text-[10px] font-semibold backdrop-blur-md active:scale-95 transition-all shadow"
            title={isMuted ? 'Включить звук' : 'Выключить звук'}
          >
            {isMuted ? <VolumeX className="w-3.5 h-3.5 text-rose-400" /> : <Volume2 className="w-3.5 h-3.5 text-amber-300" />}
            <span className="text-[9px] text-white/80">{isMuted ? 'Выкл' : 'Звук'}</span>
          </button>
        )}

        <div className="flex items-center gap-2 sm:gap-3">
          {/* Chat Button */}
          <button
            onClick={onOpenChat}
            className="relative flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-black/60 border border-amber-500/30 text-amber-200 backdrop-blur-md active:scale-95 hover:bg-black/80 transition-all shadow-xl"
            title="Чат"
          >
            <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5" />
            {unreadChatCount > 0 && (
              <span className="absolute -top-1 -right-1 flex items-center justify-center w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-rose-600 text-white text-[9px] sm:text-[10px] font-black shadow">
                {unreadChatCount}
              </span>
            )}
          </button>

          {/* Action Button: Пас / Взять карту */}
          <button
            onClick={isActionEnabled ? actionHandler : undefined}
            disabled={!isActionEnabled}
            className={`
              min-w-[90px] sm:min-w-[120px] h-10 sm:h-12 px-3 sm:px-5 rounded-xl sm:rounded-2xl font-bold text-xs sm:text-sm tracking-wide transition-all shadow-xl
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
    </div>
  );
};
