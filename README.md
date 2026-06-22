# Chessigma — a chess.com × chessigma training site

A single, **dependency-free static site** that combines the dashboard feel of
[chess.com/home](https://www.chess.com/home) with the tactics-first, dark layout
of [chessigma.com](https://www.chessigma.com/). Play bots, solve rated puzzles,
analyze positions, review games and study openings — all running in plain
HTML/CSS/JS with a hand-written chess engine (no build step, works offline).

## ▶ View it with VSCode Live Server (the easy way)

1. Install the **Live Server** extension (you already did 👍).
2. Open this folder in VSCode.
3. Open `index.html` and click **“Go Live”** in the status bar
   (or right-click `index.html` → **Open with Live Server**).

That's it — the site opens in your browser. Nothing to install or build.

### Alternative: one-command server (no extension)

If you'd rather not use the extension, any static server works. A tiny
zero-dependency one ships in the repo:

```bash
node scripts/serve.mjs 5500
# then open http://localhost:5500/
```

## What's inside

| Page | What it does |
|------|--------------|
| **Home** | chess.com-style dashboard: streak, puzzle rating, lessons, game review, play cards, league + the chessigma rail (Coach Froggy, Top Solvers, training CTAs). |
| **Play** | Play full games against 5 bots (400–2000) powered by a built-in alpha-beta engine. Flip, undo, move list. |
| **Puzzles** | Rated tactical puzzles with hints, legal-move dots, and a live rating that goes up/down. |
| **Train** | chessigma-style training menu (Puzzles, Woodpecker, Blunder Shield, Conversion…). |
| **Tools** | Analysis board (eval bar + best move + FEN/PGN), Game Review (step through any PGN), Board Editor, Next Move, Elo Calculator. |
| **Learn** | Opening trainer — play through main lines move by move. |

## Project layout

```
index.html            ← Live Server entry point
static/
  styles.css          ← all styling (dark theme, amber/green accents)
  js/
    chess.js          ← hand-written chess engine (moves, FEN, SAN, mate/draw)
    bot.js            ← alpha-beta search + evaluation
    board.js          ← interactive board (click + drag, no images)
    data.js           ← puzzles, bots, openings, leaderboard
    app.js            ← SPA router + every view
scripts/serve.mjs     ← optional zero-dependency static server
```

> The repo also contains a separate **Next.js** app (`app/`, `components/`,
> `lib/`). That one needs `npm install && npm run dev` and is **not** what Live
> Server runs — Live Server serves the static `index.html` above.
