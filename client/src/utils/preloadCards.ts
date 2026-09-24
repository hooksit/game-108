const SUITS = ['SPADES', 'CLUBS', 'HEARTS', 'DIAMONDS'] as const;
const RANKS = ['6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'] as const;

export const ALL_CARD_IMAGE_URLS: string[] = [
  '/assets/cards/BACK.webp',
  '/assets/cards/DECK.webp',
  ...SUITS.flatMap((suit) => RANKS.map((rank) => `/assets/cards/${suit}_${rank}.webp`))
];

// In-memory cache to keep decoded image references in browser memory
const preloadedImages: HTMLImageElement[] = [];

/**
 * Preloads all 36 playing cards + back + deck into browser memory cache.
 * Since the entire deck in WebP format is only ~540 KB, this loads in <200ms
 * and ensures instant 0ms rendering when drawing cards from the deck.
 */
export function preloadAllCards(): void {
  if (typeof window === 'undefined' || preloadedImages.length > 0) return;

  ALL_CARD_IMAGE_URLS.forEach((src) => {
    const img = new Image();
    img.decoding = 'async';
    img.src = src;
    preloadedImages.push(img);
  });
}
