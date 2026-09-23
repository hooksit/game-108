import {
  Card,
  Suit,
  Rank,
  GamePhase,
  PlayerPublic,
  PlayerPrivate,
  PenaltyState,
  RoundResult,
  RoundResultPlayer,
  GameStateView,
  MAX_PLAYERS,
  MIN_PLAYERS,
  INITIAL_HAND_SIZE,
  TWO_PLAYERS_HAND_SIZE,
  QUEEN_WIN_BONUS,
  SPADES_QUEEN_WIN_BONUS,
  calculateHandScore,
  processScore108
} from '@game-108/shared';
import { Deck } from './Deck';
import { Rules } from './Rules';

export class GameSession {
  public readonly id: string;
  public phase: GamePhase = 'LOBBY';
  public roundNumber: number = 0;
  public players: PlayerPrivate[] = [];
  public currentTurnIndex: number = 0;
  public deck: Deck;
  public discardPile: Card[] = [];
  public activeSuit: Suit | null = null;
  public penalty: PenaltyState = { type: null, amount: 0 };
  public hasDrawnThisTurn: boolean = false;
  public lastWinningCard: Card | null = null;
  public roundResult?: RoundResult;
  public gameWinner?: PlayerPublic;
  public lastActionMessage?: string;

  constructor(id: string) {
    this.id = id;
    this.deck = new Deck();
  }

  // --- Player Management ---

  public addPlayer(id: string, nickname: string, avatar: string = 'player'): boolean {
    if (this.phase !== 'LOBBY') {
      return false;
    }
    if (this.players.length >= MAX_PLAYERS) {
      return false;
    }
    if (this.players.some(p => p.id === id)) {
      return false;
    }

    const newPlayer: PlayerPrivate = {
      id,
      nickname,
      avatar,
      seatIndex: this.players.length,
      cardCount: 0,
      score: 0,
      isActive: true,
      isEliminated: false,
      isConnected: true,
      isHost: this.players.length === 0,
      hand: [],
      hiddenDrawCards: []
    };

    this.players.push(newPlayer);
    return true;
  }

  public removePlayer(id: string): void {
    const idx = this.players.findIndex(p => p.id === id);
    if (idx === -1) return;

    if (this.phase === 'LOBBY') {
      this.players.splice(idx, 1);
      // Re-assign seat indices and host
      this.players.forEach((p, i) => {
        p.seatIndex = i;
        p.isHost = i === 0;
      });
    } else {
      const disconnectedPlayer = this.players[idx];
      disconnectedPlayer.isConnected = false;
      disconnectedPlayer.isActive = false;
      disconnectedPlayer.isEliminated = true;
      this.lastActionMessage = `${disconnectedPlayer.nickname} потерял связь и выбыл из игры.`;

      // If it was this player's turn, advance turn to the next active player
      if (this.currentTurnIndex === disconnectedPlayer.seatIndex) {
        this.advanceTurn();
      }

      this.checkGameCompletion();
    }
  }

  public getActivePlayers(): PlayerPrivate[] {
    return this.players.filter(p => !p.isEliminated && p.isActive);
  }

  public getCurrentPlayer(): PlayerPrivate | null {
    const active = this.getActivePlayers();
    if (active.length === 0) return null;
    return this.players[this.currentTurnIndex] || null;
  }

  // --- Round & Match Flow ---

  public startMatch(): boolean {
    if (this.players.length < MIN_PLAYERS || this.phase !== 'LOBBY') {
      return false;
    }
    this.roundNumber = 0;
    this.players.forEach(p => {
      p.score = 0;
      p.isEliminated = false;
      p.isActive = true;
    });
    this.startNewRound(true);
    return true;
  }

