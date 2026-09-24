# AGENTS.md — Project Guide & Context for AI Agents

> **Project**: «108» Card Game (Браузерная многопользовательская карточная игра «108»)  
> **Repository**: `https://github.com/hooksit/game-108.git`  
> **Branch**: `main`  
> **Target OS for Deploy**: Ubuntu 24.04 (Docker Compose)  

This file serves as the single source of truth for the codebase architecture, game mechanics, state machine, and recent user-requested modifications. Any agent working on this repository should review this document before making changes.

---

## 1. Project Overview & Architecture

Monorepo structure with npm workspaces:
```
├── shared/               # TypeScript definitions, card models, scoring helpers, socket contracts
│   └── src/
│       ├── types.ts      # Card, Suit, Rank, GamePhase, Player, GameState, etc.
│       └── scoring.ts    # calculateHandScore, processScore108, CARD_SCORES
├── server/               # Node.js + Express + Socket.IO backend
│   ├── src/
│   │   ├── index.ts      # HTTP server, socket event wiring, connection handlers
│   │   └── engine/
│   │       ├── CardDeck.ts    # 36-card deck with Fisher-Yates shuffle
│   │       └── GameSession.ts # Complete game state machine & business logic
│   └── tests/
│       └── gameEngine.test.ts # Vitest suite covering 24 comprehensive rule tests
├── client/               # React 18 + TypeScript + Vite + Tailwind CSS + Lucide Icons
│   └── src/
│       ├── App.tsx       # Root view router (Lobby vs GameTable), global chat toast, audio
│       ├── hooks/
│       │   ├── useGameSocket.ts  # Socket.IO connection & state listener
│       │   └── useSound.ts       # WebAudio API sound synthesizer (zero external audio files needed)
│       └── components/
│           ├── Lobby/        # LobbyScreen.tsx (simple 1-click room creation, players list)
│           ├── Table/        # GameTable.tsx (table layout, discard pile, deck, opponents)
│           ├── Hand/         # PlayerHand.tsx (local player card fan, selection)
│           ├── Controls/     # Controls.tsx (sound toggle, chat button, action button, round/suit indicator, avatar)
│           ├── Opponent/     # OpponentSlot.tsx (avatar, remaining card counter, score badge, online indicator)
│           ├── Chat/         # ChatModal.tsx (in-game text messaging)
│           └── Modals/       # QueenSuitModal, EightDrawModal, RoundEndModal, GameOverModal
└── Dockerfile, docker-compose.yml, DEPLOY_UBUNTU.md # Production deployment
```

---

## 2. Complete Rules of Game «108»

### Deck & Setup
- **Deck**: Standard 36 cards (ranks `6`, `7`, `8`, `9`, `10`, `J`, `Q`, `K`, `A` across 4 suits: ♠, ♣, ♥, ♦).
- **Deal size**:
  - **4 cards** per player when 3 or more players are active.
  - **6 cards** per player when down to 2 players head-to-head.
- **Starting Card**: Placed from deck onto discard pile at round start:
  - If starter card is **6**: First player can counter with another 6 (penalty becomes +2) or draw 1 card, then turn passes to next player.
  - If starter card is **7**: First player can counter with another 7 (penalty becomes +4) or draw 2 cards, then turn passes to next player.
  - If starter card is **Ace**: First player skips turn, turn moves clockwise to next player.
  - If starter card is **♠K** (King of Spades): First player draws 5 cards from deck, turn moves to next player.
  - At the start of the game/round, a random selection modal (`StartingTurnModal`) shows who starts and explains the starting rule.

### Card Values for Hand Score / Round End
- **6, 7, 8, 9**: 0 points
- **10**: 10 points
- **Jack (В)**: 2 points
- **Queen (Д)**: 3 points (unless played to end round: see Queen Bonus below)
- **King (К)**: 4 points (all suits)
- **Ace (Т)**: 11 points

### The "108" Elimination & Reset Mechanism
- At round end, points in remaining cards are added to each player's cumulative score.
- **Reset to 53**: If a player reaches **exactly 107**, their score resets to **53**.
- **Reset to 0**: If a player reaches **exactly 108**, their score resets to **0**.
- **Elimination**: If a player exceeds **108** (e.g. 109+), they are eliminated from the game (`isEliminated = true`).
- The game continues over multiple rounds until only 1 player remains (Winner).

### Special Card Effects During Play
1. **Queen (Д - Дама)**:
   - Universal wild card: can be played on **any** normal card (regardless of suit/rank).
   - Playing a Queen pauses play for `QUEEN_SUIT_SELECTION`, allowing the player to declare the new active suit.
   - **Winning with Queen**: If a player's last card is a Queen, they get **-20 points**; if it's the **Queen of Spades (♠Q)**, they get **-40 points**!
