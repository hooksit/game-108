import React, { useState, useEffect, useRef } from 'react';
import { GameStateView, Card } from '@game-108/shared';
import { PlayerSeat } from '../PlayerSeat/PlayerSeat';
import { DiscardZone } from '../DiscardZone/DiscardZone';
import { PlayerHand } from '../Hand/PlayerHand';
import { Controls } from '../Controls/Controls';
import { CardAnimationLayer, FlyingCardItem } from './CardAnimationLayer';

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
    case 1: // 2 players total: Top center placed on the central vertical axis
      return 'top-[84px] sm:top-24 left-1/2 -translate-x-1/2';

    case 2: // 3 players total: Strictly symmetrical Upper Left & Upper Right
      return opponentIndex === 0
        ? 'top-[25%] left-[6%] sm:left-[8%] -translate-y-1/2'
        : 'top-[25%] right-[6%] sm:right-[8%] -translate-y-1/2';

    case 3: // 4 players total: Upper Left, Top Center, Upper Right (strictly symmetrical)
      if (opponentIndex === 0) return 'top-[30%] left-[6%] sm:left-[8%] -translate-y-1/2';
      if (opponentIndex === 1) return 'top-[84px] sm:top-24 left-1/2 -translate-x-1/2';
      return 'top-[30%] right-[6%] sm:right-[8%] -translate-y-1/2';

    case 4: // 5 players total: 4 side players strictly symmetrical (2 left, 2 right), deck in middle between the 2 on the right
      if (opponentIndex === 0) return 'top-[61%] left-[5%] sm:left-[7%] -translate-y-1/2'; // Lower Left (8 o'clock)
      if (opponentIndex === 1) return 'top-[25%] left-[6%] sm:left-[8%] -translate-y-1/2'; // Upper Left (10 o'clock)
      if (opponentIndex === 2) return 'top-[25%] right-[6%] sm:right-[8%] -translate-y-1/2'; // Upper Right (2 o'clock)
      return 'top-[61%] right-[5%] sm:right-[7%] -translate-y-1/2'; // Lower Right (4 o'clock)

    case 5: // 6 players total: 4 side players strictly symmetrical (2 left, 2 right) + 1 Top Center, deck between right players
    default:
      if (opponentIndex === 0) return 'top-[61%] left-[5%] sm:left-[7%] -translate-y-1/2'; // Lower Left (8 o'clock)
      if (opponentIndex === 1) return 'top-[27%] left-[6%] sm:left-[8%] -translate-y-1/2'; // Upper Left (10 o'clock)
      if (opponentIndex === 2) return 'top-[84px] sm:top-24 left-1/2 -translate-x-1/2'; // Top Center (12 o'clock)
      if (opponentIndex === 3) return 'top-[27%] right-[6%] sm:right-[8%] -translate-y-1/2'; // Upper Right (2 o'clock)
      return 'top-[61%] right-[5%] sm:right-[7%] -translate-y-1/2'; // Lower Right (4 o'clock)
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

  // Animation states
  const [flyingCards, setFlyingCards] = useState<FlyingCardItem[]>([]);
  const [isDiscardImpact, setIsDiscardImpact] = useState(false);
  const [isDeckPress, setIsDeckPress] = useState(false);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);

  // Animation tracking refs
  const prevTopCardId = useRef<string | null>(state.topCard?.id || null);
  const prevDeckCount = useRef<number>(state.deckCount);
  const lastLocalPlayedCardId = useRef<string | null>(null);
  const localJustDrewRef = useRef<boolean>(false);
  const prevTurnPlayerId = useRef<string | null>(state.currentTurnPlayerId);

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

  // Launch throw animation
  const triggerThrowAnimation = (
    card: Card,
    startEl: HTMLElement | null,
    endEl: HTMLElement | null,
    durationMs = 380
  ) => {
    const fallbackStart = { x: window.innerWidth * 0.5, y: window.innerHeight * 0.85 };
    const fallbackEnd = { x: window.innerWidth * 0.5, y: window.innerHeight * 0.43 };

    const startRect = startEl ? startEl.getBoundingClientRect() : {
      left: fallbackStart.x - 40,
      top: fallbackStart.y - 60,
      width: 80,
      height: 120
    };

    const endRect = endEl ? endEl.getBoundingClientRect() : {
      left: fallbackEnd.x - 40,
      top: fallbackEnd.y - 60,
      width: 80,
      height: 120
    };

    const width = startRect.width || 80;
    const height = startRect.height || 120;
    const endX = endRect.left + (endRect.width - width) / 2;
    const endY = endRect.top + (endRect.height - height) / 2;

    const animItem: FlyingCardItem = {
      id: `throw_${card.id}_${Date.now()}_${Math.random()}`,
      type: 'throw',
      card,
      isBack: false,
      startX: startRect.left,
      startY: startRect.top,
      endX,
      endY,
      startRot: 0,
      endRot: (Math.random() - 0.5) * 16,
      width,
      height,
      durationMs
    };

    setFlyingCards((prev) => [...prev, animItem]);
  };

  // Launch draw animation
  const triggerDrawAnimation = (
    isLocal: boolean,
    targetPlayerId?: string | null,
    durationMs = 380
  ) => {
    setIsDeckPress(true);
    setTimeout(() => setIsDeckPress(false), 260);

    const deckEl = document.getElementById('table-draw-deck');
    const targetEl = isLocal
      ? document.getElementById('player-hand-container')
      : targetPlayerId
      ? document.getElementById(`player-seat-${targetPlayerId}`)
      : null;

    const fallbackDeck = { x: window.innerWidth * 0.75, y: window.innerHeight * 0.43 };
    const fallbackTarget = isLocal
      ? { x: window.innerWidth * 0.5, y: window.innerHeight * 0.85 }
      : { x: window.innerWidth * 0.5, y: window.innerHeight * 0.25 };

    const startRect = deckEl ? deckEl.getBoundingClientRect() : {
      left: fallbackDeck.x - 40,
      top: fallbackDeck.y - 55,
      width: 80,
      height: 115
    };

    const endRect = targetEl ? targetEl.getBoundingClientRect() : {
      left: fallbackTarget.x - 40,
      top: fallbackTarget.y - 40,
      width: 60,
      height: 80
    };

    const width = Math.min(startRect.width || 75, 80);
    const height = Math.min(startRect.height || 110, 120);
    const endX = endRect.left + (endRect.width - width) / 2;
    const endY = endRect.top + (endRect.height - height) / 2;

    const animItem: FlyingCardItem = {
      id: `draw_${Date.now()}_${Math.random()}`,
      type: 'draw',
      isBack: true,
      startX: startRect.left,
      startY: startRect.top,
      endX,
      endY,
      startRot: 0,
      endRot: (Math.random() - 0.5) * 16,
      width,
      height,
      durationMs
    };

    setFlyingCards((prev) => [...prev, animItem]);
  };

  const handleAnimationComplete = (id: string, type: 'throw' | 'draw') => {
    setFlyingCards((prev) => prev.filter((item) => item.id !== id));
    if (type === 'throw') {
      setIsDiscardImpact(true);
      setTimeout(() => setIsDiscardImpact(false), 300);
    }
  };

  // Local play action with animated throw
  const handleLocalPlayCard = (cardId: string) => {
    const card = state.myHand.find((c) => c.id === cardId);
    if (card) {
      lastLocalPlayedCardId.current = cardId;
      const cardEl = document.getElementById(`hand-card-${cardId}`);
      const discardEl = document.getElementById('table-discard-pile');
      triggerThrowAnimation(card, cardEl, discardEl);
    }
    setSelectedCardId(null);
    onPlayCard(cardId);
  };

  // Local draw action with animated draw
  const handleLocalDrawCard = () => {
    localJustDrewRef.current = true;
    triggerDrawAnimation(true);
    onDrawCard();
  };

  // Clicking discard pile when a card is selected in hand throws it
  const handleDiscardPileClick = () => {
    if (selectedCardId && isMyTurn) {
      handleLocalPlayCard(selectedCardId);
    }
  };

  // Animate opponent plays onto the table
  useEffect(() => {
    if (state.topCard && state.topCard.id !== prevTopCardId.current) {
      const isLocalPlay = lastLocalPlayedCardId.current === state.topCard.id;
      if (!isLocalPlay) {
        // An opponent laid down this card!
        const discardEl = document.getElementById('table-discard-pile');
        const opponentId = prevTurnPlayerId.current || state.currentTurnPlayerId;
        const seatEl = (opponentId ? document.getElementById(`player-seat-${opponentId}`) : null) ||
                       document.querySelector(`[id^="player-seat-"]`);
        triggerThrowAnimation(state.topCard, seatEl as HTMLElement, discardEl);
      }
      lastLocalPlayedCardId.current = null;
      prevTopCardId.current = state.topCard.id;
    }
  }, [state.topCard]);

  // Animate opponent draws from deck
  useEffect(() => {
    if (prevDeckCount.current !== undefined && state.deckCount < prevDeckCount.current) {
      if (!localJustDrewRef.current) {
        const diff = prevDeckCount.current - state.deckCount;
        const count = Math.min(diff, 4);
        for (let i = 0; i < count; i++) {
          setTimeout(() => {
            triggerDrawAnimation(false, state.currentTurnPlayerId);
          }, i * 90);
        }
      }
      localJustDrewRef.current = false;
    }
    prevDeckCount.current = state.deckCount;
  }, [state.deckCount, state.currentTurnPlayerId]);

  useEffect(() => {
    prevTurnPlayerId.current = state.currentTurnPlayerId;
  }, [state.currentTurnPlayerId]);

  return (
    <div className="relative flex-1 flex flex-col justify-between w-full max-w-md mx-auto overflow-hidden select-none">
      {/* Flying card animation layer */}
      <CardAnimationLayer cards={flyingCards} onComplete={handleAnimationComplete} />

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

      {/* 2. Full-Table Play Area: Opponents + Discard Zone and Draw Deck mapped directly to table felt */}
      <div className="absolute inset-0 z-10 pointer-events-none">
        {/* Opponents arranged symmetrically along sides of Table */}
        {opponents.map((p, idx) => {
          const posClass = getOpponentPositionClass(idx, opponents.length);
          return (
            <div key={p.id} className="pointer-events-auto">
              <PlayerSeat
                player={p}
                isCurrentTurn={p.id === state.currentTurnPlayerId}
                isLocalUser={false}
                positionClass={posClass}
              />
            </div>
          );
        })}

        {/* Center Discard Zone and Draw Deck (Centered on oval table felt at ~43%) */}
        <div className="absolute top-[43%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-sm pointer-events-auto flex items-center justify-center">
          <DiscardZone
            discardPileTop={state.discardPileTop}
            topCard={state.topCard}
            activeSuit={state.activeSuit}
            deckCount={state.deckCount}
            currentTurnNickname={currentTurnPlayer?.nickname || ''}
            isMyTurn={isMyTurn}
            penalty={state.penalty}
            canDrawCard={state.canDrawCard}
            onDrawCard={handleLocalDrawCard}
            isDiscardImpact={isDiscardImpact}
            isDeckPress={isDeckPress}
            hasSelectedCard={Boolean(selectedCardId)}
            onDiscardPileClick={handleDiscardPileClick}
          />
        </div>
      </div>

      {/* Spacer to push Hand + Controls firmly to bottom */}
      <div className="flex-1 pointer-events-none" />

      {/* 3. Bottom Area: Hand + Controls (User Avatar is positioned directly under cards) */}
      <div className="mt-auto relative z-30 flex flex-col w-full pb-2 pointer-events-auto">
        {/* Hand of Cards */}
        <PlayerHand
          hand={state.myHand}
          validPlayableCardIds={state.validPlayableCardIds}
          isMyTurn={isMyTurn}
          selectedCardId={selectedCardId}
          onSelectCard={setSelectedCardId}
          onPlayCard={handleLocalPlayCard}
        />

        {/* Controls Bar with Local Player Avatar in center */}
        <Controls
          activeSuit={state.activeSuit}
          roundNumber={state.roundNumber}
          isMyTurn={isMyTurn}
          canDrawCard={state.canDrawCard}
          canPass={state.canPass}
          penalty={state.penalty}
          onDrawCard={handleLocalDrawCard}
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

