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
│       │   └── useSound.ts       # Realistic audio sound effects manager (deal, draw, play, pass, victory, penalty, message)
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
  - If starter card is **6**: First player draws 1 card from deck, skips turn, turn moves clockwise to next player.
  - If starter card is **7**: First player draws 2 cards from deck, skips turn, turn moves clockwise to next player.
  - If starter card is **Ace**: First player skips turn, turn moves clockwise to next player.
  - If starter card is **♠K** (King of Spades): First player draws 5 cards from deck, skips turn, turn moves clockwise to next player.
  - At the start of the game/round, a selection modal (`StartingTurnModal`) shows who starts and explains the starting rule.

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
3. **Chat Toast Notifications & Top-Edge Positioning**:
   - Ultra-light semi-transparent style (`bg-black/40 backdrop-blur-md border border-amber-500/25 text-white`, `z-[90]`), made 20% more transparent for maximum table felt visibility.
   - Positioned close to the top edge (`top-1.5 sm:top-2 left-3 right-3 max-w-[280px] sm:max-w-xs mx-auto animate-fade-in`), auto-dismisses after 5 seconds.
   - Top player lowered safely to `top-[84px] sm:top-24`, and side opponents placed at `top-[29%]`, ensuring floating chat toasts and error notifications never overlap opponent cards or avatars.
   - Rendered with `z-[90]`, visible in both the lobby and during active gameplay.
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
9. **Global Lobby Chat & Ephemeral Real-Time Messaging**:
   - Chat is accessible directly from the entrance lobby screen via the button under "Присоединиться к игре" (top-right redundant icon removed for clean title header).
   - Anyone in the lobby sees floating toasts of incoming messages and can open the chat drawer.
   - Messages are broadcast to all connected clients in real time (`io.emit('chat:message')`).
   - Messages are ephemeral: past chat history is automatically cleared upon page reload / refresh.
10. **Uniform Card Dimensions**:
    - All 36 card face assets and card back (`BACK.png`) are uniformly sized to `(240, 360)` (standard 2:3 ratio) and rendered with `object-fill`, ensuring zero size differences between different ranks/suits.
11. **Penalty Cards Visibility on Round End**:
    - When a player ends a round by playing 6, 7, or ♠K, the exact cards drawn from the deck by the penalized opponent are displayed in `RoundEndModal` with visual card illustrations so all players see what cards were drawn.
12. **Random Starter Selection Announcement**:
    - At match start, a random player is selected and displayed in a stylish `StartingTurnModal` showing the starter's avatar, the starting card, and the starting effect rule.
13. **Realistic Audio Sound Effects**:
    - Uses real card game audio recordings:
      - `deal.mp3` («начало игры раздача карт.mp3»): Dealing card hands at match start and new round.
      - `draw.mp3` («взял карту из колоды.mp3»): Taking a card from the deck during turn or eight mechanic.
      - `play.mp3` («Положил карту на стол.mp3»): Laying a card onto the table.
      - `pass.mp3` («Постучали колодой - пас.mp3»): Knocking on the deck/table when passing turn.
    - Synchronized for all players at the table so everyone hears card plays, draws, deals, and knocks in real time.
    - Sound of pass (`pass.mp3`) strictly triggers only when an opponent passed their turn without throwing a card or drawing from deck.
    - Harsh penalty sound effect removed per design direction for pleasant card play ambience.
14. **Card Assets Optimization & Instant Preloading**:
    - All 36 cards + `BACK` + `DECK` converted to modern WebP (`quality: 90`), reducing total asset size from **3.90 MB to 0.54 MB (-86.1% size reduction)** with zero visual loss.
    - Number cards (6, 7, 8, 9, 10, A) reduced from ~75 KB down to **~10 KB**.
    - Picture cards (J, Q, K) reduced from ~105 KB down to **~15 KB**.
    - `DECK.webp` reduced from 1020 KB down to **111 KB**.
    - Automated preloading via `preloadAllCards()` on app mount caches all 38 assets into browser memory in <200ms, eliminating any delay or blank flicker when drawing cards from the deck.
    - `CardView.tsx`, `DiscardZone.tsx`, and `PlayerSeat.tsx` use `loading="eager"` and `decoding="async"` with automatic `.png` fallback.
15. **Card Animations & Table Layout Polish**:
    - **Card Selection & Dynamic Fan Parting**:
      - Tapping any playable card elevates it smoothly (`translateY(-40px)`, `scale(1.05)`, bright gold glowing halo ring `z-[25]`).
      - All cards to the right of the selected card automatically shift right by `+36px` and maintain higher stacking (`zIndex: 30 + index`), guaranteeing that the suit and rank of the card to the right are **never** covered.
      - A golden glowing action button (`Бросить ↑`) is rendered after `CardView` at `-top-11` with `z-[70]`, positioned high and fully visible above the top of the card face without any clipping.
      - Tapping the card again, tapping `Бросить ↑`, or tapping anywhere on the center table discard pile immediately throws the selected card.
      - Tapping another playable card smoothly transfers the selection.
    - **Symmetrical Table Layout & Deck Placement**:
      - Four side players are distributed strictly symmetrically relative to the central vertical axis:
        - Upper Sides: 10 & 2 o'clock (`top-[24%] left-3 sm:left-6` vs `top-[24%] right-3 sm:right-6`)
        - Lower Sides: 8 & 4 o'clock (`top-[60%] left-3 sm:left-6` vs `top-[60%] right-3 sm:right-6`)
        - Top Center (when 6 players): 12 o'clock (`top-[84px] sm:top-24 left-1/2 -translate-x-1/2`)
      - Draw deck sits at `top-[42%]` on the right side, located squarely in the vertical center between the two right opponents (18% gap above and below).
      - Opponent visual card fan neatly sized with explicit `w-[28px] h-[42px] sm:w-[32px] sm:h-[48px]` cards in a compact fan (`w-20 h-10`), with card count circle anchored to the avatar top-right rim (`-top-1.5 -right-2`).
    - **Throwing onto the Table**:
      - `CardAnimationLayer.tsx` launches a high-performance GPU-accelerated flying card (`.anim-card-throw` using `translate3d`, `rotate`, `scale`).
      - Flight arc: card rises into an arc with a dynamic 3D tilt, rotations matching natural card throws, and scales seamlessly from hand into the center table.
      - Landing impact: upon landing on the discard pile, a tactile felt impact pulse (`.impact-pulse`) vibrates with an amber glow.
      - Synchronized for both local player and opponents (when an opponent plays, the card flies from their seat directly onto the discard pile).
    - **Taking a Card from the Deck**:
      - Draw deck has a tactile compression/press effect (`.deck-press-effect`).
      - A card peels smoothly off the deck and flies in a graceful arc (`.anim-card-draw`) down into the player's hand (or to the opponent's seat when an opponent draws).
      - Multi-card draws (e.g. King of Spades +5 penalty, 7s penalty) are sequentially staggered for realistic physical feel.

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
