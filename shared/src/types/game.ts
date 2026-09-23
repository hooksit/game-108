import { Card, Suit } from './card.js';

export type GamePhase =
  | 'LOBBY'
  | 'DEALING'
  | 'PLAYER_TURN'
  | 'EIGHT_DRAW'              // Active player is drawing cards for eight
  | 'EIGHT_SELECT'            // Active player stopped and must choose which matching card to play
  | 'QUEEN_SUIT_SELECTION'   // Active player just played Queen and must declare a suit
  | 'ROUND_END'               // Scores calculated, showing round results
  | 'GAME_END';               // Winner declared, match finished

export interface PlayerPublic {
  id: string;
  nickname: string;
  avatar: string;
  seatIndex: number;
  cardCount: number;
  score: number;
  scoreDelta?: number;        // Change in the last round
  isActive: boolean;          // True if in round
  isEliminated: boolean;      // True if cumulative score > 108
  isConnected: boolean;
  isHost: boolean;
}

export interface PlayerPrivate extends PlayerPublic {
  hand: Card[];
  hiddenDrawCards?: Card[];   // Cards drawn during 8 mechanic (only visible to this player!)
}

export interface PenaltyState {
  type: '6' | '7' | 'SPADES_K' | null;
  amount: number;             // Number of cards to draw if not countered
}

export interface RoundResultPlayer {
  id: string;
  nickname: string;
  avatar: string;
  cardCount: number;
  remainingCards?: Card[];
  deltaScore: number;
  previousScore: number;
  newScore: number;
  specialEvent?: '107_RESET' | '108_RESET' | 'ELIMINATED' | 'QUEEN_BONUS_20' | 'QUEEN_BONUS_40';
  isWinner: boolean;
}

export interface RoundResult {
  roundNumber: number;
  winnerId: string;
  winnerNickname: string;
  winningCard?: Card;
  players: RoundResultPlayer[];
  nextStarterId: string;
}

export interface RestartVote {
  initiatorId: string;
  initiatorName: string;
  agreedPlayerIds: string[];
  totalNeeded: number;
}

export interface GameStateView {
  roomId: string;
  phase: GamePhase;
  roundNumber: number;
  players: PlayerPublic[];
  myPlayerId: string;
  myHand: Card[];
  myHiddenDrawCards?: Card[];
  topCard: Card | null;
  activeSuit: Suit | null;     // Effective suit (after Queen or from top card)
  discardPileCount: number;
  discardPileTop: Card[];     // Up to last 4 cards played for visual stacking
  deckCount: number;
  currentTurnPlayerId: string | null;
  penalty: PenaltyState;
  hasDrawnThisTurn: boolean;   // True if active player already drew 1 card during normal turn
  validPlayableCardIds: string[]; // Card IDs that the local player can legally play right now
  canDrawCard: boolean;       // True if local player can draw a card
  canPass: boolean;           // True if local player can pass (after drawing on normal turn)
  canStopEightDraw: boolean;  // True if local player in 8-draw has at least 1 valid card and can stop
  lastActionMessage?: string;
  roundResult?: RoundResult;
  gameWinner?: PlayerPublic;
  isSpectator?: boolean;
  spectatorCount?: number;
  restartVote?: RestartVote | null;
}
