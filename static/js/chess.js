/* =========================================================================
 * chess-mini.js  —  a small, complete, dependency-free chess engine
 * -------------------------------------------------------------------------
 * Handles legal move generation, FEN I/O, castling, en passant, promotion,
 * check / checkmate / stalemate detection, SAN output and draw heuristics.
 *
 * Exposed as a global `Chess` constructor so it works under VSCode Live
 * Server with no bundler or build step.
 *
 * Board representation: a 64-element array, index 0 = a8 .. 63 = h1
 * (rank 8 first, matching FEN reading order). Pieces are single chars,
 * uppercase = white, lowercase = black, '' = empty.
 * ========================================================================= */
(function (global) {
  'use strict';

  var WHITE = 'w';
  var BLACK = 'b';

  // File/rank helpers for the 0..63 index space.
  function fileOf(sq) { return sq % 8; }          // 0=a .. 7=h
  function rankOf(sq) { return 8 - Math.floor(sq / 8); } // 8 .. 1
  function sqName(sq) {
    return 'abcdefgh'[fileOf(sq)] + rankOf(sq);
  }
  function nameToSq(name) {
    var f = 'abcdefgh'.indexOf(name[0]);
    var r = parseInt(name[1], 10);
    return (8 - r) * 8 + f;
  }
  function onBoard(file, rank) {
    return file >= 0 && file <= 7 && rank >= 1 && rank <= 8;
  }
  function makeSq(file, rank) {
    return (8 - rank) * 8 + file;
  }

  function colorOf(piece) {
    if (!piece) return null;
    return piece === piece.toUpperCase() ? WHITE : BLACK;
  }

  var KNIGHT_DELTAS = [
    [1, 2], [2, 1], [2, -1], [1, -2],
    [-1, -2], [-2, -1], [-2, 1], [-1, 2]
  ];
  var KING_DELTAS = [
    [0, 1], [1, 1], [1, 0], [1, -1],
    [0, -1], [-1, -1], [-1, 0], [-1, 1]
  ];
  var BISHOP_DIRS = [[1, 1], [1, -1], [-1, -1], [-1, 1]];
  var ROOK_DIRS = [[0, 1], [1, 0], [0, -1], [-1, 0]];

  var START_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

  function Chess(fen) {
    this.board = new Array(64).fill('');
    this.turn = WHITE;
    this.castling = { K: false, Q: false, k: false, q: false };
    this.epSquare = null;     // square index that can be captured en passant
    this.halfmoves = 0;
    this.fullmoves = 1;
    this.load(fen || START_FEN);
  }

  Chess.prototype.load = function (fen) {
    var parts = fen.trim().split(/\s+/);
    var rows = parts[0].split('/');
    this.board = new Array(64).fill('');
    var idx = 0;
    for (var r = 0; r < 8; r++) {
      var row = rows[r];
      for (var c = 0; c < row.length; c++) {
        var ch = row[c];
        if (/\d/.test(ch)) {
          idx += parseInt(ch, 10);
        } else {
          this.board[idx++] = ch;
        }
      }
    }
    this.turn = (parts[1] === 'b') ? BLACK : WHITE;
    var cr = parts[2] || '-';
    this.castling = {
      K: cr.indexOf('K') >= 0,
      Q: cr.indexOf('Q') >= 0,
      k: cr.indexOf('k') >= 0,
      q: cr.indexOf('q') >= 0
    };
    this.epSquare = (parts[3] && parts[3] !== '-') ? nameToSq(parts[3]) : null;
    this.halfmoves = parts[4] ? parseInt(parts[4], 10) : 0;
    this.fullmoves = parts[5] ? parseInt(parts[5], 10) : 1;
  };

  Chess.prototype.fen = function () {
    var rows = [];
    for (var r = 0; r < 8; r++) {
      var empty = 0, row = '';
      for (var c = 0; c < 8; c++) {
        var p = this.board[r * 8 + c];
        if (!p) { empty++; }
        else {
          if (empty) { row += empty; empty = 0; }
          row += p;
        }
      }
      if (empty) row += empty;
      rows.push(row);
    }
    var cr = '';
    if (this.castling.K) cr += 'K';
    if (this.castling.Q) cr += 'Q';
    if (this.castling.k) cr += 'k';
    if (this.castling.q) cr += 'q';
    if (!cr) cr = '-';
    var ep = this.epSquare != null ? sqName(this.epSquare) : '-';
    return rows.join('/') + ' ' + this.turn + ' ' + cr + ' ' + ep +
      ' ' + this.halfmoves + ' ' + this.fullmoves;
  };

  Chess.prototype.get = function (square) {
    return this.board[nameToSq(square)];
  };

  // Is `square` (index) attacked by `color`?
  Chess.prototype.isAttacked = function (square, color) {
    var f = fileOf(square), r = rankOf(square);
    var i, d, tf, tr, tsq, piece;

    // Pawns
    var pawnDir = (color === WHITE) ? -1 : 1; // white pawns attack "up" (toward rank 8)
    // A square is attacked by a white pawn that sits one rank below it.
    var pr = (color === WHITE) ? r - 1 : r + 1;
    for (var df = -1; df <= 1; df += 2) {
      if (onBoard(f + df, pr)) {
        piece = this.board[makeSq(f + df, pr)];
        if (piece && colorOf(piece) === color &&
            piece.toLowerCase() === 'p') return true;
      }
    }

    // Knights
    for (i = 0; i < KNIGHT_DELTAS.length; i++) {
      tf = f + KNIGHT_DELTAS[i][0];
      tr = r + KNIGHT_DELTAS[i][1];
      if (onBoard(tf, tr)) {
        piece = this.board[makeSq(tf, tr)];
        if (piece && colorOf(piece) === color &&
            piece.toLowerCase() === 'n') return true;
      }
    }

    // King
    for (i = 0; i < KING_DELTAS.length; i++) {
      tf = f + KING_DELTAS[i][0];
      tr = r + KING_DELTAS[i][1];
      if (onBoard(tf, tr)) {
        piece = this.board[makeSq(tf, tr)];
        if (piece && colorOf(piece) === color &&
            piece.toLowerCase() === 'k') return true;
      }
    }

    // Bishops / Queens (diagonal)
    for (d = 0; d < BISHOP_DIRS.length; d++) {
      tf = f; tr = r;
      while (true) {
        tf += BISHOP_DIRS[d][0]; tr += BISHOP_DIRS[d][1];
        if (!onBoard(tf, tr)) break;
        tsq = makeSq(tf, tr);
        piece = this.board[tsq];
        if (piece) {
          if (colorOf(piece) === color &&
              (piece.toLowerCase() === 'b' || piece.toLowerCase() === 'q'))
            return true;
          break;
        }
      }
    }

    // Rooks / Queens (orthogonal)
    for (d = 0; d < ROOK_DIRS.length; d++) {
      tf = f; tr = r;
      while (true) {
        tf += ROOK_DIRS[d][0]; tr += ROOK_DIRS[d][1];
        if (!onBoard(tf, tr)) break;
        tsq = makeSq(tf, tr);
        piece = this.board[tsq];
        if (piece) {
          if (colorOf(piece) === color &&
              (piece.toLowerCase() === 'r' || piece.toLowerCase() === 'q'))
            return true;
          break;
        }
      }
    }
    return false;
  };

  Chess.prototype.kingSquare = function (color) {
    var k = (color === WHITE) ? 'K' : 'k';
    for (var i = 0; i < 64; i++) if (this.board[i] === k) return i;
    return -1;
  };

  Chess.prototype.inCheck = function (color) {
    color = color || this.turn;
    var ks = this.kingSquare(color);
    if (ks < 0) return false;
    return this.isAttacked(ks, color === WHITE ? BLACK : WHITE);
  };

  // Generate pseudo-legal moves for the side to move (or a given square).
  Chess.prototype._pseudoMoves = function (onlySquare) {
    var moves = [];
    var us = this.turn;
    var them = (us === WHITE) ? BLACK : WHITE;
    var self = this;

    function add(from, to, opts) {
      opts = opts || {};
      moves.push({
        from: from, to: to,
        piece: self.board[from],
        captured: opts.captured || self.board[to] || (opts.ep ? (us === WHITE ? 'p' : 'P') : ''),
        promotion: opts.promotion || null,
        flags: opts.flags || (self.board[to] ? 'c' : 'n'),
        ep: !!opts.ep,
        castle: opts.castle || null
      });
    }

    for (var sq = 0; sq < 64; sq++) {
      if (onlySquare != null && sq !== onlySquare) continue;
      var piece = this.board[sq];
      if (!piece || colorOf(piece) !== us) continue;
      var f = fileOf(sq), r = rankOf(sq);
      var type = piece.toLowerCase();
      var i, d, tf, tr, tsq, target;

      if (type === 'p') {
        var dir = (us === WHITE) ? 1 : -1;       // rank increase direction
        var startRank = (us === WHITE) ? 2 : 7;
        var promoRank = (us === WHITE) ? 8 : 1;
        // forward one
        if (onBoard(f, r + dir) && !this.board[makeSq(f, r + dir)]) {
          var one = makeSq(f, r + dir);
          if (r + dir === promoRank) {
            ['q', 'r', 'b', 'n'].forEach(function (pp) {
              add(sq, one, { promotion: pp, flags: 'np' });
            });
          } else {
            add(sq, one, { flags: 'n' });
            // forward two
            if (r === startRank && !this.board[makeSq(f, r + 2 * dir)]) {
              add(sq, makeSq(f, r + 2 * dir), { flags: 'b' });
            }
          }
        }
        // captures
        for (var dfp = -1; dfp <= 1; dfp += 2) {
          if (!onBoard(f + dfp, r + dir)) continue;
          tsq = makeSq(f + dfp, r + dir);
          target = this.board[tsq];
          if (target && colorOf(target) === them) {
            if (r + dir === promoRank) {
              ['q', 'r', 'b', 'n'].forEach(function (pp) {
                add(sq, tsq, { promotion: pp, flags: 'cp' });
              });
            } else {
              add(sq, tsq, { flags: 'c' });
            }
          } else if (this.epSquare != null && tsq === this.epSquare) {
            add(sq, tsq, { ep: true, flags: 'e' });
          }
        }
      } else if (type === 'n') {
        for (i = 0; i < KNIGHT_DELTAS.length; i++) {
          tf = f + KNIGHT_DELTAS[i][0]; tr = r + KNIGHT_DELTAS[i][1];
          if (!onBoard(tf, tr)) continue;
          tsq = makeSq(tf, tr); target = this.board[tsq];
          if (!target || colorOf(target) === them) add(sq, tsq);
        }
      } else if (type === 'k') {
        for (i = 0; i < KING_DELTAS.length; i++) {
          tf = f + KING_DELTAS[i][0]; tr = r + KING_DELTAS[i][1];
          if (!onBoard(tf, tr)) continue;
          tsq = makeSq(tf, tr); target = this.board[tsq];
          if (!target || colorOf(target) === them) add(sq, tsq);
        }
        // castling
        var rank = (us === WHITE) ? 1 : 8;
        if (r === rank && f === 4) {
          var kSide = (us === WHITE) ? this.castling.K : this.castling.k;
          var qSide = (us === WHITE) ? this.castling.Q : this.castling.q;
          if (kSide &&
              !this.board[makeSq(5, rank)] && !this.board[makeSq(6, rank)] &&
              this.board[makeSq(7, rank)] && this.board[makeSq(7, rank)].toLowerCase() === 'r' &&
              !this.isAttacked(makeSq(4, rank), them) &&
              !this.isAttacked(makeSq(5, rank), them) &&
              !this.isAttacked(makeSq(6, rank), them)) {
            add(sq, makeSq(6, rank), { castle: 'k', flags: 'k' });
          }
          if (qSide &&
              !this.board[makeSq(3, rank)] && !this.board[makeSq(2, rank)] &&
              !this.board[makeSq(1, rank)] &&
              this.board[makeSq(0, rank)] && this.board[makeSq(0, rank)].toLowerCase() === 'r' &&
              !this.isAttacked(makeSq(4, rank), them) &&
              !this.isAttacked(makeSq(3, rank), them) &&
              !this.isAttacked(makeSq(2, rank), them)) {
            add(sq, makeSq(2, rank), { castle: 'q', flags: 'q' });
          }
        }
      } else {
        // sliding pieces
        var dirs = (type === 'b') ? BISHOP_DIRS :
                   (type === 'r') ? ROOK_DIRS :
                   BISHOP_DIRS.concat(ROOK_DIRS); // queen
        for (d = 0; d < dirs.length; d++) {
          tf = f; tr = r;
          while (true) {
            tf += dirs[d][0]; tr += dirs[d][1];
            if (!onBoard(tf, tr)) break;
            tsq = makeSq(tf, tr); target = this.board[tsq];
            if (!target) { add(sq, tsq); }
            else {
              if (colorOf(target) === them) add(sq, tsq);
              break;
            }
          }
        }
      }
    }
    return moves;
  };

  // Apply a move object to the board (mutates). Returns an undo record.
  Chess.prototype._applyMove = function (m) {
    var undo = {
      move: m,
      board: this.board.slice(),
      turn: this.turn,
      castling: Object.assign({}, this.castling),
      epSquare: this.epSquare,
      halfmoves: this.halfmoves,
      fullmoves: this.fullmoves
    };
    var us = this.turn;
    var piece = this.board[m.from];
    var captured = this.board[m.to];

    this.board[m.to] = piece;
    this.board[m.from] = '';

    // en passant capture removes the pawn behind the target
    if (m.ep) {
      var capRank = rankOf(m.to) + (us === WHITE ? -1 : 1);
      this.board[makeSq(fileOf(m.to), capRank)] = '';
    }

    // promotion
    if (m.promotion) {
      this.board[m.to] = (us === WHITE) ? m.promotion.toUpperCase() : m.promotion;
    }

    // castling: move the rook
    if (m.castle) {
      var rank = (us === WHITE) ? 1 : 8;
      if (m.castle === 'k') {
        this.board[makeSq(5, rank)] = this.board[makeSq(7, rank)];
        this.board[makeSq(7, rank)] = '';
      } else {
        this.board[makeSq(3, rank)] = this.board[makeSq(0, rank)];
        this.board[makeSq(0, rank)] = '';
      }
    }

    // update castling rights
    var t = piece.toLowerCase();
    if (t === 'k') {
      if (us === WHITE) { this.castling.K = false; this.castling.Q = false; }
      else { this.castling.k = false; this.castling.q = false; }
    }
    // rook moved or captured
    function clearRook(self, sq) {
      if (sq === makeSq(0, 1)) self.castling.Q = false;
      if (sq === makeSq(7, 1)) self.castling.K = false;
      if (sq === makeSq(0, 8)) self.castling.q = false;
      if (sq === makeSq(7, 8)) self.castling.k = false;
    }
    clearRook(this, m.from);
    clearRook(this, m.to);

    // en passant target
    if (t === 'p' && Math.abs(rankOf(m.to) - rankOf(m.from)) === 2) {
      this.epSquare = makeSq(fileOf(m.from), (rankOf(m.from) + rankOf(m.to)) / 2);
    } else {
      this.epSquare = null;
    }

    // clocks
    if (t === 'p' || captured) this.halfmoves = 0;
    else this.halfmoves++;
    if (us === BLACK) this.fullmoves++;

    this.turn = (us === WHITE) ? BLACK : WHITE;
    return undo;
  };

  Chess.prototype._undoMove = function (undo) {
    this.board = undo.board;
    this.turn = undo.turn;
    this.castling = undo.castling;
    this.epSquare = undo.epSquare;
    this.halfmoves = undo.halfmoves;
    this.fullmoves = undo.fullmoves;
  };

  // Fully legal moves (filters out those leaving own king in check).
  Chess.prototype.moves = function (opts) {
    opts = opts || {};
    var onlySquare = opts.square != null ? nameToSq(opts.square) : null;
    var pseudo = this._pseudoMoves(onlySquare);
    var legal = [];
    var us = this.turn;
    for (var i = 0; i < pseudo.length; i++) {
      var m = pseudo[i];
      var undo = this._applyMove(m);
      if (!this.inCheck(us)) legal.push(m);
      this._undoMove(undo);
    }
    if (opts.verbose) {
      return legal.map(function (m) {
        return {
          from: sqName(m.from), to: sqName(m.to),
          piece: m.piece, captured: m.captured || null,
          promotion: m.promotion, flags: m.flags,
          san: null
        };
      });
    }
    return legal;
  };

  // Build SAN for a move given the current (pre-move) position.
  Chess.prototype._san = function (m, legalList) {
    if (m.castle === 'k') return 'O-O';
    if (m.castle === 'q') return 'O-O-O';
    var piece = m.piece.toLowerCase();
    var to = sqName(m.to);
    var san = '';
    if (piece === 'p') {
      if (m.captured || m.ep) san += 'abcdefgh'[fileOf(m.from)] + 'x';
      san += to;
      if (m.promotion) san += '=' + m.promotion.toUpperCase();
    } else {
      san += piece.toUpperCase();
      // disambiguation
      var sameTarget = legalList.filter(function (x) {
        return x.to === m.to && x.piece === m.piece && x.from !== m.from;
      });
      if (sameTarget.length) {
        var sameFile = sameTarget.some(function (x) { return fileOf(x.from) === fileOf(m.from); });
        var sameRank = sameTarget.some(function (x) { return rankOf(x.from) === rankOf(m.from); });
        if (!sameFile) san += 'abcdefgh'[fileOf(m.from)];
        else if (!sameRank) san += rankOf(m.from);
        else san += sqName(m.from);
      }
      if (m.captured || m.ep) san += 'x';
      san += to;
    }
    // check / mate suffix
    var undo = this._applyMove(m);
    if (this.inCheck(this.turn)) {
      san += this.moves().length === 0 ? '#' : '+';
    }
    this._undoMove(undo);
    return san;
  };

  // Make a move. Accepts {from,to,promotion} (algebraic squares) or SAN string.
  Chess.prototype.move = function (input) {
    var legal = this.moves();
    var chosen = null;

    if (typeof input === 'string') {
      var clean = input.replace(/[+#!?]/g, '');
      for (var i = 0; i < legal.length; i++) {
        if (this._san(legal[i], legal).replace(/[+#!?]/g, '') === clean) {
          chosen = legal[i]; break;
        }
      }
    } else {
      var fromSq = nameToSq(input.from), toSq = nameToSq(input.to);
      for (var j = 0; j < legal.length; j++) {
        if (legal[j].from === fromSq && legal[j].to === toSq) {
          if (legal[j].promotion) {
            if (legal[j].promotion === (input.promotion || 'q')) { chosen = legal[j]; break; }
          } else { chosen = legal[j]; break; }
        }
      }
    }
    if (!chosen) return null;

    var san = this._san(chosen, legal);
    var result = {
      color: this.turn,
      from: sqName(chosen.from),
      to: sqName(chosen.to),
      piece: chosen.piece.toLowerCase(),
      captured: chosen.captured ? chosen.captured.toLowerCase() : null,
      promotion: chosen.promotion,
      flags: chosen.flags,
      san: san
    };
    this._applyMove(chosen);
    this._history = this._history || [];
    this._history.push({ san: san, fen: this.fen() });
    return result;
  };

  Chess.prototype.history = function () {
    return (this._history || []).map(function (h) { return h.san; });
  };

  Chess.prototype.isCheckmate = function () {
    return this.inCheck() && this.moves().length === 0;
  };
  Chess.prototype.isStalemate = function () {
    return !this.inCheck() && this.moves().length === 0;
  };
  Chess.prototype.isCheck = function () { return this.inCheck(); };
  Chess.prototype.isDraw = function () {
    return this.isStalemate() || this.halfmoves >= 100 ||
      this.isInsufficientMaterial();
  };
  Chess.prototype.isInsufficientMaterial = function () {
    var pieces = this.board.filter(function (p) { return p; });
    var nonKings = pieces.filter(function (p) { return p.toLowerCase() !== 'k'; });
    if (nonKings.length === 0) return true;
    if (nonKings.length === 1 &&
        (nonKings[0].toLowerCase() === 'b' || nonKings[0].toLowerCase() === 'n'))
      return true;
    return false;
  };
  Chess.prototype.isGameOver = function () {
    return this.moves().length === 0 || this.isDraw();
  };

  // expose helpers used by UI
  Chess.prototype.board2d = function () {
    var grid = [];
    for (var r = 0; r < 8; r++) {
      var row = [];
      for (var c = 0; c < 8; c++) {
        var p = this.board[r * 8 + c];
        row.push(p ? { type: p.toLowerCase(), color: colorOf(p), square: sqName(r * 8 + c) } : null);
      }
      grid.push(row);
    }
    return grid;
  };

  Chess.SQUARES_HELPERS = { sqName: sqName, nameToSq: nameToSq, fileOf: fileOf, rankOf: rankOf };
  Chess.START_FEN = START_FEN;

  global.Chess = Chess;
})(typeof window !== 'undefined' ? window : this);