  public startNewRound(isFirstRound: boolean = false): void {
    const activePlayers = this.getActivePlayers();
    if (activePlayers.length < 2) {
      this.checkGameCompletion();
      return;
    }

    this.roundNumber++;
    this.deck.reset();
    this.deck.shuffle();
    this.discardPile = [];
    this.penalty = { type: null, amount: 0 };
    this.hasDrawnThisTurn = false;
    this.activeSuit = null;
    this.lastWinningCard = null;
    this.roundResult = undefined;

    // Hand size: 6 if 2 players remaining, 4 otherwise
    const handSize = activePlayers.length === 2 ? TWO_PLAYERS_HAND_SIZE : INITIAL_HAND_SIZE;

    // Deal cards to active players
    for (const player of activePlayers) {
      player.hand = this.deck.drawMultiple(handSize);
      player.cardCount = player.hand.length;
      player.hiddenDrawCards = [];
    }

    // Determine starter
    if (isFirstRound) {
      // First round: random active player
      const randActive = activePlayers[Math.floor(Math.random() * activePlayers.length)];
      this.currentTurnIndex = randActive.seatIndex;
    } else {
      // Subsequent rounds: find player with max score among active players.
      // Starter is next active player clockwise after max scorer.
      const highestScorer = [...activePlayers].sort((a, b) => b.score - a.score)[0];
      this.currentTurnIndex = this.getNextActiveSeatIndex(highestScorer.seatIndex);
    }

    // Draw first card from deck to discard pile
    let startCard = this.deck.draw();
    if (!startCard) {
      this.deck.reset();
      this.deck.shuffle();
      startCard = this.deck.draw()!;
    }
    this.discardPile.push(startCard);
    this.activeSuit = startCard.suit;

    this.phase = 'PLAYER_TURN';
    this.applyStartingCardEffect(startCard);
  }

  private applyStartingCardEffect(card: Card): void {
    const starter = this.getCurrentPlayer();
    if (!starter) return;

    if (card.rank === '6') {
      // Starting player draws 1 card, passes to next
      const drawn = this.drawFromDeckSafe(1);
      starter.hand.push(...drawn);
      starter.cardCount = starter.hand.length;
      this.lastActionMessage = `Стартовая 6: ${starter.nickname} берет 1 карту.`;
      this.advanceTurn();
    } else if (card.rank === '7') {
      // Starting player draws 2 cards, passes to next
      const drawn = this.drawFromDeckSafe(2);
      starter.hand.push(...drawn);
      starter.cardCount = starter.hand.length;
      this.lastActionMessage = `Стартовая 7: ${starter.nickname} берет 2 карты.`;
      this.advanceTurn();
    } else if (card.rank === 'A') {
      // Starting player skips turn
      this.lastActionMessage = `Стартовый Туз: ${starter.nickname} пропускает ход.`;
      this.advanceTurn();
    } else if (card.suit === 'SPADES' && card.rank === 'K') {
      // Starting player draws 5 cards, passes to next
      const drawn = this.drawFromDeckSafe(5);
      starter.hand.push(...drawn);
      starter.cardCount = starter.hand.length;
      this.lastActionMessage = `Стартовый ♠K: ${starter.nickname} берет 5 карт.`;
      this.advanceTurn();
    } else if (card.rank === '8') {
      // Starting player handles 8 mechanic
      this.lastActionMessage = `Стартовая 8: ${starter.nickname} должен ходить по масти ${this.activeSuit}.`;
      // If starter has matching card, they can play or draw. If not, eight draw
    } else if (card.rank === 'Q') {
      // Queen sits on top, must match printed suit or another Queen
      this.activeSuit = card.suit;
      this.lastActionMessage = `Стартовая Дама: ход по масти ${this.activeSuit} или любая Дама.`;
    } else {
      this.lastActionMessage = `Начало раунда ${this.roundNumber}. Первый ход: ${starter.nickname}.`;
    }
  }

  // --- Turn Actions ---