2. **Seven (7 - Семерка)**:
   - Penalty attack: next player must draw **2 cards**, unless they counter with another 7 (of any suit).
   - Stacks: 2 cards -> 4 cards -> 6 cards -> 8 cards. Player taking penalty draws all stacked cards and turn passes.
3. **Six (6 - Шестерка)**:
   - Penalty transfer / attack: next player must draw **1 card**, or counter with another 6.
   - Stacks: 1 -> 2 -> 3 -> 4.
4. **Ace (Т - Туз)**:
   - Skips the next player's turn. Can be countered with another Ace to transfer the skip.
5. **King of Spades (♠K - Пиковый Король)**:
   - Causes the next player to draw **5 cards** from the deck (cannot be countered with another King).
   - **Round Finish with ♠K**: If a player ends the round by playing ♠K as their final card, the next opponent must draw 5 cards from the deck, and all those 5 cards are added to that opponent's hand before round score calculation!
6. **Eight (8 - Восьмерка)**:
   - When an 8 is played, the **same player** must immediately cover their 8 with another card of the matching suit, another 8 (of any suit), or a Queen!
   - If the player cannot cover it from hand, they must draw from the deck (`EIGHT_DRAW` phase) until they draw a playable card to cover it, or stop and pick from the drawn cards (`EIGHT_SELECT`).
   - If an 8 is covered by another 8, the required suit updates to the new 8's suit.
   - An 8 on the table can also be directly countered by the next player with another 8 of any suit.

---

## 3. Key UI/UX Implementations & User Design Choices

1. **Lobby & Game Creation**:
   - Simplified direct creation (no room code requirement).
   - Waiting lobby shows online count and ready players.
   - The user who created the game has exclusive authority to click "Начать игру" (Start Game).
2. **Sound Toggle Button**:
   - Located in the bottom-right corner, **directly above the action button («Взять карту» / «Пас»)**.
   - Avoids top-left collision with opponent avatars in multi-player setups.
3. **Chat Toast Notifications**:
   - Semi-transparent style (`bg-black/30 backdrop-blur-md border border-amber-500/30`).
   - Centered horizontally (`top-16 left-4 right-4 max-w-xs mx-auto`), auto-dismisses after 5 seconds.
   - Long messages are truncated cleanly so they never bleed out of viewport or overlap opponents.
4. **Player Hand Score Display**:
   - Placed directly inside the local player's badge under their avatar in the bottom bar: `в руке 12 оч.`.
   - Floating pill above the card fan was intentionally removed to keep card view completely clean.
5. **Round & Suit Box (Bottom-Left)**:
   - Displays the current suit symbol and dynamic round label: `Раунд N` (no artificial "12 раундов" cap, as rounds continue until only 1 player remains under 108).
6. **Spectator Mode (Наблюдатель)**:
   - When a new player enters mid-game, they connect as a spectator (`phase !== 'LOBBY'`).
   - They see the table, cards, scores, and chat in real-time.
   - When the game finishes or restarts, spectators automatically transition into active players.
7. **"Начать заново" (Restart) with Consensus Voting**:
   - Any active player can click "Заново" in the bottom-left corner.
   - Other players receive a flashing highlight button: `Одобрить (X/N)`.
   - When all players approve, the game resets to `LOBBY`.
   - The player who initiated the restart proposal becomes the room host with rights to click "Начать игру".
8. **Disconnect Handling**:
   - When a player disconnects unexpectedly, their hand and hidden cards are returned and shuffled back into the deck, preserving deck count.
9. **Lobby Chat & Message Persistence**:
   - Chat is accessible directly from the waiting lobby screen. Messages are persisted in `session.chatMessages` on the server and synced on connect via `chat:history`, keeping message history throughout the entire game lifecycle.
10. **Uniform Card Dimensions**:
    - All 36 card face assets and card back (`BACK.png`) are uniformly sized to `(240, 360)` (standard 2:3 ratio) and rendered with `object-fill`, ensuring zero size differences between different ranks/suits.
11. **Penalty Cards Visibility on Round End**:
    - When a player ends a round by playing 6, 7, or ♠K, the exact cards drawn from the deck by the penalized opponent are displayed in `RoundEndModal` with visual card illustrations so all players see what cards were drawn.
12. **Random Starter Selection Announcement**:
    - At match start, a random player is selected and displayed in a stylish `StartingTurnModal` showing the starter's avatar, the starting card, and the starting effect rule.

---

## 4. Development & Testing Commands

- Run all engine tests:
  ```bash
  npm test
  # or
  npm --prefix server test
  ```
- Build packages:
  ```bash
  npm --prefix shared run build
  npm --prefix server run build
  npm --prefix client run build
  ```
- Dev mode:
  ```bash
  npm run dev          # Server (port 3000)
  npm run dev:client   # Vite (port 5173, proxies /socket.io to 3000)
  ```
- Docker deployment (Production on server):
  ```bash
  docker compose down
  docker compose up -d --build
  ```
