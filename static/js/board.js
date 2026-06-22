/* =========================================================================
 * board.js  —  interactive chessboard renderer (no images, no deps).
 * Pieces are drawn with Unicode glyphs styled to read on a dark theme.
 * Supports click-to-move and drag-to-move, legal-move dots, last-move and
 * check highlights, board flipping and a promotion picker.
 *
 *   var board = new ChessBoard(el, {
 *     position: fen, orientation: 'white', interactive: true,
 *     onMove: function(move){ ... },          // user completed a legal move
 *     legalFor: function(square){ return [...] } // optional override
 *   });
 *   board.setPosition(fen); board.flip(); board.highlight([...]);
 * ========================================================================= */
(function (global) {
  'use strict';

  var GLYPH = {
    wp: '♙', wn: '♘', wb: '♗', wr: '♖', wq: '♕', wk: '♔',
    bp: '♟', bn: '♞', bb: '♝', br: '♜', bq: '♛', bk: '♚'
  };
  var FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];

  function ChessBoard(el, opts) {
    opts = opts || {};
    this.el = el;
    this.game = new global.Chess(opts.position || global.Chess.START_FEN);
    this.orientation = opts.orientation || 'white';
    this.interactive = opts.interactive !== false;
    this.onMove = opts.onMove || function () {};
    this.onUserHint = opts.onUserHint || null;
    this.showCoords = opts.showCoords !== false;
    this.selected = null;
    this.lastMove = null;
    this.extraHighlights = [];
    this.pendingPromotion = null;
    this.allowColors = opts.allowColors || null; // e.g. 'w' to only let white move
    this._build();
    this.render();
  }

  ChessBoard.prototype._build = function () {
    this.el.classList.add('cb-board');
    this.el.innerHTML = '';
    this.squares = {};
    var ranks = this.orientation === 'white' ? [8,7,6,5,4,3,2,1] : [1,2,3,4,5,6,7,8];
    var files = this.orientation === 'white' ? FILES : FILES.slice().reverse();
    var self = this;
    for (var r = 0; r < 8; r++) {
      for (var f = 0; f < 8; f++) {
        var name = files[f] + ranks[r];
        var sq = document.createElement('div');
        sq.className = 'cb-sq ' + (((ranks[r] + FILES.indexOf(files[f])) % 2 === 0) ? 'dark' : 'light');
        sq.dataset.square = name;
        if (this.showCoords) {
          if (f === 0) {
            var rl = document.createElement('span');
            rl.className = 'cb-coord cb-rank';
            rl.textContent = ranks[r];
            sq.appendChild(rl);
          }
          if (r === 7) {
            var fl = document.createElement('span');
            fl.className = 'cb-coord cb-file';
            fl.textContent = files[f];
            sq.appendChild(fl);
          }
        }
        this.squares[name] = sq;
        this.el.appendChild(sq);
      }
    }
    // event delegation
    this.el.addEventListener('click', function (e) {
      var sqEl = e.target.closest('.cb-sq');
      if (!sqEl) return;
      self._onSquareClick(sqEl.dataset.square);
    });
    // drag support
    this.el.addEventListener('pointerdown', function (e) {
      var pieceEl = e.target.closest('.cb-piece');
      if (!pieceEl || !self.interactive) return;
      var sqEl = pieceEl.closest('.cb-sq');
      self._startDrag(sqEl.dataset.square, pieceEl, e);
    });
  };

  ChessBoard.prototype._canMove = function () {
    if (!this.interactive) return false;
    if (this.allowColors && this.game.turn !== this.allowColors) return false;
    return true;
  };

  ChessBoard.prototype._onSquareClick = function (name) {
    if (this.pendingPromotion) return;
    if (!this._canMove()) return;
    var piece = this.game.get(name);
    if (this.selected) {
      if (name === this.selected) { this.selected = null; this.render(); return; }
      // try move
      var legal = this.game.moves({ square: this.selected, verbose: true });
      var match = legal.filter(function (m) { return m.to === name; });
      if (match.length) {
        this._commitMove(this.selected, name, match);
        return;
      }
      // reselect own piece
      if (piece && colorChar(piece) === this.game.turn) {
        this.selected = name; this.render(); return;
      }
      this.selected = null; this.render(); return;
    }
    if (piece && colorChar(piece) === this.game.turn) {
      this.selected = name; this.render();
    }
  };

  ChessBoard.prototype._commitMove = function (from, to, legalMatches) {
    var needsPromo = legalMatches.some(function (m) { return m.promotion; });
    var self = this;
    if (needsPromo) {
      this._showPromotion(to, function (piece) {
        self._doMove(from, to, piece);
      });
      return;
    }
    this._doMove(from, to, null);
  };

  ChessBoard.prototype._doMove = function (from, to, promotion) {
    var mv = this.game.move({ from: from, to: to, promotion: promotion || 'q' });
    if (!mv) { this.selected = null; this.render(); return; }
    this.lastMove = { from: from, to: to };
    this.selected = null;
    this.extraHighlights = [];
    this.render();
    this.onMove(mv, this.game);
  };

  ChessBoard.prototype._startDrag = function (from, pieceEl, e) {
    if (this.pendingPromotion) return;
    if (!this._canMove()) return;
    var piece = this.game.get(from);
    if (!piece || colorChar(piece) !== this.game.turn) return;
    this.selected = from;
    this.render();

    var self = this;
    var rect = this.el.getBoundingClientRect();
    var size = rect.width / 8;
    var floatEl = this.squares[from].querySelector('.cb-piece').cloneNode(true);
    floatEl.classList.add('cb-dragging');
    floatEl.style.width = size + 'px';
    floatEl.style.height = size + 'px';
    document.body.appendChild(floatEl);
    var orig = this.squares[from].querySelector('.cb-piece');
    if (orig) orig.style.opacity = '0.25';

    function move(ev) {
      floatEl.style.left = (ev.clientX - size / 2) + 'px';
      floatEl.style.top = (ev.clientY - size / 2) + 'px';
    }
    function up(ev) {
      document.removeEventListener('pointermove', move);
      document.removeEventListener('pointerup', up);
      floatEl.remove();
      var target = document.elementFromPoint(ev.clientX, ev.clientY);
      var sqEl = target && target.closest('.cb-sq');
      if (sqEl) {
        var to = sqEl.dataset.square;
        var legal = self.game.moves({ square: from, verbose: true });
        var match = legal.filter(function (m) { return m.to === to; });
        if (match.length) { self._commitMove(from, to, match); return; }
      }
      self.selected = null;
      self.render();
    }
    move(e);
    document.addEventListener('pointermove', move);
    document.addEventListener('pointerup', up);
  };

  ChessBoard.prototype._showPromotion = function (square, cb) {
    this.pendingPromotion = true;
    var color = this.game.turn;
    var overlay = document.createElement('div');
    overlay.className = 'cb-promo-overlay';
    var box = document.createElement('div');
    box.className = 'cb-promo';
    var self = this;
    ['q', 'r', 'b', 'n'].forEach(function (t) {
      var btn = document.createElement('button');
      btn.className = 'cb-promo-btn';
      btn.textContent = GLYPH[color + t];
      btn.onclick = function () {
        overlay.remove();
        self.pendingPromotion = false;
        cb(t);
      };
      box.appendChild(btn);
    });
    overlay.appendChild(box);
    overlay.onclick = function (e) {
      if (e.target === overlay) { overlay.remove(); self.pendingPromotion = false; self.selected = null; self.render(); }
    };
    this.el.appendChild(overlay);
  };

  ChessBoard.prototype.render = function () {
    var grid = this.game.board2d();
    var checkSq = null;
    if (this.game.inCheck()) {
      checkSq = global.Chess.SQUARES_HELPERS.sqName(this.game.kingSquare(this.game.turn));
    }
    for (var name in this.squares) {
      var sq = this.squares[name];
      // clear classes except base
      sq.classList.remove('sel', 'last', 'check', 'hl');
      var existing = sq.querySelector('.cb-piece');
      if (existing) existing.remove();
      var dots = sq.querySelectorAll('.cb-dot, .cb-ring');
      dots.forEach(function (d) { d.remove(); });

      var idx = nameToIdx(name);
      var piece = grid[Math.floor(idx / 8)][idx % 8];
      if (piece) {
        var span = document.createElement('span');
        span.className = 'cb-piece ' + piece.color + piece.type;
        span.textContent = GLYPH[piece.color + piece.type];
        sq.appendChild(span);
      }
      if (this.lastMove && (name === this.lastMove.from || name === this.lastMove.to)) sq.classList.add('last');
      if (this.selected === name) sq.classList.add('sel');
      if (checkSq === name) sq.classList.add('check');
      if (this.extraHighlights.indexOf(name) >= 0) sq.classList.add('hl');
    }
    // legal-move dots for selected piece
    if (this.selected && this._canMove()) {
      var legal = this.game.moves({ square: this.selected, verbose: true });
      var self = this;
      legal.forEach(function (m) {
        var sq = self.squares[m.to];
        if (!sq) return;
        var marker = document.createElement('span');
        marker.className = self.game.get(m.to) ? 'cb-ring' : 'cb-dot';
        sq.appendChild(marker);
      });
    }
  };

  ChessBoard.prototype.setPosition = function (fen, lastMove) {
    this.game.load(fen);
    this.selected = null;
    this.lastMove = lastMove || null;
    this.extraHighlights = [];
    this.render();
  };
  ChessBoard.prototype.getFen = function () { return this.game.fen(); };
  ChessBoard.prototype.flip = function () {
    this.orientation = (this.orientation === 'white') ? 'black' : 'white';
    this._build();
    this.render();
  };
  ChessBoard.prototype.setOrientation = function (o) {
    if (o !== this.orientation) this.flip();
  };
  ChessBoard.prototype.highlight = function (squares) {
    this.extraHighlights = squares || [];
    this.render();
  };
  ChessBoard.prototype.setInteractive = function (v) { this.interactive = v; };
  // programmatic move (for engine/puzzle replies)
  ChessBoard.prototype.applyMove = function (sanOrObj) {
    var mv = this.game.move(sanOrObj);
    if (mv) {
      this.lastMove = { from: mv.from, to: mv.to };
      this.render();
    }
    return mv;
  };

  function colorChar(piece) {
    return piece === piece.toUpperCase() ? 'w' : 'b';
  }
  function nameToIdx(name) {
    var f = FILES.indexOf(name[0]);
    var r = parseInt(name[1], 10);
    return (8 - r) * 8 + f;
  }

  global.ChessBoard = ChessBoard;
})(typeof window !== 'undefined' ? window : this);
