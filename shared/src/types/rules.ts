import { Card, Suit, Rank, CARD_SCORES } from './card.js';

export const MAX_PLAYERS = 6;
export const MIN_PLAYERS = 2;
export const INITIAL_HAND_SIZE = 4;
export const TWO_PLAYERS_HAND_SIZE = 6;

export const ELIMINATION_SCORE = 108;
export const TARGET_107 = 107;
export const TARGET_108 = 108;
export const RESET_107_TO = 53;
export const RESET_108_TO = 0;

export const QUEEN_WIN_BONUS = -20;
export const SPADES_QUEEN_WIN_BONUS = -40;

/**
 * Calculates sum of card scores in a player's hand.
 */
export function calculateHandScore(hand: Card[]): number {
  return hand.reduce((sum, card) => sum + (CARD_SCORES[card.rank] || 0), 0);
}

/**
 * Applies the 108 system rules to a player's cumulative score:
 * - If score == 107 -> 53
 * - If score == 108 -> 0
 * - If score > 108 -> eliminated
 */
export function processScore108(score: number): {
  newScore: number;
  isEliminated: boolean;
  specialEvent?: '107_RESET' | '108_RESET' | 'ELIMINATED';
} {
  if (score === TARGET_107) {
    return {
      newScore: RESET_107_TO,
      isEliminated: false,
      specialEvent: '107_RESET'
    };
  }

  if (score === TARGET_108) {
    return {
      newScore: RESET_108_TO,
      isEliminated: false,
      specialEvent: '108_RESET'
    };
  }

  if (score > ELIMINATION_SCORE) {
    return {
      newScore: score,
      isEliminated: true,
      specialEvent: 'ELIMINATED'
    };
  }

  return {
    newScore: score,
    isEliminated: false
  };
}
