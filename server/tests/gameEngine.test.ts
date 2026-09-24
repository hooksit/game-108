import { describe, it, expect, beforeEach } from 'vitest';
import { GameSession } from '../src/engine/GameSession';
import { Card, Suit, Rank, processScore108 } from '@game-108/shared';

describe('Game 108 Engine Comprehensive Test Suite', () => {
  let session: GameSession;

  beforeEach(() => {
    session = new GameSession('test_room');
    session.addPlayer('p1', 'Player 1');
    session.addPlayer('p2', 'Player 2');
    session.addPlayer('p3', 'Player 3');
  });

  it('1. Normal suit match: allows same suit card', () => {
    session.startMatch();
    session.phase = 'PLAYER_TURN';
    session.currentTurnIndex = 0;
    session.discardPile = [{ id: 'HEARTS_9', suit: 'HEARTS', rank: '9' }];
    session.activeSuit = 'HEARTS';
    session.penalty = { type: null, amount: 0 };
    session.players[0].hand = [
      { id: 'HEARTS_10', suit: 'HEARTS', rank: '10' },
      { id: 'CLUBS_7', suit: 'CLUBS', rank: '7' }
    ];

    const res = session.playCard('p1', 'HEARTS_10');
    expect(res.success).toBe(true);
    expect(session.getTopCard()?.id).toBe('HEARTS_10');
  });

  it('2. Normal rank match: allows same rank of different suit', () => {
    session.startMatch();
    session.phase = 'PLAYER_TURN';
    session.currentTurnIndex = 0;
    session.discardPile = [{ id: 'HEARTS_9', suit: 'HEARTS', rank: '9' }];
    session.activeSuit = 'HEARTS';
    session.penalty = { type: null, amount: 0 };
    session.players[0].hand = [
      { id: 'SPADES_9', suit: 'SPADES', rank: '9' },
      { id: 'CLUBS_7', suit: 'CLUBS', rank: '7' }
    ];

    const res = session.playCard('p1', 'SPADES_9');
    expect(res.success).toBe(true);
    expect(session.getTopCard()?.id).toBe('SPADES_9');
    expect(session.activeSuit).toBe('SPADES');
  });

  it('3. Queen: universal beat on any normal card and requests suit selection', () => {
    session.startMatch();
    session.phase = 'PLAYER_TURN';
    session.currentTurnIndex = 0;
    session.discardPile = [{ id: 'CLUBS_7', suit: 'CLUBS', rank: '7' }];
    session.activeSuit = 'CLUBS';
    session.penalty = { type: null, amount: 0 };
    session.players[0].hand = [
      { id: 'DIAMONDS_Q', suit: 'DIAMONDS', rank: 'Q' },
      { id: 'SPADES_6', suit: 'SPADES', rank: '6' }
    ];

    const res = session.playCard('p1', 'DIAMONDS_Q');
    expect(res.success).toBe(true);
    expect(session.phase).toBe('QUEEN_SUIT_SELECTION');

    // 4. Queen suit selection: sets declared suit and advances turn
    const suitRes = session.selectQueenSuit('p1', 'HEARTS');
    expect(suitRes.success).toBe(true);
    expect(session.activeSuit).toBe('HEARTS');
    expect(session.phase).toBe('PLAYER_TURN');
    expect(session.currentTurnIndex).toBe(1); // Turn advanced to p2
  });

  it('5. Ace: skips the next player', () => {
    session.startMatch();
    session.phase = 'PLAYER_TURN';
    session.currentTurnIndex = 0; // p1's turn
    session.discardPile = [{ id: 'SPADES_10', suit: 'SPADES', rank: '10' }];
    session.activeSuit = 'SPADES';
    session.penalty = { type: null, amount: 0 };
    session.players[0].hand = [
      { id: 'SPADES_A', suit: 'SPADES', rank: 'A' },
      { id: 'HEARTS_6', suit: 'HEARTS', rank: '6' }
    ];

    const res = session.playCard('p1', 'SPADES_A');
    expect(res.success).toBe(true);
    expect(session.currentTurnIndex).toBe(2);
  });

  it('6. Six (6) penalty chain: +1, +2 and countered only by 6', () => {
    session.startMatch();
    session.phase = 'PLAYER_TURN';
    session.currentTurnIndex = 0;
    session.discardPile = [{ id: 'HEARTS_10', suit: 'HEARTS', rank: '10' }];
    session.activeSuit = 'HEARTS';
    session.penalty = { type: null, amount: 0 };
    session.players[0].hand = [
      { id: 'HEARTS_6', suit: 'HEARTS', rank: '6' },
      { id: 'HEARTS_7', suit: 'HEARTS', rank: '7' }
    ];
    session.players[1].hand = [
      { id: 'SPADES_6', suit: 'SPADES', rank: '6' },
      { id: 'CLUBS_9', suit: 'CLUBS', rank: '9' }
    ];

    // p1 plays 6
    session.playCard('p1', 'HEARTS_6');
    expect(session.penalty.type).toBe('6');
    expect(session.penalty.amount).toBe(1);
    expect(session.currentTurnIndex).toBe(1);

    // p2 cannot play non-6 card
    const invalidPlay = session.playCard('p2', 'CLUBS_9');
    expect(invalidPlay.success).toBe(false);

    // p2 counters with SPADES_6
    const counterPlay = session.playCard('p2', 'SPADES_6');
    expect(counterPlay.success).toBe(true);
    expect(session.penalty.amount).toBe(2);
    expect(session.currentTurnIndex).toBe(2); // p3's turn
  });

  it('7. Seven (7) penalty chain: +2, +4 and countered only by 7', () => {
    session.startMatch();
    session.phase = 'PLAYER_TURN';
    session.currentTurnIndex = 0;
    session.discardPile = [{ id: 'DIAMONDS_8', suit: 'DIAMONDS', rank: '8' }];
    session.activeSuit = 'DIAMONDS';
    session.penalty = { type: null, amount: 0 };
    session.players[0].hand = [
      { id: 'DIAMONDS_7', suit: 'DIAMONDS', rank: '7' },
      { id: 'HEARTS_9', suit: 'HEARTS', rank: '9' }
    ];
    session.players[1].hand = [
      { id: 'CLUBS_7', suit: 'CLUBS', rank: '7' },
      { id: 'SPADES_8', suit: 'SPADES', rank: '8' }
    ];

    // p1 plays 7
    session.playCard('p1', 'DIAMONDS_7');
    expect(session.penalty.type).toBe('7');
    expect(session.penalty.amount).toBe(2);

    // p2 counters with CLUBS_7
    session.playCard('p2', 'CLUBS_7');
    expect(session.penalty.type).toBe('7');
    expect(session.penalty.amount).toBe(4);
    expect(session.currentTurnIndex).toBe(2); // p3
  });

  it('8. King of Spades (♠K): creates +5 penalty that cannot be countered', () => {
    session.startMatch();
    session.phase = 'PLAYER_TURN';
    session.currentTurnIndex = 0;
    session.discardPile = [{ id: 'SPADES_9', suit: 'SPADES', rank: '9' }];
    session.activeSuit = 'SPADES';
    session.penalty = { type: null, amount: 0 };
    session.players[0].hand = [
      { id: 'SPADES_K', suit: 'SPADES', rank: 'K' },
      { id: 'HEARTS_8', suit: 'HEARTS', rank: '8' }
    ];
    session.players[1].hand = [
      { id: 'HEARTS_K', suit: 'HEARTS', rank: 'K' },
      { id: 'CLUBS_K', suit: 'CLUBS', rank: 'K' }
    ];

    // p1 plays ♠K
    session.playCard('p1', 'SPADES_K');
    expect(session.penalty.type).toBe('SPADES_K');
    expect(session.penalty.amount).toBe(5);
    expect(session.currentTurnIndex).toBe(1);

    // p2 tries to play another King -> forbidden!
    const res = session.playCard('p2', 'HEARTS_K');
    expect(res.success).toBe(false);

    // p2 draws the penalty cards
    const initialHandLen = session.players[1].hand.length;
    const drawRes = session.drawCard('p2');
    expect(drawRes.success).toBe(true);
    expect(session.players[1].hand.length).toBe(initialHandLen + 5);
    expect(session.penalty.amount).toBe(0);
    expect(session.currentTurnIndex).toBe(2); // Turn ended after taking penalty
  });

  it('9. Eight (8) mechanics: required suit and hidden draw', () => {
    session.startMatch();
    session.phase = 'PLAYER_TURN';
    session.currentTurnIndex = 0;
    session.discardPile = [{ id: 'HEARTS_10', suit: 'HEARTS', rank: '10' }];
    session.activeSuit = 'HEARTS';
    session.penalty = { type: null, amount: 0 };
    session.players[0].hand = [
      { id: 'HEARTS_8', suit: 'HEARTS', rank: '8' },
      { id: 'SPADES_6', suit: 'SPADES', rank: '6' }
    ];
    session.players[1].hand = [
      { id: 'SPADES_10', suit: 'SPADES', rank: '10' } // no hearts
    ];

    // p1 plays HEARTS_8
    session.playCard('p1', 'HEARTS_8');
    expect(session.activeSuit).toBe('HEARTS');
    // It remains p1's turn to cover their own 8!
    expect(session.currentTurnIndex).toBe(0);

    // p1 cannot play SPADES_6 (wrong suit)
    expect(session.playCard('p1', 'SPADES_6').success).toBe(false);

    // p1 initiates draw to cover the 8
    const drawRes = session.drawCard('p1');
    expect(drawRes.success).toBe(true);
    expect(session.phase).toBe('EIGHT_DRAW');

    // p1 draws additional hidden card
    session.eightDraw('p1');
    expect(session.players[0].hiddenDrawCards!.length).toBeGreaterThanOrEqual(1);

    // Give p1 a matching card in hidden cards to test selection, plus extra card so round doesn't end
    session.players[0].hiddenDrawCards!.push({ id: 'HEARTS_9', suit: 'HEARTS', rank: '9' });
    session.players[0].hiddenDrawCards!.push({ id: 'CLUBS_6', suit: 'CLUBS', rank: '6' });

    // p1 stops drawing
    session.eightStop('p1');
    expect(session.phase).toBe('EIGHT_SELECT');

    // p1 selects the HEARTS_9 card to cover the 8
    const selectRes = session.eightSelect('p1', 'HEARTS_9');
    expect(selectRes.success).toBe(true);
    expect(session.getTopCard()?.id).toBe('HEARTS_9');
    expect(session.phase).toBe('PLAYER_TURN');
    expect(session.currentTurnIndex).toBe(1); // Turn now passed to p2!
  });

  it('10. Eight chain: playing a new 8 requires same player to continue with new suit', () => {
    session.startMatch();
    session.phase = 'EIGHT_SELECT';
    session.currentTurnIndex = 1;
    session.penalty = { type: null, amount: 0 };
    session.activeSuit = 'HEARTS';
    session.discardPile = [{ id: 'HEARTS_8', suit: 'HEARTS', rank: '8' }];
    session.players[1].hand = [
      { id: 'CLUBS_8', suit: 'CLUBS', rank: '8' },
      { id: 'CLUBS_10', suit: 'CLUBS', rank: '10' },
      { id: 'SPADES_6', suit: 'SPADES', rank: '6' }
    ];

    // p2 selects CLUBS_8 from accumulated cards
    const res = session.eightSelect('p2', 'CLUBS_8');
    expect(res.success).toBe(true);
    expect(session.activeSuit).toBe('CLUBS');
    expect(session.currentTurnIndex).toBe(1);

    // Now p2 plays CLUBS_10 to finish the chain
    const finishRes = session.playCard('p2', 'CLUBS_10');
    expect(finishRes.success).toBe(true);
    expect(session.currentTurnIndex).toBe(2);
  });

  it('11. Winning round with Queen: grants -20 points (or -40 for ♠Q)', () => {
    session.startMatch();
    session.phase = 'PLAYER_TURN';
    session.currentTurnIndex = 0;
    session.discardPile = [{ id: 'HEARTS_10', suit: 'HEARTS', rank: '10' }];
    session.activeSuit = 'HEARTS';
    session.penalty = { type: null, amount: 0 };
    session.players[0].hand = [{ id: 'HEARTS_Q', suit: 'HEARTS', rank: 'Q' }];
    session.players[1].hand = [{ id: 'HEARTS_6', suit: 'HEARTS', rank: '6' }];
    session.players[2].hand = [{ id: 'HEARTS_A', suit: 'HEARTS', rank: 'A' }];

    session.playCard('p1', 'HEARTS_Q');
    expect(session.phase).toBe('ROUND_END');
    expect(session.players[0].score).toBe(-20);
    expect(session.players[1].score).toBe(6);
    expect(session.players[2].score).toBe(11);
  });

  it('12. Winning round with Spades Queen (♠Q): grants -40 points', () => {
    session.startMatch();
    session.phase = 'PLAYER_TURN';
    session.currentTurnIndex = 0;
    session.discardPile = [{ id: 'SPADES_10', suit: 'SPADES', rank: '10' }];
    session.activeSuit = 'SPADES';
    session.penalty = { type: null, amount: 0 };
    session.players[0].hand = [{ id: 'SPADES_Q', suit: 'SPADES', rank: 'Q' }];
    session.players[1].hand = [{ id: 'CLUBS_6', suit: 'CLUBS', rank: '6' }];

    session.playCard('p1', 'SPADES_Q');
    expect(session.phase).toBe('ROUND_END');
    expect(session.players[0].score).toBe(-40);
  });

  it('13. 108 System: 107 resets to 53, 108 resets to 0, >108 eliminates player', () => {
    expect(processScore108(107)).toEqual({ newScore: 53, isEliminated: false, specialEvent: '107_RESET' });
    expect(processScore108(108)).toEqual({ newScore: 0, isEliminated: false, specialEvent: '108_RESET' });
    expect(processScore108(109)).toEqual({ newScore: 109, isEliminated: true, specialEvent: 'ELIMINATED' });
    expect(processScore108(50)).toEqual({ newScore: 50, isEliminated: false });
  });

  it('14. Deal sizes: 4 cards for 3+ players, 6 cards for 2 remaining players', () => {
    // Spy on deck.draw to return a non-penalty card as starting card
    const origDraw = session.deck.draw.bind(session.deck);
    session.deck.draw = () => ({ id: 'HEARTS_9', suit: 'HEARTS', rank: '9' });

    session.startMatch();
    expect(session.players[0].hand.length).toBe(4);
    expect(session.players[1].hand.length).toBe(4);
    expect(session.players[2].hand.length).toBe(4);

    // Eliminate p3
    session.players[2].isEliminated = true;
    session.players[2].isActive = false;

    // Start round with 2 players
    session.startNewRound(false);
    expect(session.players[0].hand.length).toBe(6);
    expect(session.players[1].hand.length).toBe(6);

    session.deck.draw = origDraw;
  });

  it('15. Next round starter: next active player clockwise after highest scorer', () => {
    session.startMatch();
    session.discardPile = [{ id: 'HEARTS_9', suit: 'HEARTS', rank: '9' }];
    session.activeSuit = 'HEARTS';

    session.players[0].score = 10;
    session.players[1].score = 25; // Highest scorer
    session.players[2].score = 5;

    const highestScorer = [...session.getActivePlayers()].sort((a, b) => b.score - a.score)[0];
    const starterIndex = session.getNextActiveSeatIndex(highestScorer.seatIndex);
    expect(starterIndex).toBe(2);
  });

  it('16. Starter special card: 6 causes starter to counter or draw 1 card', () => {
    session.startMatch();
    session.currentTurnIndex = 0;
    session.players[0].hand = [{ id: 'HEARTS_10', suit: 'HEARTS', rank: '10' }];
    session.players[1].hand = [{ id: 'HEARTS_9', suit: 'HEARTS', rank: '9' }];

    const startCard: Card = { id: 'CLUBS_6', suit: 'CLUBS', rank: '6' };
    session.discardPile = [startCard];
    session.penalty = { type: null, amount: 0 };
    (session as any).applyStartingCardEffect(startCard, session.players[0]);

    // Starter p1 receives penalty of 1 card, can counter or draw
    expect(session.penalty.type).toBe('6');
    expect(session.penalty.amount).toBe(1);
    expect(session.currentTurnIndex).toBe(0);

    // Starter draws 1 card
    session.drawCard('p1');
    expect(session.players[0].hand.length).toBe(2);
    expect(session.penalty.amount).toBe(0);
    // Turn advanced to p2
    expect(session.currentTurnIndex).toBe(1);
  });

  it('17. Starter special card: Ace causes starter to skip turn', () => {
    session.startMatch();
    session.currentTurnIndex = 0;

    const startCard: Card = { id: 'HEARTS_A', suit: 'HEARTS', rank: 'A' };
    session.discardPile = [startCard];
    (session as any).applyStartingCardEffect(startCard);

    // Starter p1 skipped, turn went to p2
    expect(session.currentTurnIndex).toBe(1);
  });

  it('18. Starter special card: ♠K causes starter to draw 5 cards and passes turn', () => {
    session.startMatch();
    session.currentTurnIndex = 0;
    const initialCount = session.players[0].hand.length;

    const startCard: Card = { id: 'SPADES_K', suit: 'SPADES', rank: 'K' };
    session.discardPile = [startCard];
    (session as any).applyStartingCardEffect(startCard);

    // Starter p1 drew 5 cards
    expect(session.players[0].hand.length).toBe(initialCount + 5);
    // Turn passed to p2
    expect(session.currentTurnIndex).toBe(1);
  });

  it('19. Countering 8 directly: another 8 of different suit or Queen is valid', () => {
    session.startMatch();
    session.phase = 'PLAYER_TURN';
    session.currentTurnIndex = 0;
    session.discardPile = [{ id: 'DIAMONDS_8', suit: 'DIAMONDS', rank: '8' }];
    session.activeSuit = 'DIAMONDS';
    session.penalty = { type: null, amount: 0 };
    session.players[0].hand = [
      { id: 'HEARTS_8', suit: 'HEARTS', rank: '8' },
      { id: 'CLUBS_Q', suit: 'CLUBS', rank: 'Q' },
      { id: 'SPADES_10', suit: 'SPADES', rank: '10' }
    ];

    // Playing another 8 of different suit (HEARTS_8 on DIAMONDS_8) is allowed!
    const res8 = session.playCard('p1', 'HEARTS_8');
    expect(res8.success).toBe(true);
    expect(session.activeSuit).toBe('HEARTS');
    expect(session.currentTurnIndex).toBe(0); // Still p1's turn to cover!

    // p1 can immediately cover their 8 with a Queen!
    const resQ = session.playCard('p1', 'CLUBS_Q');
    expect(resQ.success).toBe(true);
    expect(session.phase).toBe('QUEEN_SUIT_SELECTION');
  });

  it('20. Player disconnect during game: hand and hidden cards are returned to deck', () => {
    session.startMatch();
    const initialDeckCount = session.deck.remaining();
    const p2CardCount = session.players[1].hand.length;

    session.removePlayer('p2');
    expect(session.players[1].isConnected).toBe(false);
    expect(session.players[1].isEliminated).toBe(true);
    expect(session.players[1].hand.length).toBe(0);
    // Cards returned to deck
    expect(session.deck.remaining()).toBe(initialDeckCount + p2CardCount);
  });

  it('21. Winning with Spades King (♠K): next player draws 5 cards and scores them', () => {
    session.startMatch();
    session.phase = 'PLAYER_TURN';
    session.currentTurnIndex = 0;
    session.discardPile = [{ id: 'SPADES_9', suit: 'SPADES', rank: '9' }];
    session.activeSuit = 'SPADES';
    session.penalty = { type: null, amount: 0 };
    session.players[0].hand = [{ id: 'SPADES_K', suit: 'SPADES', rank: 'K' }];

    // p2 has 1 card worth 10 points
    session.players[1].hand = [{ id: 'HEARTS_10', suit: 'HEARTS', rank: '10' }];
    session.players[1].score = 0;

    const res = session.playCard('p1', 'SPADES_K');
    expect(res.success).toBe(true);
    expect(session.phase).toBe('ROUND_END');
    // p2 should have received 5 extra cards from the deck (total 6 cards)
    expect(session.players[1].hand.length).toBe(6);
    // Score should be 10 + sum of 5 drawn cards (> 10)
    expect(session.players[1].score).toBeGreaterThan(10);
  });

  it('22. Winning with 6 or 7: next player draws 1 or 2 cards and scores them', () => {
    session.startMatch();
    session.phase = 'PLAYER_TURN';
    session.currentTurnIndex = 0;
    session.discardPile = [{ id: 'CLUBS_9', suit: 'CLUBS', rank: '9' }];
    session.activeSuit = 'CLUBS';
    session.penalty = { type: null, amount: 0 };
    session.players[0].hand = [{ id: 'CLUBS_6', suit: 'CLUBS', rank: '6' }];

    session.players[1].hand = [{ id: 'DIAMONDS_J', suit: 'DIAMONDS', rank: 'J' }]; // 2 points
    session.players[1].score = 0;

    const res = session.playCard('p1', 'CLUBS_6');
    expect(res.success).toBe(true);
    expect(session.phase).toBe('ROUND_END');
    // p2 gets 1 extra card (total 2 cards)
    expect(session.players[1].hand.length).toBe(2);
    expect(session.players[1].score).toBeGreaterThan(2);
    // penaltyInfo is populated with victim cards
    expect(session.roundResult?.penaltyInfo).toBeDefined();
    expect(session.roundResult?.penaltyInfo?.victimId).toBe('p2');
    expect(session.roundResult?.penaltyInfo?.cards.length).toBe(1);
  });

  it('23. Spectator mode: spectator receives sanitized state and cannot make moves', () => {
    session.startMatch();
    session.addSpectator('spec1', 'Наблюдатель', 'zara');

    const view = session.getPlayerView('spec1');
    expect(view.isSpectator).toBe(true);
    expect(view.myHand.length).toBe(0);
    expect(view.canDrawCard).toBe(false);
    expect(view.canPass).toBe(false);
  });

  it('24. Restart vote: requires all players to agree, resets to lobby, and sets initiator as host', () => {
    session.startMatch();
    session.addSpectator('spec1', 'Зритель 1', 'zara');

    // p1 proposes restart
    const propRes = session.proposeRestart('p1');
    expect(propRes.success).toBe(true);
    expect(session.restartVote).not.toBeNull();
    expect(session.restartVote?.agreedPlayerIds).toContain('p1');

    // p2 votes to agree
    const voteRes = session.voteRestart('p2');
    expect(voteRes.success).toBe(true);
    expect(session.phase).toBe('PLAYER_TURN'); // Still waiting for p3

    // p3 votes to agree
    const voteRes3 = session.voteRestart('p3');
    expect(voteRes3.success).toBe(true);

    // All agreed -> game reset to LOBBY!
    expect(session.phase).toBe('LOBBY');
    expect(session.restartVote).toBeNull();
    expect(session.players.find(p => p.id === 'p1')?.isHost).toBe(true);
    // Spectator is moved into players list for the next game!
    expect(session.players.some(p => p.id === 'spec1')).toBe(true);
  });

  it('25. Starter 7 can be countered with 7; Winning with ♠K records penaltyInfo with 5 cards', () => {
    session.startMatch();
    session.currentTurnIndex = 0;
    session.players[0].hand = [
      { id: 'HEARTS_7', suit: 'HEARTS', rank: '7' },
      { id: 'HEARTS_10', suit: 'HEARTS', rank: '10' }
    ];
    session.players[1].hand = [
      { id: 'CLUBS_9', suit: 'CLUBS', rank: '9' }
    ];

    const startCard: Card = { id: 'CLUBS_7', suit: 'CLUBS', rank: '7' };
    session.discardPile = [startCard];
    session.penalty = { type: null, amount: 0 };
    (session as any).applyStartingCardEffect(startCard, session.players[0]);

    // Starter p1 counters with HEARTS_7
    expect(session.penalty.amount).toBe(2);
    const counterRes = session.playCard('p1', 'HEARTS_7');
    expect(counterRes.success).toBe(true);
    // Penalty stacked to 4 cards, passed to p2
    expect(session.penalty.amount).toBe(4);
    expect(session.currentTurnIndex).toBe(1);

    // Now test winning with ♠K
    session.phase = 'PLAYER_TURN';
    session.currentTurnIndex = 0;
    session.players[0].hand = [{ id: 'SPADES_K', suit: 'SPADES', rank: 'K' }];
    session.players[1].hand = [{ id: 'CLUBS_9', suit: 'CLUBS', rank: '9' }];
    session.discardPile = [{ id: 'SPADES_9', suit: 'SPADES', rank: '9' }];
    session.activeSuit = 'SPADES';
    session.penalty = { type: null, amount: 0 };

    const winRes = session.playCard('p1', 'SPADES_K');
    expect(winRes.success).toBe(true);
    expect(session.phase).toBe('ROUND_END');
    expect(session.roundResult?.penaltyInfo).toBeDefined();
    expect(session.roundResult?.penaltyInfo?.attackCard.id).toBe('SPADES_K');
    expect(session.roundResult?.penaltyInfo?.victimId).toBe('p2');
    expect(session.roundResult?.penaltyInfo?.cards.length).toBe(5);
  });
});
