/* =========================================================================
 * data.js  —  static content: tactical puzzles, bot roster, openings,
 * leaderboard and dashboard data for the combined chess.com x chessigma UI.
 * ========================================================================= */
(function (global) {
  'use strict';

  // Each puzzle: side to move solves it. `moves` is the SAN solution line;
  // the player plays the odd (1st, 3rd, ...) moves, engine replies the even.
  var PUZZLES = [
    {
      id: 'p1', rating: 800, theme: 'Mate in 1',
      fen: '6k1/5ppp/8/8/8/8/5PPP/R5K1 w - - 0 1',
      moves: ['Ra8#'],
      hint: 'Back rank — the king has no luft.'
    },
    {
      id: 'p2', rating: 1000, theme: 'Fork',
      fen: 'r1bqkbnr/pppp1ppp/2n5/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R b KQkq - 0 1',
      moves: ['Nd4', 'Nxd4', 'exd4'],
      hint: 'A knight in the centre attacks two things at once.'
    },
    {
      id: 'p3', rating: 1100, theme: 'Mate in 2',
      fen: 'r1b1kb1r/pppp1ppp/2n2n2/4p2q/2B1P3/2N2N2/PPPP1PPP/R1BQ1RK1 w kq - 0 1',
      moves: ['Nxe5', 'Nxe5', 'Qf3'],
      hint: 'Open lines toward f7 and the centre.'
    },
    {
      id: 'p4', rating: 950, theme: 'Pin',
      fen: 'rnbqkbnr/ppp2ppp/4p3/3p4/3P4/4P3/PPP2PPP/RNBQKBNR w KQkq - 0 1',
      moves: ['Bb5+', 'c6', 'Bd3'],
      hint: 'Check first, then retreat with tempo.'
    },
    {
      id: 'p5', rating: 1300, theme: 'Discovered attack',
      fen: 'r2qkb1r/ppp2ppp/2n5/3np1B1/2B5/5N2/PPPP1PPP/RN1QK2R w KQkq - 0 1',
      moves: ['Bxd5', 'Qxd5', 'Nc3'],
      hint: 'Win the centre pawn and gain time on the queen.'
    },
    {
      id: 'p6', rating: 700, theme: 'Hanging piece',
      fen: 'rnbqkbnr/ppp1pppp/8/3p4/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 1',
      moves: ['exd5', 'Qxd5', 'Nc3'],
      hint: 'Grab the free pawn, then chase the queen.'
    },
    {
      id: 'p7', rating: 900, theme: 'Back-rank mate',
      fen: '2r3k1/5ppp/8/8/8/8/5PPP/2R3K1 w - - 0 1',
      moves: ['Rxc8#'],
      hint: 'The 8th rank is the king\'s prison — take the defender.'
    },
    {
      id: 'p8', rating: 1200, theme: 'Skewer',
      fen: '7R/8/8/5K2/8/k7/8/q7 w - - 0 1',
      moves: ['Ra8+', 'Kb2', 'Rxa1'],
      hint: 'Check the king to win what stands behind it.'
    }
  ];

  var BOTS = [
    { id: 'froggy',  name: 'Coach Froggy', elo: 400,  skill: 1, emoji: '🐸', blurb: 'Friendly. Hangs pieces on purpose.' },
    { id: 'rookie',  name: 'Rookie Rita',  elo: 800,  skill: 2, emoji: '🐣', blurb: 'Knows the rules, not much else.' },
    { id: 'scout',   name: 'Scout',        elo: 1200, skill: 3, emoji: '🦊', blurb: 'Spots simple tactics.' },
    { id: 'maestro', name: 'Maestro',      elo: 1600, skill: 4, emoji: '🦉', blurb: 'Calculates a few moves deep.' },
    { id: 'sigma',   name: 'Sigma',        elo: 2000, skill: 5, emoji: '🤖', blurb: 'The full strength of the engine.' }
  ];

  var OPENINGS = [
    { name: 'Italian Game',     moves: ['e4', 'e5', 'Nf3', 'Nc6', 'Bc4'], eco: 'C50',
      idea: 'Quick development, eyes on the f7 weakness.' },
    { name: 'Ruy López',        moves: ['e4', 'e5', 'Nf3', 'Nc6', 'Bb5'], eco: 'C60',
      idea: 'Pressure the knight that defends e5.' },
    { name: 'Sicilian Defense', moves: ['e4', 'c5'], eco: 'B20',
      idea: "Black's most combative answer to 1.e4." },
    { name: 'Queen\'s Gambit',  moves: ['d4', 'd5', 'c4'], eco: 'D06',
      idea: 'Offer a pawn to seize the centre.' },
    { name: 'London System',    moves: ['d4', 'd5', 'Bf4'], eco: 'D02',
      idea: 'A solid, easy-to-learn setup for White.' },
    { name: 'French Defense',   moves: ['e4', 'e6'], eco: 'C00',
      idea: 'Solid but slightly cramped; strike with ...d5.' }
  ];

  var LEADERBOARD = [
    { name: 'Ayman',       solved: 8169, streak: 640, acc: 74, medal: 'gold' },
    { name: 'chanphongzz', solved: 7976, streak: 391, acc: 79, medal: 'silver' },
    { name: 'Mateo_on_yt', solved: 7145, streak: 728, acc: 86, medal: 'bronze' },
    { name: 'tactic_tom',  solved: 6610, streak: 211, acc: 71, medal: '' },
    { name: 'blitzbunny',  solved: 6120, streak: 154, acc: 68, medal: '' }
  ];

  // chessigma-style training menu
  var TRAIN_MENU = [
    { group: 'TACTICS', items: [
      { id: 'puzzles',   icon: '🧩', title: 'Puzzles',       desc: 'Curated puzzles, unlimited. Elo-tracked. Global leaderboard.', route: '#/puzzles' },
      { id: 'woodpecker',icon: '🪵', title: 'Woodpecker',    desc: 'Spaced-repetition cycles. Retrain every miss.', route: '#/puzzles' }
    ]},
    { group: 'BLUNDERS', items: [
      { id: 'shield',    icon: '🛡️', title: 'Blunder Shield', desc: 'Spot the blunder before it costs you. Trained on your losses.', route: '#/puzzles' },
      { id: 'replay',    icon: '🔁', title: 'Blunder Training', desc: 'Replay every mistake with the coach in your ear.', route: '#/play' }
    ]},
    { group: 'CONVERSION', items: [
      { id: 'convert',   icon: '🏆', title: 'Conversion Trainer', desc: 'Won the position, lost the game? Drill the moments you let it slip.', route: '#/play' },
      { id: 'endgame',   icon: '🏁', title: 'Endgame Trainer', desc: 'How many won endgames have you lost? Study the classics.', route: '#/play', soon: true }
    ]}
  ];

  var TOOLS_MENU = [
    { id: 'review',   icon: '🔎', title: 'Game Review',    desc: 'Import a game and walk it move by move with the engine.', route: '#/review' },
    { id: 'analysis', icon: '📊', title: 'Analysis Board', desc: 'Free analysis board with engine evaluation.', route: '#/analysis' },
    { id: 'editor',   icon: '🎛️', title: 'Board Editor',   desc: 'Drag-and-drop position editor. Export FEN/PGN.', route: '#/analysis' },
    { id: 'nextmove', icon: '🔄', title: 'Next Move',      desc: 'Engine-best continuation from any FEN.', route: '#/analysis' },
    { id: 'elo',      icon: '📈', title: 'Elo Calculator', desc: 'Estimate rating change from a result.', route: '#/elo' }
  ];

  global.DATA = {
    PUZZLES: PUZZLES,
    BOTS: BOTS,
    OPENINGS: OPENINGS,
    LEADERBOARD: LEADERBOARD,
    TRAIN_MENU: TRAIN_MENU,
    TOOLS_MENU: TOOLS_MENU
  };
})(typeof window !== 'undefined' ? window : this);
