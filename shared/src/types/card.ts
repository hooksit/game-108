export type Suit = 'HEARTS' | 'DIAMONDS' | 'CLUBS' | 'SPADES';

export type Rank = '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K' | 'A';

export interface Card {
  id: string; // e.g. "HEARTS_Q"
  suit: Suit;
  rank: Rank;
}

export const SUIT_NAMES: Record<Suit, string> = {
  HEARTS: 'Червы',
  DIAMONDS: 'Бубны',
  CLUBS: 'Трефы',
  SPADES: 'Пики'
};

export const SUIT_SYMBOLS: Record<Suit, string> = {
  HEARTS: '♥',
  DIAMONDS: '♦',
  CLUBS: '♣',
  SPADES: '♠'
};

export const SUIT_COLORS: Record<Suit, 'red' | 'black'> = {
  HEARTS: 'red',
  DIAMONDS: 'red',
  CLUBS: 'black',
  SPADES: 'black'
};

// Points in remaining hand at the end of round
export const CARD_SCORES: Record<Rank, number> = {
  'J': 2,
  'Q': 3,
  'K': 4,
  '6': 6,
  '7': 7,
  '8': 8,
  '9': 9,
  '10': 10,
  'A': 11
};
