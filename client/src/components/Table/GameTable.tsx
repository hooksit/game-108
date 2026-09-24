import React from 'react';
import { GameStateView } from '@game-108/shared';
import { PlayerSeat } from '../PlayerSeat/PlayerSeat';
import { DiscardZone } from '../DiscardZone/DiscardZone';
import { PlayerHand } from '../Hand/PlayerHand';
import { Controls } from '../Controls/Controls';

interface GameTableProps {
  state: GameStateView;
  onPlayCard: (cardId: string) => void;
  onDrawCard: () => void;
  onPassTurn: () => void;
  onOpenChat: () => void;
  unreadChatCount?: number;
  myHandScore?: number;
  isMuted?: boolean;
  onToggleMute?: () => void;
  onProposeRestart?: () => void;
  onVoteRestart?: () => void;
}

// Dynamically determine opponent position around the table based on opponent count
const getOpponentPositionClass = (opponentIndex: number, totalOpponents: number): string => {
  switch (totalOpponents) {
    case 1: // 2 players total: Top center placed under top edge toast
      return 'top-20 sm:top-24 left-1/2 -translate-x-1/2';

    case 2: // 3 players total: Upper Left & Upper Right placed safely below toast
      return opponentIndex === 0
        ? 'top-[27%] left-3 sm:left-6 -translate-y-1/2'
        : 'top-[27%] right-3 sm:right-6 -translate-y-1/2';

    case 3: // 4 players total: Mid Left, Top Center, Upper Right
      if (opponentIndex === 0) return 'top-[39%] left-3 sm:left-5 -translate-y-1/2';
      if (opponentIndex === 1) return 'top-20 sm:top-24 left-1/2 -translate-x-1/2';
      return 'top-[27%] right-3 sm:right-5 -translate-y-1/2';

    case 4: // 5 players total: Lower Left, Upper Left, Top Center, Upper Right
      if (opponentIndex === 0) return 'top-[49%] left-2 sm:left-4 -translate-y-1/2';
      if (opponentIndex === 1) return 'top-[26%] left-3 sm:left-5 -translate-y-1/2';
      if (opponentIndex === 2) return 'top-20 sm:top-24 left-1/2 -translate-x-1/2';
      return 'top-[26%] right-3 sm:right-5 -translate-y-1/2';

    case 5: // 6 players total: Lower Left, Upper Left, Top Center, Upper Right, Mid Right
    default:
      if (opponentIndex === 0) return 'top-[53%] left-2 sm:left-3 -translate-y-1/2';
      if (opponentIndex === 1) return 'top-[27%] left-3 sm:left-4 -translate-y-1/2';
      if (opponentIndex === 2) return 'top-20 sm:top-24 left-1/2 -translate-x-1/2';
      if (opponentIndex === 3) return 'top-[26%] right-3 sm:right-4 -translate-y-1/2';
      return 'top-[45%] right-2 sm:right-3 -translate-y-1/2';
  }
};

export const GameTable: React.FC<GameTableProps> = ({
  state,
  onPlayCard,
  onDrawCard,
  onPassTurn,
  onOpenChat,
  unreadChatCount,
  myHandScore,
  isMuted,
  onToggleMute,
  onProposeRestart,
  onVoteRestart
}) => {
  const isMyTurn = state.currentTurnPlayerId === state.myPlayerId;
  const currentTurnPlayer = state.players.find((p) => p.id === state.currentTurnPlayerId);

  // Find local player and opponents
  const myPlayer = state.players.find((p) => p.id === state.myPlayerId);
  const mySeatIndex = myPlayer?.seatIndex ?? 0;

  // Sort opponents clockwise starting from the seat after the local player
  const opponents = state.players
    .filter((p) => p.id !== state.myPlayerId)
    .sort((a, b) => {
      const total = state.players.length;
      const diffA = (a.seatIndex - mySeatIndex + total) % total;
      const diffB = (b.seatIndex - mySeatIndex + total) % total;
      return diffA - diffB;
    });

  return (
    <div className="relative flex-1 flex flex-col justify-between w-full max-w-md mx-auto overflow-hidden select-none">
      {/* Spectator floating banner */}
      {state.isSpectator && (
        <div className="absolute top-11 sm:top-12 left-1/2 -translate-x-1/2 z-20 px-3 py-1 rounded-full bg-black/80 border border-amber-400/50 backdrop-blur-md shadow-2xl flex items-center gap-2 text-white pointer-events-none whitespace-nowrap">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[11px] font-bold text-amber-200">
            👁 Наблюдатель (вы сможете сыграть в следующей партии)
          </span>
        </div>
      )}

      {/* 1. High-Resolution Table Artwork Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0 flex items-center justify-center">
        <img
          src="/assets/table_bg.png"
          alt="Игровой стол"
          className="w-full h-full object-cover object-center pointer-events-none drop-shadow-2xl"
          draggable={false}
        />
        {/* Subtle vignette layer */}
        <div className="absolute inset-0 bg-radial-gradient from-transparent via-black/10 to-black/30 pointer-events-none" />
      </div>

      {/* 2. Opponents arranged along sides of Table (reduced compact size) */}
      <div className="relative flex-1 w-full h-full z-10">
        {opponents.map((p, idx) => {
          const posClass = getOpponentPositionClass(idx, opponents.length);
          return (
            <PlayerSeat
              key={p.id}
              player={p}
              isCurrentTurn={p.id === state.currentTurnPlayerId}
              isLocalUser={false}
              positionClass={posClass}
            />
          );
        })}

        {/* Center Discard Zone and Draw Deck */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-auto">
          <DiscardZone
            discardPileTop={state.discardPileTop}
            topCard={state.topCard}
            activeSuit={state.activeSuit}
            deckCount={state.deckCount}
            currentTurnNickname={currentTurnPlayer?.nickname || ''}
            isMyTurn={isMyTurn}
            penalty={state.penalty}
            canDrawCard={state.canDrawCard}
            onDrawCard={onDrawCard}
          />
        </div>
      </div>

      {/* 3. Bottom Area: Hand + Controls (User Avatar is positioned directly under cards) */}
      <div className="relative z-30 flex flex-col w-full pb-2">
        {/* Hand of Cards */}
        <PlayerHand
          hand={state.myHand}
          validPlayableCardIds={state.validPlayableCardIds}
          isMyTurn={isMyTurn}
          onPlayCard={onPlayCard}
        />

        {/* Controls Bar with Local Player Avatar in center */}
        <Controls
          activeSuit={state.activeSuit}
          roundNumber={state.roundNumber}
          isMyTurn={isMyTurn}
          canDrawCard={state.canDrawCard}
          canPass={state.canPass}
          penalty={state.penalty}
          onDrawCard={onDrawCard}
          onPassTurn={onPassTurn}
          onOpenChat={onOpenChat}
          unreadChatCount={unreadChatCount}
          myPlayer={myPlayer}
          myHandScore={myHandScore}
          restartVote={state.restartVote}
          myPlayerId={state.myPlayerId}
          isSpectator={state.isSpectator}
          isMuted={isMuted}
          onToggleMute={onToggleMute}
          onProposeRestart={onProposeRestart}
          onVoteRestart={onVoteRestart}
        />
      </div>
    </div>
  );
};
