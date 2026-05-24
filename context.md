# TypeWar — Battle Royale Typing Game

## Overview

TypeWar is a multiplayer battle royale typing game.

Players race to type AI-generated text as fast as possible.
Every 30 seconds, the slowest typist is eliminated.
Last one standing wins.

The experience is fast, competitive, and addictive.

The core emotional mechanic:
"Type or die."

---

## Tech Stack

- Next.js (App Router)
- React
- TailwindCSS
- Framer Motion
- Supabase Auth (authentication)
- Supabase Database (persistent storage)
- Supabase Realtime (multiplayer sync)
- Claude API (AI-generated text content)

Auth: Supabase Auth with email/password or magic link.
Players must be signed in to create or join a room.
Player profile (username, stats) persisted in database across sessions.

---

## Core Gameplay Loop

1. Player creates or joins a room via room code
2. Lobby shows connected players (2–10 players)
3. Host starts the game
4. All players see the same AI-generated text
5. Players race to type the text
6. Every 30 seconds, slowest player (lowest % completed) is eliminated
7. Eliminated players become spectators
8. Last player standing wins

Fast loop:
Join → Type → Survive → Win

---

## Game Structure

### Screen 1 — Auth

Sign in / Sign up screen.

- Email + password or magic link
- After auth, redirect to landing

### Screen 2 — Landing

Large dark screen.

Headline: "TypeWar"
Subheadline: "Multiplayer battle royale typing game"

Shows logged-in username + stats (best WPM, total wins).

Three actions:
- CREATE ROOM
- JOIN ROOM (enter 4-digit code)
- LEADERBOARD

---

### Screen 2 — Lobby

Shows:
- Room code (large, copyable)
- Connected players list with avatars/names
- Player count (e.g. "4/10")
- "START GAME" button (host only)
- Waiting state for non-hosts

---

### Screen 3 — Game

Layout:
- Top: leaderboard bar showing all players + their progress %
- Center: text to type (highlighted character by character)
- Bottom: player's input field
- Side: elimination countdown timer (30s)
- Eliminated players shown as greyed out in leaderboard

Text behavior:
- Current character highlighted
- Correct characters turn green
- Wrong character turns red, must be deleted before proceeding
- WPM counter live

Elimination:
- Every 30 seconds, player with lowest progress % is eliminated
- Dramatic elimination animation
- Eliminated players watch as spectators in real time

---

### Screen 4 — Winner

Full screen winner reveal.

Shows:
- Winner name
- Final WPM
- Ranking of all players
- "PLAY AGAIN" button (returns to lobby)

Game results saved to database:
- Each player's placement and WPM stored in game_results
- User stats updated (total_games, total_wins, best_wpm)

---

## Multiplayer Architecture

Using Supabase Realtime channels.

Each room = one Supabase channel.

Events broadcasted:
- player_joined
- player_left
- game_started
- progress_update (every 500ms per player)
- player_eliminated
- game_over

State stored in Supabase tables:
- rooms (id, code, status, host_id, created_at)
- players (id, room_id, user_id, name, progress, wpm, eliminated, is_host)
- users (id, username, total_games, total_wins, best_wpm, created_at)
- game_results (id, room_id, user_id, placement, wpm, created_at)

Room codes: 4-digit random alphanumeric (e.g. "X7K2")

---

## AI Integration

Claude API generates the typing text before each round.

Prompt strategy:
- Request a paragraph of 150–200 characters
- Varied difficulty levels: easy (simple words), hard (technical/complex)
- Themed content: tech, startup, science, pop culture

Example generated texts:
- "The neural network processed millions of parameters simultaneously..."
- "Artificial intelligence is reshaping how we build products today..."
- "In a world where every second counts, speed defines the winner..."

AI text generation happens server-side in a Next.js API route.
Text is generated once per room when host starts the game.
All players receive the same text via Supabase broadcast.

---

## Scoring System

WPM (words per minute) is the primary metric.

WPM calculation:
- (characters typed / 5) / minutes elapsed

Displayed live during game.
Used to rank players at end screen.
Used to determine elimination (lowest % progress per round).

---

## File Structure

```
/app
  /page.tsx                    — landing screen (protected)
  /auth/page.tsx               — sign in / sign up
  /room/[code]/page.tsx        — lobby + game screen
  /leaderboard/page.tsx        — global leaderboard
  /api/generate-text/route.ts  — Claude API text generation

/components
  /LandingScreen.tsx
  /AuthScreen.tsx
  /Lobby.tsx
  /GameScreen.tsx
  /WinnerScreen.tsx
  /PlayerCard.tsx
  /TypingArea.tsx
  /Leaderboard.tsx
  /EliminationOverlay.tsx

/lib
  /supabase.ts           — Supabase client
  /auth.ts               — auth helpers
  /game.ts               — game logic helpers
  /claude.ts             — Claude API helper

/data
  /fallbackTexts.ts      — static text fallbacks if AI fails
```

---

## Data Models

### Room
```ts
{
  id: string
  code: string           // 4-digit e.g. "X7K2"
  status: "lobby" | "playing" | "finished"
  host_id: string
  text: string           // AI-generated text for this round
  created_at: string
}
```

### Player
```ts
{
  id: string
  room_id: string
  user_id: string        // references auth user
  name: string
  progress: number       // 0–100 (% of text completed)
  wpm: number
  eliminated: boolean
  is_host: boolean
}
```

### User
```ts
{
  id: string             // matches Supabase auth user id
  username: string
  total_games: number
  total_wins: number
  best_wpm: number
  created_at: string
}
```

### GameResult
```ts
{
  id: string
  room_id: string
  user_id: string
  placement: number      // 1 = winner
  wpm: number
  created_at: string
}
```

---

## Design Direction

Dark mode only.

Primary colors:
- Background: #0a0a0a
- Text: #ffffff
- Accent: #ff4444 (elimination red)
- Success: #00ff88 (correct typing green)
- Muted: #333333

Typography:
- Monospace font for typing area (JetBrains Mono or similar)
- Clean sans-serif for UI

Style:
- Minimal
- High contrast
- Tense, competitive atmosphere
- Framer Motion for eliminations and transitions

---

## Key UX Rules

- Auth required to play — redirect unauthenticated users to /auth
- Room code must be shareable via URL (e.g. /room/X7K2)
- Username comes from auth profile, not a prompt
- Game starts only when host clicks START
- Eliminated players stay on screen as spectators
- Reconnection should restore player state if possible (matched by user_id)
- Game results always saved to database after game ends
- Mobile-friendly input (soft keyboard support)
