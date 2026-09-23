import { useState, useEffect, useRef } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { useGameSocket } from './hooks/useGameSocket';
import { useSound } from './hooks/useSound';
import { GameTable } from './components/Table/GameTable';
import { LobbyModal } from './components/Modals/LobbyModal';
import { QueenModal } from './components/Modals/QueenModal';
import { EightModal } from './components/Modals/EightModal';
import { RoundEndModal } from './components/Modals/RoundEndModal';
import { GameEndModal } from './components/Modals/GameEndModal';
import { ChatDrawer } from './components/Chat/ChatDrawer';

export default function App() {
  const {
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
    sendMessage
  } = useGameSocket();

  const { isMuted, toggleMute, playSound } = useSound();

  const [isChatOpen, setIsChatOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [chatToast, setChatToast] = useState<{ nickname: string; avatar?: string; message: string } | null>(null);
  const chatToastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevMessageCount = useRef<number>(0);

  // Audio reactivity refs
  const prevTopCardId = useRef<string | null>(null);
  const prevPhase = useRef<string | null>(null);
  const prevPenalty = useRef<number>(0);

  useEffect(() => {
    if (!gameState) return;

    // 1. Play card sound when top card changes
    if (gameState.topCard && gameState.topCard.id !== prevTopCardId.current) {
      if (prevTopCardId.current !== null) {
        playSound('play');
      }
      prevTopCardId.current = gameState.topCard.id;
    }

    // 2. Victory sound when round or game ends
    if (gameState.phase !== prevPhase.current) {
      if (gameState.phase === 'ROUND_END' || gameState.phase === 'GAME_END') {
        playSound('victory');
      } else if (gameState.phase === 'PLAYER_TURN' && prevPhase.current === 'ROUND_END') {
        playSound('deal');
      }
      prevPhase.current = gameState.phase;
    }

    // 3. Penalty sound when penalty increases
    if (gameState.penalty.amount > prevPenalty.current) {
      playSound('penalty');
    }
    prevPenalty.current = gameState.penalty.amount;
  }, [gameState, playSound]);

  // Listen for new chat messages to show 5-second disappearing toast and play sound
  useEffect(() => {
    if (messages.length > prevMessageCount.current) {
      const latestMsg = messages[messages.length - 1];
      prevMessageCount.current = messages.length;
      if (latestMsg && latestMsg.senderId !== gameState?.myPlayerId) {
        playSound('message');
        if (!isChatOpen) {
          setUnreadCount((c) => c + 1);
          const sender = gameState?.players.find((p) => p.id === latestMsg.senderId);
          setChatToast({
            nickname: latestMsg.nickname,
            avatar: sender?.avatar || 'player',
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
  }, [messages, gameState?.myPlayerId, gameState?.players, isChatOpen, playSound]);

  const handleOpenChat = () => {
    setIsChatOpen(true);
    setUnreadCount(0);
    setChatToast(null);
  };

  const handleSendMessage = (text: string) => {
    sendMessage(text);
  };

  const handlePlayCard = (cardId: string) => {
    playSound('play');
    playCard(cardId);
  };

  const handleDrawCard = () => {
    if (gameState?.penalty.amount && gameState.penalty.amount > 0) {
      playSound('penalty');
    } else {
      playSound('deal');
    }
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

  return (
    <div className="relative w-screen h-[100dvh] flex flex-col bg-[#110c09] overflow-hidden select-none">
      {/* Floating Sound Toggle Button (Left side) */}
      <button
        onClick={toggleMute}
        className="fixed top-3.5 left-3.5 z-40 p-2.5 rounded-2xl bg-black/50 border border-white/10 backdrop-blur-md text-amber-200 hover:text-amber-100 hover:bg-black/70 active:scale-95 transition-all shadow-lg"
        title={isMuted ? 'Включить звук' : 'Выключить звук'}
      >
        {isMuted ? <VolumeX className="w-4 h-4 text-white/40" /> : <Volume2 className="w-4 h-4 text-amber-300" />}
      </button>

      {/* Main Table Screen */}
      {gameState ? (
        <GameTable
          state={gameState}
          onPlayCard={handlePlayCard}
          onDrawCard={handleDrawCard}
          onPassTurn={handlePassTurn}
          onOpenChat={handleOpenChat}
          unreadChatCount={unreadCount}
        />
      ) : (
        <div className="flex-1 flex items-center justify-center text-amber-200/50 text-sm animate-pulse">
          Подключение к серверу...
        </div>
      )}

      {/* Floating Chat Message Toast (semi-transparent, auto-dismiss 5s, no icon, responsive width & overflow safe) */}
      {chatToast && (
        <div
          onClick={handleOpenChat}
          className="fixed top-3.5 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2.5 px-3.5 py-2 rounded-2xl bg-black/60 border border-amber-500/40 text-white shadow-2xl backdrop-blur-md cursor-pointer hover:bg-black/75 transition-all w-[90%] max-w-[280px] sm:max-w-xs animate-bounce"
          title="Нажмите чтобы открыть чат"
        >
          <img
            src={`/assets/avatars/${chatToast.avatar || 'player'}.png`}
            alt={chatToast.nickname}
            className="w-7 h-7 rounded-full border border-amber-400/60 object-cover shrink-0"
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

      {/* Floating Error Notification */}
      {errorMessage && (
        <div className="fixed top-14 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-2xl bg-rose-900/90 border border-rose-500 text-white text-xs font-bold shadow-2xl backdrop-blur-md animate-bounce">
          {errorMessage}
        </div>
      )}

      {/* Action Notice (e.g. 107->53) */}
      {notice && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-50 px-5 py-2.5 rounded-2xl bg-amber-950/90 border border-amber-400 text-amber-200 text-sm font-extrabold shadow-2xl backdrop-blur-md animate-scale-in">
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
          playSound('deal');
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

      {/* Chat Drawer */}
      <ChatDrawer
        isOpen={isChatOpen}
        messages={messages}
        myPlayerId={gameState?.myPlayerId || ''}
        onClose={() => setIsChatOpen(false)}
        onSendMessage={handleSendMessage}
      />
    </div>
  );
}
