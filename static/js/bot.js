/* =========================================================================
 * bot.js  —  a lightweight alpha-beta chess bot built on chess-mini.
 * Provides Engine.bestMove(fen, depth) and a static evaluation good enough
 * for casual play, "Next Move" suggestions and rough analysis bars.
 * ========================================================================= */
(function (global) {
  'use strict';

  var PIECE_VALUE = { p: 100, n: 320, b: 330, r: 500, q: 900, k: 0 };

  // Piece-square tables (white's perspective, a8..h1 reading order).
  var PST = {
    p: [
       0,  0,  0,  0,  0,  0,  0,  0,
      50, 50, 50, 50, 50, 50, 50, 50,
      10, 10, 20, 30, 30, 20, 10, 10,
       5,  5, 10, 25, 25, 10,  5,  5,
       0,  0,  0, 20, 20,  0,  0,  0,
       5, -5,-10,  0,  0,-10, -5,  5,
       5, 10, 10,-20,-20, 10, 10,  5,
       0,  0,  0,  0,  0,  0,  0,  0
    ],
    n: [
      -50,-40,-30,-30,-30,-30,-40,-50,
      -40,-20,  0,  0,  0,  0,-20,-40,
      -30,  0, 10, 15, 15, 10,  0,-30,
      -30,  5, 15, 20, 20, 15,  5,-30,
      -30,  0, 15, 20, 20, 15,  0,-30,
      -30,  5, 10, 15, 15, 10,  5,-30,
      -40,-20,  0,  5,  5,  0,-20,-40,
      -50,-40,-30,-30,-30,-30,-40,-50
    ],
    b: [
      -20,-10,-10,-10,-10,-10,-10,-20,
      -10,  0,  0,  0,  0,  0,  0,-10,
      -10,  0,  5, 10, 10,  5,  0,-10,
      -10,  5,  5, 10, 10,  5,  5,-10,
      -10,  0, 10, 10, 10, 10,  0,-10,
      -10, 10, 10, 10, 10, 10, 10,-10,
      -10,  5,  0,  0,  0,  0,  5,-10,
      -20,-10,-10,-10,-10,-10,-10,-20
    ],
    r: [
       0,  0,  0,  0,  0,  0,  0,  0,
       5, 10, 10, 10, 10, 10, 10,  5,
      -5,  0,  0,  0,  0,  0,  0, -5,
      -5,  0,  0,  0,  0,  0,  0, -5,
      -5,  0,  0,  0,  0,  0,  0, -5,
      -5,  0,  0,  0,  0,  0,  0, -5,
      -5,  0,  0,  0,  0,  0,  0, -5,
       0,  0,  0,  5,  5,  0,  0,  0
    ],
    q: [
      -20,-10,-10, -5, -5,-10,-10,-20,
      -10,  0,  0,  0,  0,  0,  0,-10,
      -10,  0,  5,  5,  5,  5,  0,-10,
       -5,  0,  5,  5,  5,  5,  0, -5,
        0,  0,  5,  5,  5,  5,  0, -5,
      -10,  5,  5,  5,  5,  5,  0,-10,
      -10,  0,  5,  0,  0,  0,  0,-10,
      -20,-10,-10, -5, -5,-10,-10,-20
    ],
    k: [
      -30,-40,-40,-50,-50,-40,-40,-30,
      -30,-40,-40,-50,-50,-40,-40,-30,
      -30,-40,-40,-50,-50,-40,-40,-30,
      -30,-40,-40,-50,-50,-40,-40,-30,
      -20,-30,-30,-40,-40,-30,-30,-20,
      -10,-20,-20,-20,-20,-20,-20,-10,
       20, 20,  0,  0,  0,  0, 20, 20,
       20, 30, 10,  0,  0, 10, 30, 20
    ]
  };

  function evaluate(game) {
    // From white's perspective in centipawns.
    var score = 0;
    var board = game.board;
    for (var i = 0; i < 64; i++) {
      var p = board[i];
      if (!p) continue;
      var type = p.toLowerCase();
      var isWhite = p === p.toUpperCase();
      var val = PIECE_VALUE[type];
      var pst = PST[type][isWhite ? i : (63 - i)];
      if (isWhite) score += val + pst;
      else score -= val + pst;
    }
    return score;
  }

  function quietOrderKey(m) {
    // captures first, by MVV-LVA-ish ordering
    if (m.captured) {
      var vv = PIECE_VALUE[(m.captured || 'p').toLowerCase()] || 0;
      var av = PIECE_VALUE[(m.piece || 'p').toLowerCase()] || 0;
      return 10000 + vv - av;
    }
    if (m.promotion) return 9000;
    return 0;
  }

  function search(game, depth, alpha, beta) {
    if (depth === 0) {
      return { score: evaluate(game) };
    }
    var moves = game.moves();
    if (moves.length === 0) {
      if (game.inCheck()) {
        // checkmate: side to move loses
        var mateScore = (game.turn === 'w') ? -100000 - depth : 100000 + depth;
        return { score: mateScore };
      }
      return { score: 0 }; // stalemate
    }
    moves.sort(function (a, b) { return quietOrderKey(b) - quietOrderKey(a); });

    var best = null;
    var maximizing = (game.turn === 'w');
    var bestScore = maximizing ? -Infinity : Infinity;

    for (var i = 0; i < moves.length; i++) {
      var undo = game._applyMove(moves[i]);
      var res = search(game, depth - 1, alpha, beta);
      game._undoMove(undo);
      var sc = res.score;
      if (maximizing) {
        if (sc > bestScore) { bestScore = sc; best = moves[i]; }
        alpha = Math.max(alpha, sc);
      } else {
        if (sc < bestScore) { bestScore = sc; best = moves[i]; }
        beta = Math.min(beta, sc);
      }
      if (beta <= alpha) break;
    }
    return { score: bestScore, move: best };
  }

  var Engine = {
    evaluate: function (fenOrGame) {
      var g = (typeof fenOrGame === 'string') ? new global.Chess(fenOrGame) : fenOrGame;
      return evaluate(g);
    },
    // Returns the best move as a verbose-ish object {from,to,promotion,san}.
    bestMove: function (fen, depth) {
      depth = depth || 3;
      var g = new global.Chess(fen);
      var legal = g.moves();
      if (!legal.length) return null;
      var res = search(g, depth, -Infinity, Infinity);
      var m = res.move || legal[0];
      var san = g._san(m, legal);
      return {
        from: global.Chess.SQUARES_HELPERS.sqName(m.from),
        to: global.Chess.SQUARES_HELPERS.sqName(m.to),
        promotion: m.promotion || null,
        san: san,
        score: res.score
      };
    },
    // Bot move with skill: lower skill = more randomness / shallower.
    pickMove: function (fen, skill) {
      skill = skill == null ? 3 : skill;     // 0..5
      var g = new global.Chess(fen);
      var legal = g.moves();
      if (!legal.length) return null;
      // Beginner: sometimes pick a random non-blundering-ish move.
      if (skill <= 1 && Math.random() < 0.45) {
        var m = legal[Math.floor(Math.random() * legal.length)];
        return {
          from: global.Chess.SQUARES_HELPERS.sqName(m.from),
          to: global.Chess.SQUARES_HELPERS.sqName(m.to),
          promotion: m.promotion || null,
          san: g._san(m, legal)
        };
      }
      var depth = Math.max(1, Math.min(4, skill));
      return Engine.bestMove(fen, depth);
    }
  };

  global.Engine = Engine;
})(typeof window !== 'undefined' ? window : this);