  public playCard(playerId: string, cardId: string): { success: boolean; error?: string } {
    const player = this.getCurrentPlayer();
    if (!player || player.id !== playerId) {
      return { success: false, error: 'Сейчас не ваш ход' };
    }

    if (this.phase !== 'PLAYER_TURN' && this.phase !== 'EIGHT_SELECT') {
      return { success: false, error: 'Недопустимое действие для текущей фазы' };
    }

    const cardIndex = player.hand.findIndex(c => c.id === cardId);
    if (cardIndex === -1) {
      return { success: false, error: 'Карта отсутствует в руке' };
    }

    const card = player.hand[cardIndex];
    const topCard = this.getTopCard();

    // Check legality of move
    if (!Rules.isValidMove(card, topCard, this.activeSuit, this.penalty)) {
      return { success: false, error: 'Эту карту нельзя сыграть по правилам' };
    }

    // Remove from hand and add to discard
    player.hand.splice(cardIndex, 1);
    player.cardCount = player.hand.length;
    this.discardPile.push(card);
    this.hasDrawnThisTurn = false;

    // Check if player won the round with this card
    if (player.hand.length === 0) {
      this.handleRoundVictory(player, card);
      return { success: true };
    }

    // Process card special mechanics
    if (card.rank === 'Q') {
      // Enter queen suit selection
      this.phase = 'QUEEN_SUIT_SELECTION';
      this.lastActionMessage = `${player.nickname} сыграл Даму и выбирает масть.`;
      return { success: true };
    }

    if (card.rank === '6') {
      this.penalty.type = '6';
      this.penalty.amount += 1;
      this.activeSuit = card.suit;
      this.lastActionMessage = `${player.nickname} сыграл 6. Штраф: +${this.penalty.amount} карт.`;
      this.advanceTurn();
      return { success: true };
    }

    if (card.rank === '7') {
      this.penalty.type = '7';
      this.penalty.amount += 2;
      this.activeSuit = card.suit;
      this.lastActionMessage = `${player.nickname} сыграл 7. Штраф: +${this.penalty.amount} карт.`;
      this.advanceTurn();
      return { success: true };
    }

    if (card.suit === 'SPADES' && card.rank === 'K') {
      this.penalty.type = 'SPADES_K';
      this.penalty.amount = 5;
      this.activeSuit = card.suit;
      this.lastActionMessage = `${player.nickname} сыграл ♠K! Следующий игрок получает +5 карт.`;
      this.advanceTurn();
      return { success: true };
    }

    if (card.rank === 'A') {
      // Skip next player
      this.activeSuit = card.suit;
      const skippedPlayer = this.getPlayerAtNextActiveSeat(this.currentTurnIndex);
      this.lastActionMessage = `${player.nickname} сыграл Туз! ${skippedPlayer?.nickname || ''} пропускает ход.`;
      // Advance by 2 active seats
      this.advanceTurn(2);
      return { success: true };
    }

    if (card.rank === '8') {
      this.activeSuit = card.suit;
      this.lastActionMessage = `${player.nickname} сыграл 8. Следующий игрок ходит по масти ${this.activeSuit}.`;
      this.advanceTurn();
      return { success: true };
    }

    // Normal card
    this.activeSuit = card.suit;
    this.lastActionMessage = `${player.nickname} сыграл ${card.rank}.`;
    this.advanceTurn();
    return { success: true };
  }

  public drawCard(playerId: string): { success: boolean; error?: string } {
    const player = this.getCurrentPlayer();
    if (!player || player.id !== playerId) {
      return { success: false, error: 'Сейчас не ваш ход' };
    }

    if (this.phase !== 'PLAYER_TURN') {
      return { success: false, error: 'Нельзя взять карту в текущей фазе' };
    }

    // 1. If penalty is active
    if (this.penalty.amount > 0 && this.penalty.type !== null) {
      const drawn = this.drawFromDeckSafe(this.penalty.amount);
      player.hand.push(...drawn);
      player.cardCount = player.hand.length;
      this.lastActionMessage = `${player.nickname} забирает штраф (+${this.penalty.amount} карт).`;
      this.penalty = { type: null, amount: 0 };
      this.advanceTurn();
      return { success: true };
    }

    // 2. If top card is an 8 and player wants to start 8-draw
    const topCard = this.getTopCard();
    if (topCard?.rank === '8') {
      return this.startEightDraw(player);
    }

    // 3. Normal draw: can draw only once per turn
    if (this.hasDrawnThisTurn) {
      return { success: false, error: 'Вы уже взяли карту в этом ходу. Сыграйте или нажмите Пас' };
    }

    const drawn = this.drawFromDeckSafe(1);
    if (drawn.length > 0) {
      player.hand.push(...drawn);
      player.cardCount = player.hand.length;
      this.hasDrawnThisTurn = true;
      this.lastActionMessage = `${player.nickname} берет 1 карту из колоды.`;
    } else {
      this.hasDrawnThisTurn = true;
      this.lastActionMessage = `Колода пуста, ${player.nickname} пропускает ход.`;
    }

    return { success: true };
  }

  public passTurn(playerId: string): { success: boolean; error?: string } {
    const player = this.getCurrentPlayer();
    if (!player || player.id !== playerId) {
      return { success: false, error: 'Сейчас не ваш ход' };
    }

    if (this.phase !== 'PLAYER_TURN') {
      return { success: false, error: 'Нельзя спасовать в текущей фазе' };
    }

    if (this.penalty.amount > 0) {
      return { success: false, error: 'Нельзя спасовать при активном штрафе. Сыграйте карту или возьмите штраф' };
    }

    if (!this.hasDrawnThisTurn) {
      return { success: false, error: 'Сначала необходимо взять карту из колоды' };
    }

    this.lastActionMessage = `${player.nickname} пасует.`;
    this.advanceTurn();
    return { success: true };
  }

