import { Card, Suit, Rank } from '@game-108/shared';

const SUITS: Suit[] = ['HEARTS', 'DIAMONDS', 'CLUBS', 'SPADES'];
const RANKS: Rank[] = ['6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];

export class Deck {
  private cards: Card[] = [];

  constructor() {
    this.reset();
  }

  public reset(): void {
    this.cards = [];
    for (const suit of SUITS) {
      for (const rank of RANKS) {
        this.cards.push({
          id: `${suit}_${rank}`,
          suit,
          rank
        });
      }
    }
  }

  public shuffle(): void {
    for (let i = this.cards.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.cards[i], this.cards[j]] = [this.cards[j], this.cards[i]];
    }
  }

  public draw(): Card | null {
    return this.cards.pop() || null;
  }

  public drawMultiple(count: number): Card[] {
    const drawn: Card[] = [];
    for (let i = 0; i < count; i++) {
      const card = this.draw();
      if (card) {
        drawn.push(card);
      } else {
        break;
      }
    }
    return drawn;
  }

  public recycleDiscard(discardPile: Card[], keepTopCard = true): Card | null {
    if (discardPile.length <= (keepTopCard ? 1 : 0)) {
      return null;
    }

    const topCard = keepTopCard ? discardPile.pop()! : null;
    const cardsToRecycle = [...discardPile];
    discardPile.length = 0;
    if (topCard) {
      discardPile.push(topCard);
    }

    this.cards.push(...cardsToRecycle);
    this.shuffle();

    return topCard;
  }

  public remaining(): number {
    return this.cards.length;
  }

  public addCards(cards: Card[], shuffle = true): void {
    if (!cards || cards.length === 0) return;
    this.cards.push(...cards);
    if (shuffle) {
      this.shuffle();
    }
  }

  public setCards(cards: Card[]): void {
    this.cards = [...cards];
  }

  public getCards(): Card[] {
    return [...this.cards];
  }
}
