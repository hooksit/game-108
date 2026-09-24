import { useState, useEffect, useRef, useMemo } from 'react';
import { calculateHandScore } from '@game-108/shared';
import { useGameSocket } from './hooks/useGameSocket';
import { useSound } from './hooks/useSound';
import { GameTable } from './components/Table/GameTable';
import { LobbyModal } from './components/Modals/LobbyModal';
import { QueenModal } from './components/Modals/QueenModal';
import { EightModal } from './components/Modals/EightModal';
import { RoundEndModal } from './components/Modals/RoundEndModal';
import { GameEndModal } from './components/Modals/GameEndModal';
import { StartingTurnModal } from './components/Modals/StartingTurnModal';
import { ChatDrawer } from './components/Chat/ChatDrawer';
import { preloadAllCards } from './utils/preloadCards';

export default function App() {
  const {
    socketId,
    gameState,
    messages,
    errorMessage,
    notice,
    lobbyInfo,
    quickJoin,
    startGame,
    playCard,
    drawCard,
    passTurn,
    selectQueenSuit,
    eightDraw,
    eightStop,
    eightSelect,
    nextRound,
    proposeRestart,
    voteRestart,
    sendMessage
  } = useGameSocket();

  const { isMuted, toggleMute, playSound } = useSound();

  const [isChatOpen, setIsChatOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [chatToast, setChatToast] = useState<{ nickname: string; avatar?: string; message: string } | null>(null);
  const chatToastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevMessageCount = useRef<number>(0);

  // Starting turn modal state
  const [isStartingModalOpen, setIsStartingModalOpen] = useState(false);
  const shownStartingRound = useRef<number | null>(null);

  // Audio reactivity refs
  const prevTopCardId = useRef<string | null>(null);
  const prevPhase = useRef<string | null>(null);
  const prevPenalty = useRef<number>(0);
  const prevDeckCount = useRef<number | null>(null);
  const prevTurnPlayerId = useRef<string | null>(null);

  // Preload all 36 playing cards + back + deck into memory cache for instant 0ms draw rendering
  useEffect(() => {
    preloadAllCards();
  }, []);

  useEffect(() => {
    if (!gameState) return;

    // Detect state changes BEFORE mutating any refs
    const isCardPlayed = Boolean(
      gameState.topCard &&
      prevTopCardId.current !== null &&
      gameState.topCard.id !== prevTopCardId.current
    );
    const isCardDrawn = Boolean(
      prevDeckCount.current !== null &&
      gameState.deckCount < prevDeckCount.current
    );
    const isTurnChanged = Boolean(
      prevTurnPlayerId.current !== null &&
      gameState.currentTurnPlayerId !== prevTurnPlayerId.current
    );
    const wasOpponentTurn = Boolean(
      prevTurnPlayerId.current !== null &&
      prevTurnPlayerId.current !== gameState.myPlayerId
    );

    // 1. Play card sound when top card changes (opponent played a card onto table)
    // (Local player plays sound immediately on action in handlePlayCard/eightSelect)
    if (isCardPlayed) {
      if (wasOpponentTurn) {
        playSound('play'); // Положил карту на стол
      }
    }

    // 2. Victory sound when round or game ends; dealing sound when starting match/round
    if (gameState.phase !== prevPhase.current) {
      if (gameState.phase === 'ROUND_END' || gameState.phase === 'GAME_END') {
        playSound('victory');
      } else if (
        gameState.phase === 'PLAYER_TURN' &&
        (prevPhase.current === 'ROUND_END' || prevPhase.current === 'LOBBY' || prevPhase.current === null)
      ) {
        if (prevPhase.current !== null) {
          playSound('deal'); // начало игры раздача карт
        }
      }
    }

    // 3. Penalty sound: Removed per user request ("убери звук штрафа")

    // 4. Opponent card draw sound (deck count decreased without top card change)
    if (isCardDrawn && !isCardPlayed) {
      if (gameState.phase === 'PLAYER_TURN' || gameState.phase === 'EIGHT_DRAW') {
        if (wasOpponentTurn) {
          playSound('draw'); // взял карту из колоды
        }
      }
    }

    // 5. Opponent pass sound (turn changed, no card played, deck count unchanged)
    // Strictly requires: NO card was played, NO card was drawn, turn changed, previous turn was opponent's,
    // and both previous and current phase are active PLAYER_TURN.
    if (
      !isCardPlayed &&
      !isCardDrawn &&
      isTurnChanged &&
      wasOpponentTurn &&
      gameState.phase === 'PLAYER_TURN' &&
      prevPhase.current === 'PLAYER_TURN'
    ) {
      playSound('pass'); // Постучали колодой - пас
    }

    // Update all tracking refs at the VERY END of the cycle
    prevTopCardId.current = gameState.topCard?.id || null;
    prevPhase.current = gameState.phase;
    prevPenalty.current = gameState.penalty.amount;
    prevDeckCount.current = gameState.deckCount;
    prevTurnPlayerId.current = gameState.currentTurnPlayerId;
  }, [gameState, playSound]);

  // Listen for new chat messages to show 5-second disappearing toast and play sound
  useEffect(() => {
    if (messages.length > prevMessageCount.current) {
      const latestMsg = messages[messages.length - 1];
      prevMessageCount.current = messages.length;
      const myId = gameState?.myPlayerId || socketId;
      if (latestMsg && latestMsg.senderId !== myId) {
        playSound('message');
        if (!isChatOpen) {
          setUnreadCount((c) => c + 1);
          const sender = gameState?.players.find((p) => p.id === latestMsg.senderId);
          setChatToast({
            nickname: latestMsg.nickname,
            avatar: sender?.avatar || latestMsg.avatar || 'player',
            message: latestMsg.message
          });

          if (chatToastTimer.current) {
            clearTimeout(chatToastTimer.current);
          }
          chatToastTimer.current = setTimeout(() => {
            setChatToast(null);
          }, 5000);
        }
      }
    }
  }, [messages, gameState?.myPlayerId, socketId, gameState?.players, isChatOpen, playSound]);

  // Show starting turn modal on new round start
  useEffect(() => {
    if (
      gameState?.startingInfo &&
      gameState.phase === 'PLAYER_TURN' &&
      shownStartingRound.current !== gameState.roundNumber
    ) {
      shownStartingRound.current = gameState.roundNumber;
      setIsStartingModalOpen(true);
    }
  }, [gameState?.startingInfo, gameState?.phase, gameState?.roundNumber]);

  const handleOpenChat = () => {
    setIsChatOpen(true);
    setUnreadCount(0);
    setChatToast(null);
  };

  const handleSendMessage = (text: string) => {
    const nick = localStorage.getItem('player_nick') || 'Игрок';
    const av = localStorage.getItem('player_avatar') || 'player';
    sendMessage(text, nick, av);
  };

  const handlePlayCard = (cardId: string) => {
    playSound('play');
    playCard(cardId);
  };

  const handleDrawCard = () => {
    playSound('draw');
    drawCard();
  };

  const handlePassTurn = () => {
    playSound('pass');
    passTurn();
  };

  const myPlayer = gameState?.players.find((p) => p.id === gameState.myPlayerId);
  const isHost = myPlayer?.isHost || false;

  // Modals visibility
  const showLobby = !gameState || gameState.phase === 'LOBBY';
  const showQueenModal = gameState?.phase === 'QUEEN_SUIT_SELECTION' && gameState.currentTurnPlayerId === gameState.myPlayerId;
  const showEightModal = (gameState?.phase === 'EIGHT_DRAW' || gameState?.phase === 'EIGHT_SELECT') && gameState.currentTurnPlayerId === gameState.myPlayerId;
  const showRoundEndModal = gameState?.phase === 'ROUND_END';
  const showGameEndModal = gameState?.phase === 'GAME_END';

  const myHandScore = useMemo(() => {
    return gameState?.myHand ? calculateHandScore(gameState.myHand) : 0;
  }, [gameState?.myHand]);

  return (
    <div className="relative w-screen h-[100dvh] flex flex-col bg-[#110c09] overflow-hidden select-none">
      {/* Main Table Screen */}
      {gameState ? (
        <GameTable
          state={gameState}
          onPlayCard={handlePlayCard}
          onDrawCard={handleDrawCard}
          onPassTurn={handlePassTurn}
          onOpenChat={handleOpenChat}
          unreadChatCount={unreadCount}
          myHandScore={myHandScore}
          isMuted={isMuted}
          onToggleMute={toggleMute}
          onProposeRestart={proposeRestart}
          onVoteRestart={voteRestart}
        />
      ) : (
        <div className="flex-1 flex items-center justify-center text-amber-200/50 text-sm animate-pulse">
          Подключение к серверу...
        </div>
      )}

      {/* Floating Error Notification */}
      {errorMessage && (
        <div className="fixed top-1.5 sm:top-2 left-1/2 -translate-x-1/2 z-[95] px-4 py-2 rounded-2xl bg-rose-900/90 border border-rose-500 text-white text-xs font-bold shadow-2xl backdrop-blur-md animate-fade-in">
          {errorMessage}
        </div>
      )}

      {/* Action Notice (e.g. 107->53) */}
      {notice && (
        <div className="fixed top-28 sm:top-32 left-1/2 -translate-x-1/2 z-50 px-5 py-2.5 rounded-2xl bg-amber-950/90 border border-amber-400 text-amber-200 text-sm font-extrabold shadow-2xl backdrop-blur-md animate-scale-in">
          {notice.text}
        </div>
      )}

      {/* Lobby / Join Screen */}
      {showLobby && (
        <LobbyModal
          roomId={gameState?.roomId}
          players={gameState?.players || []}
          isHost={isHost}
          myPlayerId={gameState?.myPlayerId || ''}
          lobbyInfo={lobbyInfo}
          unreadChatCount={unreadCount}
          onOpenChat={handleOpenChat}
          onQuickJoin={(nick, av) => quickJoin(nick, av)}
          onStartGame={startGame}
        />
      )}

      {/* Queen Suit Selection Modal */}
      <QueenModal
        isOpen={showQueenModal}
        hand={gameState?.myHand || []}
        onSelectSuit={selectQueenSuit}
      />

      {/* Eight Mechanic Modal */}
      <EightModal
        isOpen={showEightModal}
        phase={gameState?.phase as 'EIGHT_DRAW' | 'EIGHT_SELECT'}
        activeSuit={gameState?.activeSuit || null}
        hiddenDrawCards={gameState?.myHiddenDrawCards || []}
        hand={gameState?.myHand || []}
        onDraw={() => {
          playSound('draw');
          eightDraw();
        }}
        onStop={eightStop}
        onSelectCard={(cId) => {
          playSound('play');
          eightSelect(cId);
        }}
      />

      {/* Round End Modal */}
      {showRoundEndModal && (
        <RoundEndModal
          result={gameState?.roundResult}
          isHost={isHost}
          onNextRound={nextRound}
        />
      )}

      {/* Final Game End Modal */}
      {showGameEndModal && (
        <GameEndModal
          winner={gameState?.gameWinner}
          roundCount={gameState?.roundNumber || 0}
          onRestart={() => window.location.reload()}
        />
      )}

      {/* Starting Turn / Starter Announcement Modal */}
      {isStartingModalOpen && gameState?.startingInfo && (
        <StartingTurnModal
          startingInfo={gameState.startingInfo}
          onClose={() => setIsStartingModalOpen(false)}
        />
      )}

      {/* Floating Chat Message Toast (top-1.5 closer to top edge, compact, z-[90] visible in lobby and game without overlapping players) */}
      {chatToast && (
        <div
          onClick={handleOpenChat}
          className="fixed top-1.5 sm:top-2 left-3 right-3 max-w-[280px] sm:max-w-xs mx-auto z-[90] flex items-center gap-2.5 px-3 py-1.5 rounded-2xl bg-black/40 border border-amber-500/25 text-white shadow-xl backdrop-blur-md cursor-pointer hover:bg-black/55 transition-all animate-fade-in"
          title="Нажмите чтобы открыть чат"
        >
          <img
            src={`/assets/avatars/${chatToast.avatar || 'player'}.png`}
            alt={chatToast.nickname}
            className="w-6 h-6 rounded-full border border-amber-400/60 object-cover shrink-0"
          />
          <div className="flex flex-col min-w-0 flex-1 text-left overflow-hidden">
            <span className="text-[10px] font-bold text-amber-300 truncate">
              {chatToast.nickname}
            </span>
            <span className="text-xs text-white/95 truncate">
              {chatToast.message}
            </span>
          </div>
        </div>
      )}

      {/* Chat Drawer */}
      <ChatDrawer
        isOpen={isChatOpen}
        messages={messages}
        myPlayerId={gameState?.myPlayerId || socketId}
        onClose={() => setIsChatOpen(false)}
        onSendMessage={handleSendMessage}
      />
    </div>
  );
}