  public selectQueenSuit(playerId: string, suit: Suit): { success: boolean; error?: string } {
    const player = this.getCurrentPlayer();
    if (!player || player.id !== playerId || this.phase !== 'QUEEN_SUIT_SELECTION') {
      return { success: false, error: 'Нельзя выбрать масть сейчас' };
    }

    this.activeSuit = suit;
    this.phase = 'PLAYER_TURN';
    this.lastActionMessage = `${player.nickname} заказал масть: ${suit}.`;
    this.advanceTurn();
    return { success: true };
  }

  // --- 8-Mechanic (Hidden Draw & Bluff) ---

  public startEightDraw(player: PlayerPrivate): { success: boolean; error?: string } {
    this.phase = 'EIGHT_DRAW';
    player.hiddenDrawCards = [];
    return this.eightDraw(player.id);
  }

  public eightDraw(playerId: string): { success: boolean; error?: string } {
    const player = this.getCurrentPlayer();
    if (!player || player.id !== playerId || this.phase !== 'EIGHT_DRAW') {
      return { success: false, error: 'Нельзя тянуть карты для 8 сейчас' };
    }

    const drawn = this.drawFromDeckSafe(1);
    if (drawn.length === 0) {
      // Deck empty and cannot recycle -> must stop
      return this.eightStop(playerId);
    }

    if (!player.hiddenDrawCards) {
      player.hiddenDrawCards = [];
    }
    player.hiddenDrawCards.push(...drawn);
    // Note: cardCount is NOT incremented publicly until selection is complete to preserve bluff,
    // or public card count can reflect drawn count without revealing identity.
    // As per README: "Остальные не видят вытянутые карты"
    player.cardCount = player.hand.length + player.hiddenDrawCards.length;
    this.lastActionMessage = `${player.nickname} тянет карту для восьмерки...`;
    return { success: true };
  }

  public eightStop(playerId: string): { success: boolean; error?: string } {
    const player = this.getCurrentPlayer();
    if (!player || player.id !== playerId || this.phase !== 'EIGHT_DRAW') {
      return { success: false, error: 'Нельзя остановить добор сейчас' };
    }

    // Merge hidden drawn cards into player's hand so they can choose
    if (player.hiddenDrawCards && player.hiddenDrawCards.length > 0) {
      player.hand.push(...player.hiddenDrawCards);
      player.hiddenDrawCards = [];
      player.cardCount = player.hand.length;
    }

    // Check if player has any matching card to play (8, matching suit, or Queen)
    const topCard = this.getTopCard();
    const playable = Rules.getPlayableCards(player.hand, topCard, this.activeSuit, this.penalty);

    if (playable.length === 0) {
      // If deck still has cards, player must continue drawing until a playable card appears
      if (this.deck.remaining() > 0) {
        return { success: false, error: 'В колоде еще есть карты. Необходимо тянуть, пока не попадется подходящая карта' };
      }
      // If deck ran out completely and still no cards fit
      this.lastActionMessage = `Колода пуста: ${player.nickname} не нашел подходящей карты и пропускает ход.`;
      this.phase = 'PLAYER_TURN';
      this.advanceTurn();
      return { success: true };
    }

    this.phase = 'EIGHT_SELECT';
    this.lastActionMessage = `${player.nickname} остановил добор и выбирает карту.`;
    return { success: true };
  }

