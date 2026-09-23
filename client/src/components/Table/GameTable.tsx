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
}

// Seat positions around the oval table
const SEAT_POSITIONS = [
  'bottom-28 left-1/2 -translate-x-1/2',    // Position 0: Bottom center (Me)
  'top-[52%] left-3 sm:left-4 -translate-y-1/2',     // Position 1: Bottom Left (Zara)
  'top-[24%] left-4 sm:left-6 -translate-y-1/2',     // Position 2: Top Left (Murad)
  'top-14 left-1/2 -translate-x-1/2',      // Position 3: Top Center (Adam)
  'top-[24%] right-4 sm:right-6 -translate-y-1/2',    // Position 4: Top Right (Ramil)
  'top-[52%] right-3 sm:right-4 -translate-y-1/2',    // Position 5: Bottom Right (Kamil)
];

export const GameTable: React.FC<GameTableProps> = ({
  state,
  onPlayCard,
  onDrawCard,
  onPassTurn,
  onOpenChat,
  unreadChatCount
}) => {
  const isMyTurn = state.currentTurnPlayerId === state.myPlayerId;
  const currentTurnPlayer = state.players.find((p) => p.id === state.currentTurnPlayerId);

  // Find local player's seatIndex to arrange table clockwise around them
  const myPlayer = state.players.find((p) => p.id === state.myPlayerId);
  const mySeatIndex = myPlayer?.seatIndex ?? 0;

  // Map each player to relative seat position 0..5
  const getRelativePosition = (seatIndex: number): number => {
    if (seatIndex === mySeatIndex) return 0;
    const offset = (seatIndex - mySeatIndex + 6) % 6;
    return offset;
  };

  return (
    <div className="relative flex-1 flex flex-col justify-between w-full max-w-md mx-auto overflow-hidden select-none">
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

      {/* 2. Players around Table */}
      <div className="relative flex-1 w-full h-full z-10">
        {state.players.map((p) => {
          const isLocal = p.id === state.myPlayerId;
          const posIdx = getRelativePosition(p.seatIndex);
          const posClass = SEAT_POSITIONS[posIdx];

          // For local player at bottom, avatar is rendered above hand
          if (isLocal) {
            return (
              <div
                key={p.id}
                className="absolute bottom-36 sm:bottom-44 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center"
              >
                <div className="relative group">
                  <div
                    className={`
                      w-14 h-14 sm:w-16 sm:h-16 rounded-full overflow-hidden transition-all duration-300
                      ${isMyTurn ? 'gold-active-ring scale-105' : 'shadow-xl'}
                    `}
                  >
                    <img
                      src={`/assets/avatars/${p.avatar || 'player'}.png`}
                      alt={p.nickname}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  {/* Local user "Вы" badge tag */}
                  <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 px-2 py-0.2 rounded-full bg-amber-500 text-black text-[9px] font-black uppercase tracking-wider shadow">
                    Вы
                  </div>
                </div>
                <div className="mt-1 flex flex-col items-center px-4 py-0.5 rounded-xl bg-black/75 border border-white/10 backdrop-blur-md shadow-lg min-w-[75px]">
                  <span className="text-[11px] font-semibold text-white/95 truncate">
                    {p.nickname}
                  </span>
                  <span className={`text-xs font-bold ${p.score < 0 ? 'text-emerald-400' : 'text-amber-300'}`}>
                    {p.isEliminated ? 'ВЫБЫЛ' : p.score}
                  </span>
                </div>
              </div>
            );
          }

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

      {/* 3. Bottom Area: Hand + Controls */}
      <div className="relative z-30 flex flex-col w-full pb-3">
        {/* Hand of Cards */}
        <PlayerHand
          hand={state.myHand}
          validPlayableCardIds={state.validPlayableCardIds}
          isMyTurn={isMyTurn}
          onPlayCard={onPlayCard}
        />

        {/* Controls Bar */}
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
        />
      </div>
    </div>
  );
};
