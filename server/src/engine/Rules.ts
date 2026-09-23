import { Card, Suit, Rank, PenaltyState } from '@game-108/shared';

export class Rules {
  /**
   * Checks if a card is legally playable given the current top card, active suit, and penalty state.
   */
  public static isValidMove(
    card: Card,
    topCard: Card | null,
    activeSuit: Suit | null,
    penalty: PenaltyState
  ): boolean {
    // 1. If penalty is active, strict countering rules apply
    if (penalty.amount > 0 && penalty.type !== null) {
      if (penalty.type === '6') {
        // Can ONLY be countered by another 6 (any suit)
        return card.rank === '6';
      }
      if (penalty.type === '7') {
        // Can ONLY be countered by another 7 (any suit)
        return card.rank === '7';
      }
      if (penalty.type === 'SPADES_K') {
        // King of spades cannot be countered by any card
        return false;
      }
    }

    // 2. If table is empty
    if (!topCard) {
      return true;
    }

    // 3. Special condition: Top card is an 8
    // If the top card is an 8 (and not yet resolved), the player MUST match the 8's suit
    // (A Queen is not allowed to beat an 8 according to Section 14: "Главное условие — масть текущей восьмёрки")
    if (topCard.rank === '8' && activeSuit !== null) {
      return card.suit === activeSuit;
    }

    // 4. Queen is universal and beats any normal card
    if (card.rank === 'Q') {
      return true;
    }

    // 5. Normal match by effective suit or rank
    const targetSuit = activeSuit || topCard.suit;
    return card.suit === targetSuit || card.rank === topCard.rank;
  }

  /**
   * Get all playable cards in a hand.
   */
  public static getPlayableCards(
    hand: Card[],
    topCard: Card | null,
    activeSuit: Suit | null,
    penalty: PenaltyState
  ): Card[] {
    return hand.filter(card => this.isValidMove(card, topCard, activeSuit, penalty));
  }
}