  public eightSelect(playerId: string, cardId: string): { success: boolean; error?: string } {
    const player = this.getCurrentPlayer();
    if (!player || player.id !== playerId || this.phase !== 'EIGHT_SELECT') {
      return { success: false, error: 'Нельзя выбрать карту сейчас' };
    }

    const cardIndex = player.hand.findIndex(c => c.id === cardId);
    if (cardIndex === -1) {
      return { success: false, error: 'Карта отсутствует в руке' };
    }

    const card = player.hand[cardIndex];
    if (card.suit !== this.activeSuit && card.rank !== '8' && card.rank !== 'Q') {
      return { success: false, error: 'Карта должна соответствовать масти восьмерки, быть другой восьмеркой или дамой' };
    }

    // Play card
    player.hand.splice(cardIndex, 1);
    player.cardCount = player.hand.length;
    this.discardPile.push(card);

    if (player.hand.length === 0) {
      this.handleRoundVictory(player, card);
      return { success: true };
    }

    // Special chain case: if the selected card is a NEW 8:
    // "Игрок должен продолжить перебивать эту новую восьмёрку по её масти"
    if (card.rank === '8') {
      this.activeSuit = card.suit;
      this.phase = 'PLAYER_TURN';
      this.lastActionMessage = `${player.nickname} сыграл новую ${card.suit} 8! Должен продолжить ход по новой масти.`;
      // Turn does NOT advance to next player, the current player must play on it!
      return { success: true };
    }

    // Otherwise apply standard effects
    this.phase = 'PLAYER_TURN';
    if (card.rank === 'Q') {
      this.phase = 'QUEEN_SUIT_SELECTION';
      return { success: true };
    }
    if (card.rank === '6') {
      this.penalty.type = '6';
      this.penalty.amount += 1;
      this.activeSuit = card.suit;
      this.advanceTurn();
      return { success: true };
    }
    if (card.rank === '7') {
      this.penalty.type = '7';
      this.penalty.amount += 2;
      this.activeSuit = card.suit;
      this.advanceTurn();
      return { success: true };
    }
    if (card.suit === 'SPADES' && card.rank === 'K') {
      this.penalty.type = 'SPADES_K';
      this.penalty.amount = 5;
      this.activeSuit = card.suit;
      this.advanceTurn();
      return { success: true };
    }
    if (card.rank === 'A') {
      this.activeSuit = card.suit;
      this.advanceTurn(2);
      return { success: true };
    }

    this.activeSuit = card.suit;
    this.advanceTurn();
    return { success: true };
  }

  // --- End of Round & Scoring ---

  private handleRoundVictory(winner: PlayerPrivate, winningCard: Card): void {
    this.phase = 'ROUND_END';
    this.lastWinningCard = winningCard;

    // Calculate delta scores
    let winnerBonus = 0;
    let winnerSpecial: 'QUEEN_BONUS_20' | 'QUEEN_BONUS_40' | undefined = undefined;

    if (winningCard.rank === 'Q') {
      if (winningCard.suit === 'SPADES') {
        winnerBonus = SPADES_QUEEN_WIN_BONUS; // -40
        winnerSpecial = 'QUEEN_BONUS_40';
      } else {
        winnerBonus = QUEEN_WIN_BONUS; // -20
        winnerSpecial = 'QUEEN_BONUS_20';
      }
    }

    const roundPlayers: RoundResultPlayer[] = [];

    // Process all players
    for (const player of this.players) {
      if (player.isEliminated) {
        continue;
      }

      const prevScore = player.score;
      let deltaScore = 0;
      let specialEvent: '107_RESET' | '108_RESET' | 'ELIMINATED' | 'QUEEN_BONUS_20' | 'QUEEN_BONUS_40' | undefined = undefined;

      if (player.id === winner.id) {
        deltaScore = winnerBonus;
        specialEvent = winnerSpecial;
      } else {
        // Loser gets sum of card values in hand
        deltaScore = calculateHandScore(player.hand);
      }

      const accumulated = prevScore + deltaScore;
      const processed = processScore108(accumulated);

      player.score = processed.newScore;
      player.isEliminated = processed.isEliminated;
      if (processed.isEliminated) {
        player.isActive = false;
        specialEvent = 'ELIMINATED';
      } else if (processed.specialEvent) {
        specialEvent = processed.specialEvent;
      }

      roundPlayers.push({
        id: player.id,
        nickname: player.nickname,
        avatar: player.avatar,
        cardCount: player.hand.length,
        remainingCards: player.id === winner.id ? [] : [...player.hand],
        deltaScore,
        previousScore: prevScore,
        newScore: player.score,
        specialEvent,
        isWinner: player.id === winner.id
      });
    }

    // Determine next round starter
    const remainingActive = this.getActivePlayers();
    let nextStarterId = '';
    if (remainingActive.length >= 2) {
      const highest = [...remainingActive].sort((a, b) => b.score - a.score)[0];
      const nextSeat = this.getNextActiveSeatIndex(highest.seatIndex);
      nextStarterId = this.players[nextSeat].id;
    }

    this.roundResult = {
      roundNumber: this.roundNumber,
      winnerId: winner.id,
      winnerNickname: winner.nickname,
      winningCard,
      players: roundPlayers,
      nextStarterId
    };

    this.lastActionMessage = `Победитель раунда: ${winner.nickname}!`;
    this.checkGameCompletion();
  }

  public checkGameCompletion(): boolean {
    const active = this.getActivePlayers();
    if (active.length === 1 && this.phase !== 'LOBBY') {
      this.phase = 'GAME_END';
      this.gameWinner = {
        id: active[0].id,
        nickname: active[0].nickname,
        avatar: active[0].avatar,
        seatIndex: active[0].seatIndex,
        cardCount: active[0].cardCount,
        score: active[0].score,
        isActive: true,
        isEliminated: false,
        isConnected: active[0].isConnected,
        isHost: active[0].isHost
      };
      this.lastActionMessage = `Игра окончена! Победитель: ${this.gameWinner.nickname}!`;
      return true;
    }
    return false;
  }

  // --- Helpers ---

  public getTopCard(): Card | null {
    return this.discardPile.length > 0 ? this.discardPile[this.discardPile.length - 1] : null;
  }

  public advanceTurn(step: number = 1): void {
    this.hasDrawnThisTurn = false;
    let nextIndex = this.currentTurnIndex;
    for (let i = 0; i < step; i++) {
      nextIndex = this.getNextActiveSeatIndex(nextIndex);
    }
    this.currentTurnIndex = nextIndex;
  }

  public getNextActiveSeatIndex(fromSeatIndex: number): number {
    const total = this.players.length;
    for (let i = 1; i <= total; i++) {
      const checkIdx = (fromSeatIndex + i) % total;
      const p = this.players[checkIdx];
      if (p && !p.isEliminated && p.isActive) {
        return checkIdx;
      }
    }
    return fromSeatIndex;
  }

  public getPlayerAtNextActiveSeat(fromSeatIndex: number): PlayerPrivate | null {
    const nextIdx = this.getNextActiveSeatIndex(fromSeatIndex);
    return this.players[nextIdx] || null;
  }

  public drawFromDeckSafe(count: number): Card[] {
    let drawn = this.deck.drawMultiple(count);
    if (drawn.length < count) {
      // Recycle discard pile
      this.deck.recycleDiscard(this.discardPile, true);
      const remaining = count - drawn.length;
      const additional = this.deck.drawMultiple(remaining);
      drawn = [...drawn, ...additional];
    }
    return drawn;
  }

  // --- View Projection (Security & Sanitization) ---

  public getPlayerView(playerId: string): GameStateView {
    const localPlayer = this.players.find(p => p.id === playerId);
    const topCard = this.getTopCard();
    const isMyTurn = this.getCurrentPlayer()?.id === playerId;

    // Public player list (never exposes other players' private hands)
    const publicPlayers: PlayerPublic[] = this.players.map(p => ({
      id: p.id,
      nickname: p.nickname,
      avatar: p.avatar,
      seatIndex: p.seatIndex,
      cardCount: p.cardCount,
      score: p.score,
      isActive: p.isActive,
      isEliminated: p.isEliminated,
      isConnected: p.isConnected,
      isHost: p.isHost
    }));

    // Calculate playable card IDs for this user
    let validPlayableCardIds: string[] = [];
    if (isMyTurn && localPlayer && (this.phase === 'PLAYER_TURN' || this.phase === 'EIGHT_SELECT')) {
      const playable = Rules.getPlayableCards(localPlayer.hand, topCard, this.activeSuit, this.penalty);
      validPlayableCardIds = playable.map(c => c.id);
    }

    const canDrawCard = isMyTurn && this.phase === 'PLAYER_TURN' && (
      (this.penalty.amount > 0) || (!this.hasDrawnThisTurn)
    );

    const canPass = isMyTurn && this.phase === 'PLAYER_TURN' && this.hasDrawnThisTurn && this.penalty.amount === 0;

    const canStopEightDraw = isMyTurn && this.phase === 'EIGHT_DRAW' && (
      (localPlayer?.hiddenDrawCards && localPlayer.hiddenDrawCards.length > 0) || false
    );

    return {
      roomId: this.id,
      phase: this.phase,
      roundNumber: this.roundNumber,
      players: publicPlayers,
      myPlayerId: playerId,
      myHand: localPlayer?.hand || [],
      myHiddenDrawCards: localPlayer?.hiddenDrawCards || [],
      topCard,
      activeSuit: this.activeSuit,
      discardPileCount: this.discardPile.length,
      discardPileTop: this.discardPile.slice(-4),
      deckCount: this.deck.remaining(),
      currentTurnPlayerId: this.getCurrentPlayer()?.id || null,
      penalty: { ...this.penalty },
      hasDrawnThisTurn: this.hasDrawnThisTurn,
      validPlayableCardIds,
      canDrawCard,
      canPass,
      canStopEightDraw,
      lastActionMessage: this.lastActionMessage,
      roundResult: this.roundResult,
      gameWinner: this.gameWinner
    };
  }
}
