/* =========================================================================
 * app.js  —  SPA shell + hash router + all views.
 * A combination of chess.com/home (dashboard, play cards, daily games) and
 * chessigma.com (dark training UI, Coach Froggy, Top Solvers, Train/Tools
 * menus). Pure vanilla JS so it runs under VSCode Live Server unmodified.
 * ========================================================================= */
(function (global) {
  'use strict';

  var D = global.DATA;

  /* ----------------------------- tiny helpers ---------------------------- */
  function h(tag, attrs, children) {
    var el = document.createElement(tag);
    if (attrs) {
      for (var k in attrs) {
        if (k === 'class') el.className = attrs[k];
        else if (k === 'html') el.innerHTML = attrs[k];
        else if (k.slice(0, 2) === 'on' && typeof attrs[k] === 'function') {
          el.addEventListener(k.slice(2).toLowerCase(), attrs[k]);
        } else if (attrs[k] != null) el.setAttribute(k, attrs[k]);
      }
    }
    (children || []).forEach(function (c) {
      if (c == null) return;
      el.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
    });
    return el;
  }
  function clear(el) { while (el.firstChild) el.removeChild(el.firstChild); }

  /* ---------------------------- profile state ---------------------------- */
  var Profile = {
    key: 'chessigma_profile_v1',
    data: null,
    load: function () {
      try { this.data = JSON.parse(localStorage.getItem(this.key)); } catch (e) {}
      if (!this.data) {
        this.data = {
          name: 'alant4L', streak: 13, puzzleRating: 495, puzzleStreak: 8,
          puzzlesSolved: 0, gamesPlayed: 0, wins: 0, league: 'Crystal', leaguePts: 45
        };
      }
      return this.data;
    },
    save: function () { localStorage.setItem(this.key, JSON.stringify(this.data)); }
  };
  Profile.load();

  /* ------------------------------- sidebar ------------------------------- */
  function sidebar(active) {
    var items = [
      { id: 'home',   label: 'Home',       icon: '🏠', route: '#/home' },
      { id: 'play',   label: 'Play',       icon: '♟️', route: '#/play' },
      { id: 'puzzles',label: 'Puzzles',    icon: '🧩', route: '#/puzzles' },
      { id: 'train',  label: 'Train', tag: 'NEW', icon: '⚡', route: '#/train' },
      { id: 'tools',  label: 'Tools',      icon: '🛠️', route: '#/tools' },
      { id: 'learn',  label: 'Learn',      icon: '🎓', route: '#/openings' },
      { id: 'about',  label: 'About',      icon: 'ℹ️', route: '#/about' }
    ];
    return h('aside', { class: 'sidebar' }, [
      h('a', { class: 'brand', href: '#/home' }, [
        h('span', { class: 'brand-mark' }, ['♜']),
        h('span', { class: 'brand-name' }, ['Chessigma'])
      ]),
      h('nav', { class: 'nav' }, items.map(function (it) {
        return h('a', {
          class: 'nav-item' + (active === it.id ? ' active' : ''),
          href: it.route
        }, [
          h('span', { class: 'nav-ico' }, [it.icon]),
          h('span', { class: 'nav-label' }, [it.label]),
          it.tag ? h('span', { class: 'nav-tag' }, [it.tag]) : null,
          h('span', { class: 'nav-chev' }, ['›'])
        ]);
      })),
      h('div', { class: 'sidebar-foot' }, [
        h('div', { class: 'streak-chip' }, [
          h('span', { class: 'flame' }, ['🔥']),
          h('span', { class: 'streak-num' }, [String(Profile.data.streak)]),
          h('span', { class: 'streak-lbl' }, ['DAY STREAK'])
        ]),
        h('div', { class: 'week-dots' }, ['M','T','W','T','F','S','S'].map(function (d, i) {
          return h('span', { class: 'wd' + (i < Profile.data.streak % 7 ? ' on' : '') }, [d]);
        }))
      ])
    ]);
  }

  /* ---------------------------- right rail ------------------------------- */
  function coachCard(msg) {
    return h('div', { class: 'coach-card' }, [
      h('div', { class: 'coach-avatar' }, ['🐸']),
      h('div', { class: 'coach-bubble' }, [
        h('div', { class: 'coach-name' }, ['Coach Froggy']),
        h('div', { class: 'coach-msg' }, [msg || 'Ready to sharpen your tactical skills? Choose your puzzle adventure!'])
      ])
    ]);
  }

  function topSolvers() {
    var medals = { gold: '🥇', silver: '🥈', bronze: '🥉' };
    return h('div', { class: 'panel solvers' }, [
      h('div', { class: 'panel-head' }, [
        h('span', {}, ['🏆 Top Solvers']),
        h('a', { class: 'panel-link', href: '#/puzzles' }, ['View All →'])
      ]),
      h('div', { class: 'solver-list' }, D.LEADERBOARD.map(function (p) {
        return h('div', { class: 'solver-row' }, [
          h('span', { class: 'solver-medal' }, [medals[p.medal] || '•']),
          h('div', { class: 'solver-main' }, [
            h('div', { class: 'solver-name' }, [p.name]),
            h('div', { class: 'solver-sub' }, [p.solved.toLocaleString()])
          ]),
          h('div', { class: 'solver-stats' }, [
            h('span', { class: 'solver-streak' }, ['🔥 ' + p.streak]),
            h('span', { class: 'solver-acc' }, [p.acc + '%'])
          ])
        ]);
      }))
    ]);
  }

  function railCta() {
    return h('div', { class: 'rail-ctas' }, [
      h('a', { class: 'cta cta-amber', href: '#/puzzles' }, [
        h('div', { class: 'cta-title' }, ['🧩 Classic Puzzles']),
        h('div', { class: 'cta-sub' }, ['Solve tactical problems']),
        h('span', { class: 'cta-badge' }, ['FREE'])
      ]),
      h('a', { class: 'cta cta-dark', href: '#/puzzles' }, [
        h('div', { class: 'cta-title' }, ['📅 Daily Puzzle']),
        h('div', { class: 'cta-sub' }, ['A new challenge every day'])
      ]),
      h('a', { class: 'cta cta-rose', href: '#/play' }, [
        h('div', { class: 'cta-title' }, ['🎯 Blunder Training']),
        h('div', { class: 'cta-sub' }, ['Train your weaknesses']),
        h('span', { class: 'cta-badge badge-soft' }, ['SUPERCOACH'])
      ])
    ]);
  }

  /* ------------------------------- layout -------------------------------- */
  function layout(active, mainNodes, railNodes) {
    var root = document.getElementById('app');
    clear(root);
    var grid = h('div', { class: 'layout' }, [
      sidebar(active),
      h('main', { class: 'main' }, mainNodes),
      railNodes ? h('div', { class: 'rail' }, railNodes) : null
    ]);
    root.appendChild(grid);
  }

  /* ===================================================================== *
   *  VIEW: HOME  (chess.com dashboard + chessigma rail)
   * ===================================================================== */
  function viewHome() {
    var p = Profile.data;

    var miniPositions = {
      puzzle: '6k1/5ppp/8/8/8/8/5PPP/R5K1 w - - 0 1',
      lesson: global.Chess.START_FEN,
      review: '6k1/8/8/8/8/8/5Q2/4K2q w - - 0 1'
    };

    var header = h('div', { class: 'home-head' }, [
      h('div', { class: 'avatar-lg' }, ['👤']),
      h('div', { class: 'home-user' }, [
        h('span', { class: 'home-name' }, [p.name]),
        h('span', {}, ['🇺🇸 🪶'])
      ])
    ]);

    // top stat / action row
    var streakCol = h('div', { class: 'home-col' }, [
      h('div', { class: 'stat-head' }, [
        h('span', { class: 'stat-ico flame' }, ['🔥']),
        h('div', {}, [
          h('div', { class: 'stat-label' }, ['Streak']),
          h('div', { class: 'stat-big' }, [p.streak + ' Days'])
        ])
      ]),
      actionBtn('⏱️', 'Play 10 min', '#/play?t=600'),
      actionBtn('♟️', 'New Game', '#/play'),
      actionBtn('🤖', 'Play Bots', '#/play?bots=1'),
      actionBtn('🤝', 'Play a Friend', '#/play')
    ]);

    var puzzleCol = featureCard({
      icon: '🧩', label: 'Puzzles', big: p.puzzleRating + ' 🔥' + p.puzzleStreak,
      fen: miniPositions.puzzle, cta: 'Solve Puzzle', route: '#/puzzles'
    });
    var lessonCol = featureCard({
      icon: '🎓', label: 'Next Lesson', big: 'Advanced Openings: Develop with Tempo',
      small: true, fen: miniPositions.lesson, cta: 'Start Lesson', route: '#/openings'
    });
    var reviewCol = featureCard({
      icon: '⭐', label: 'Game Review', big: 'Learn from your mistakes',
      small: true, fen: miniPositions.review, cta: 'Review vs queencrusader', route: '#/review'
    });

    var statRow = h('div', { class: 'home-grid' }, [streakCol, puzzleCol, lessonCol, reviewCol]);

    var league = h('a', { class: 'league-bar', href: '#/puzzles' }, [
      h('span', { class: 'league-ico' }, ['🏆']),
      h('div', {}, [
        h('div', { class: 'league-name' }, [p.league + ' League']),
        h('div', { class: 'league-sub' }, ['2nd  🏅 ' + p.leaguePts])
      ]),
      h('span', { class: 'league-chev' }, ['›'])
    ]);

    var daily = h('div', { class: 'panel daily-games' }, [
      h('div', { class: 'panel-head' }, [h('span', {}, ['Daily Games (0)'])]),
      h('div', { class: 'daily-empty' }, [
        h('div', { class: 'mini-board-row' }, [miniBoard(global.Chess.START_FEN, 44)]),
        h('div', {}, [
          h('div', { class: 'daily-title' }, ['Recommended Match']),
          h('div', { class: 'daily-sub' }, ['bestguy10 (699)']),
          h('a', { class: 'btn btn-green sm', href: '#/play' }, ['Play'])
        ])
      ])
    ]);

    layout('home',
      [header, statRow, daily],
      [league, coachCard('Welcome back! You\'re on a ' + p.streak + '-day streak — keep it alive.'), topSolvers(), railCta()]
    );

    // render mini-boards after mount
    document.querySelectorAll('[data-mini]').forEach(function (el) {
      renderMiniBoard(el, el.dataset.mini, parseInt(el.dataset.size || '52', 10));
    });
  }

  function actionBtn(icon, label, route) {
    return h('a', { class: 'action-btn', href: route }, [
      h('span', { class: 'action-ico' }, [icon]),
      h('span', { class: 'action-label' }, [label])
    ]);
  }

  function featureCard(o) {
    return h('div', { class: 'home-col feature-col' }, [
      h('div', { class: 'stat-head' }, [
        h('span', { class: 'stat-ico' }, [o.icon]),
        h('div', {}, [
          h('div', { class: 'stat-label' }, [o.label]),
          h('div', { class: o.small ? 'stat-med' : 'stat-big' }, [o.big])
        ])
      ]),
      miniBoard(o.fen, 0, true),
      h('a', { class: 'feature-cta', href: o.route }, [o.cta])
    ]);
  }

  function miniBoard(fen, size, fill) {
    return h('div', {
      class: 'mini-board' + (fill ? ' fill' : ''),
      'data-mini': fen, 'data-size': size || (fill ? 0 : 52)
    }, []);
  }

  function renderMiniBoard(el, fen, size) {
    // static, non-interactive mini board using glyphs
    var GLYPH = {
      P:'♙',N:'♘',B:'♗',R:'♖',Q:'♕',K:'♔',
      p:'♟',n:'♞',b:'♝',r:'♜',q:'♛',k:'♚'
    };
    var rows = fen.split(' ')[0].split('/');
    clear(el);
    var grid = h('div', { class: 'mb-grid' }, []);
    for (var r = 0; r < 8; r++) {
      var file = 0;
      var rowStr = rows[r];
      for (var c = 0; c < rowStr.length; c++) {
        var ch = rowStr[c];
        if (/\d/.test(ch)) {
          for (var k = 0; k < parseInt(ch, 10); k++) {
            grid.appendChild(mbSquare(r, file, ''));
            file++;
          }
        } else {
          grid.appendChild(mbSquare(r, file, GLYPH[ch] || ''));
          file++;
        }
      }
    }
    el.appendChild(grid);
  }
  function mbSquare(r, c, glyph) {
    var dark = (r + c) % 2 === 1;
    var sq = h('div', { class: 'mb-sq ' + (dark ? 'dark' : 'light') }, []);
    if (glyph) {
      var sp = h('span', { class: 'mb-piece' }, [glyph]);
      sq.appendChild(sp);
    }
    return sq;
  }

  /* ===================================================================== *
   *  VIEW: PLAY  (vs bot)
   * ===================================================================== */
  var playState = null;
  function viewPlay() {
    var params = parseQuery();
    layout('play', [ h('div', { class: 'page-pad' }, [ playShell(params) ]) ], null);
  }

  function playShell(params) {
    var wrap = h('div', { class: 'play-wrap' }, []);
    var boardEl = h('div', { class: 'board-host' }, []);
    var side = h('div', { class: 'play-side' }, []);
    wrap.appendChild(h('div', { class: 'board-col' }, [
      h('div', { class: 'player-bar top' }, [
        h('span', { class: 'pb-avatar' }, ['🤖']),
        h('span', { class: 'pb-name', id: 'oppName' }, ['Opponent']),
        h('span', { class: 'pb-clock', id: 'clockTop' }, ['10:00'])
      ]),
      boardEl,
      h('div', { class: 'player-bar bottom' }, [
        h('span', { class: 'pb-avatar' }, ['👤']),
        h('span', { class: 'pb-name' }, [Profile.data.name]),
        h('span', { class: 'pb-clock', id: 'clockBot' }, ['10:00'])
      ])
    ]));
    wrap.appendChild(side);

    var board = new global.ChessBoard(boardEl, {
      position: global.Chess.START_FEN,
      orientation: 'white',
      allowColors: 'w',
      onMove: onUserMove
    });

    var state = {
      board: board, bot: D.BOTS[2], thinking: false, over: false,
      moves: [], result: null
    };
    playState = state;

    // bot picker
    var picker = h('div', { class: 'panel' }, [
      h('div', { class: 'panel-head' }, [h('span', {}, ['Choose your opponent'])]),
      h('div', { class: 'bot-list' }, D.BOTS.map(function (b) {
        return h('button', {
          class: 'bot-row' + (b.id === state.bot.id ? ' active' : ''),
          'data-bot': b.id,
          onclick: function () { selectBot(b); }
        }, [
          h('span', { class: 'bot-emoji' }, [b.emoji]),
          h('div', { class: 'bot-main' }, [
            h('div', { class: 'bot-name' }, [b.name]),
            h('div', { class: 'bot-blurb' }, [b.blurb])
          ]),
          h('span', { class: 'bot-elo' }, [String(b.elo)])
        ]);
      }))
    ]);

    var status = h('div', { class: 'play-status', id: 'playStatus' }, ['White to move']);
    var controls = h('div', { class: 'play-controls' }, [
      h('button', { class: 'btn btn-ghost', onclick: function () { board.flip(); } }, ['⇅ Flip']),
      h('button', { class: 'btn btn-ghost', onclick: newGame }, ['New Game']),
      h('button', { class: 'btn btn-ghost', onclick: function () { takeBack(); } }, ['↶ Undo'])
    ]);
    var movesPanel = h('div', { class: 'panel' }, [
      h('div', { class: 'panel-head' }, [h('span', {}, ['Moves'])]),
      h('div', { class: 'move-list', id: 'playMoves' }, [])
    ]);

    side.appendChild(coachCard('Pick a bot and make your move. I\'ll whisper if you blunder.'));
    side.appendChild(status);
    side.appendChild(controls);
    side.appendChild(picker);
    side.appendChild(movesPanel);

    // honor ?bots=1 — just scrolls focus; default already shows list
    function selectBot(b) {
      state.bot = b;
      document.querySelectorAll('.bot-row').forEach(function (r) {
        r.classList.toggle('active', r.dataset.bot === b.id);
      });
      document.getElementById('oppName').textContent = b.name + ' (' + b.elo + ')';
      newGame();
    }
    function newGame() {
      board.setPosition(global.Chess.START_FEN);
      board.setInteractive(true);
      state.over = false; state.moves = []; state.result = null;
      updateMoves(); setStatus('White to move');
    }
    function takeBack() {
      // undo last full move pair by replaying
      if (state.moves.length === 0) return;
      state.moves.pop(); // bot move
      if (state.moves.length && state.moves[state.moves.length - 1]) state.moves.pop();
      replay();
    }
    function replay() {
      var g = new global.Chess(global.Chess.START_FEN);
      state.moves.forEach(function (m) { g.move(m); });
      board.setPosition(g.fen());
      board.setInteractive(true);
      state.over = false;
      updateMoves();
      setStatus(g.turn === 'w' ? 'White to move' : 'Black to move');
    }
    function onUserMove(mv, game) {
      state.moves.push(mv.san);
      updateMoves();
      checkEnd(game);
      if (state.over) return;
      setStatus(state.bot.name + ' is thinking…');
      board.setInteractive(false);
      setTimeout(function () { botMove(); }, 350);
    }
    function botMove() {
      var fen = board.getFen();
      var best = global.Engine.pickMove(fen, state.bot.skill);
      if (!best) { board.setInteractive(true); return; }
      var mv = board.applyMove({ from: best.from, to: best.to, promotion: best.promotion || 'q' });
      if (mv) { state.moves.push(mv.san); updateMoves(); }
      checkEnd(board.game);
      if (!state.over) {
        board.setInteractive(true);
        setStatus(board.game.turn === 'w' ? 'White to move' : 'Black to move');
      }
    }
    function checkEnd(game) {
      if (game.isCheckmate()) {
        var winner = game.turn === 'w' ? 'Black' : 'White';
        setStatus('Checkmate — ' + winner + ' wins! 🏁');
        state.over = true; board.setInteractive(false);
        if (winner === 'White') { Profile.data.wins++; }
        Profile.data.gamesPlayed++; Profile.save();
      } else if (game.isStalemate()) {
        setStatus('Stalemate — draw.'); state.over = true; board.setInteractive(false);
      } else if (game.isDraw()) {
        setStatus('Draw.'); state.over = true; board.setInteractive(false);
      } else if (game.inCheck()) {
        setStatus('Check!');
      }
    }
    function setStatus(t) { var s = document.getElementById('playStatus'); if (s) s.textContent = t; }
    function updateMoves() {
      var list = document.getElementById('playMoves');
      if (!list) return;
      clear(list);
      for (var i = 0; i < state.moves.length; i += 2) {
        list.appendChild(h('div', { class: 'move-pair' }, [
          h('span', { class: 'move-no' }, [(i / 2 + 1) + '.']),
          h('span', { class: 'move-san' }, [state.moves[i] || '']),
          h('span', { class: 'move-san' }, [state.moves[i + 1] || ''])
        ]));
      }
      list.scrollTop = list.scrollHeight;
    }

    if (params.bots) { /* already on bot list */ }
    return wrap;
  }

  /* ===================================================================== *
   *  VIEW: PUZZLES
   * ===================================================================== */
  var puzzleState = null;
  function viewPuzzles() {
    layout('puzzles', [ h('div', { class: 'page-pad' }, [ puzzleShell() ]) ],
      [ coachCard('Find the best move. Wrong tries cost rating — take your time.'), topSolvers() ]);
  }

  function puzzleShell() {
    var wrap = h('div', { class: 'play-wrap' }, []);
    var boardEl = h('div', { class: 'board-host' }, []);
    var side = h('div', { class: 'play-side' }, []);
    wrap.appendChild(h('div', { class: 'board-col' }, [
      h('div', { class: 'player-bar top' }, [
        h('span', { class: 'pb-avatar' }, ['🧩']),
        h('span', { class: 'pb-name', id: 'puzTheme' }, ['Puzzle']),
        h('span', { class: 'pb-clock', id: 'puzRating' }, ['—'])
      ]),
      boardEl,
      h('div', { class: 'player-bar bottom' }, [
        h('span', { class: 'pb-avatar' }, ['👤']),
        h('span', { class: 'pb-name' }, [Profile.data.name]),
        h('span', { class: 'pb-clock' }, [String(Profile.data.puzzleRating)])
      ])
    ]));
    wrap.appendChild(side);

    var state = {
      idx: 0, game: null, solIdx: 0, board: null, solved: false
    };
    puzzleState = state;

    var board = new global.ChessBoard(boardEl, { interactive: true, onMove: onMove });
    state.board = board;

    var statusEl = h('div', { class: 'play-status', id: 'puzStatus' }, ['']);
    var ratingBar = h('div', { class: 'puz-rating' }, [
      h('span', { id: 'ratingNow' }, ['Your rating: ' + Profile.data.puzzleRating]),
      h('span', { class: 'puz-solved', id: 'solvedCount' }, ['Solved: ' + Profile.data.puzzlesSolved])
    ]);
    var controls = h('div', { class: 'play-controls' }, [
      h('button', { class: 'btn btn-ghost', onclick: hint }, ['💡 Hint']),
      h('button', { class: 'btn btn-ghost', onclick: function () { loadPuzzle(state.idx); } }, ['↻ Retry']),
      h('button', { class: 'btn btn-green', onclick: next }, ['Next →'])
    ]);

    side.appendChild(ratingBar);
    side.appendChild(statusEl);
    side.appendChild(controls);
    side.appendChild(h('div', { class: 'panel' }, [
      h('div', { class: 'panel-head' }, [h('span', {}, ['Themes'])]),
      h('div', { class: 'theme-tags', id: 'themeTags' }, [])
    ]));

    function loadPuzzle(i) {
      var pz = D.PUZZLES[i % D.PUZZLES.length];
      state.idx = i % D.PUZZLES.length;
      state.game = new global.Chess(pz.fen);
      state.solIdx = 0; state.solved = false;
      board.setPosition(pz.fen);
      var sideToMove = state.game.turn === 'w' ? 'White' : 'Black';
      board.setOrientation(state.game.turn === 'w' ? 'white' : 'black');
      board.setInteractive(true);
      setStatus(sideToMove + ' to move — find the best move.', '');
      document.getElementById('puzTheme').textContent = pz.theme;
      document.getElementById('puzRating').textContent = 'Rating ' + pz.rating;
      var tags = document.getElementById('themeTags');
      clear(tags);
      tags.appendChild(h('span', { class: 'tag' }, [pz.theme]));
      tags.appendChild(h('span', { class: 'tag' }, ['Rating ' + pz.rating]));
    }

    function onMove(mv) {
      var pz = D.PUZZLES[state.idx];
      var expected = pz.moves[state.solIdx];
      if (sanEq(mv.san, expected)) {
        state.solIdx++;
        if (state.solIdx >= pz.moves.length) {
          // solved
          state.solved = true;
          board.setInteractive(false);
          Profile.data.puzzlesSolved++;
          Profile.data.puzzleRating += 8;
          Profile.save();
          updateRating();
          setStatus('✅ Correct! Puzzle solved (+8).', 'ok');
        } else {
          // play opponent reply
          setStatus('✅ Best move! Keep going…', 'ok');
          setTimeout(function () {
            var reply = pz.moves[state.solIdx];
            board.applyMove(reply);
            state.solIdx++;
            board.setInteractive(true);
          }, 350);
        }
      } else {
        // wrong — revert
        board.setInteractive(false);
        Profile.data.puzzleRating = Math.max(100, Profile.data.puzzleRating - 5);
        Profile.save(); updateRating();
        setStatus('❌ Not the move. Try again (-5).', 'bad');
        setTimeout(function () { loadPuzzle(state.idx); }, 900);
      }
    }
    function hint() {
      var pz = D.PUZZLES[state.idx];
      setStatus('💡 ' + pz.hint, '');
      // also highlight the from-square of the expected move
      var best = global.Engine.bestMove(state.game.fen(), 3);
      if (best) board.highlight([best.from]);
    }
    function next() { loadPuzzle(state.idx + 1); }
    function setStatus(t, cls) {
      var s = document.getElementById('puzStatus');
      if (s) { s.textContent = t; s.className = 'play-status ' + (cls || ''); }
    }
    function updateRating() {
      var rn = document.getElementById('ratingNow');
      if (rn) rn.textContent = 'Your rating: ' + Profile.data.puzzleRating;
      var sc = document.getElementById('solvedCount');
      if (sc) sc.textContent = 'Solved: ' + Profile.data.puzzlesSolved;
    }

    // init after the shell is mounted by layout() so getElementById resolves
    setTimeout(function () { loadPuzzle(0); }, 0);
    return wrap;
  }

  /* ===================================================================== *
   *  VIEW: ANALYSIS / BOARD EDITOR / NEXT MOVE
   * ===================================================================== */
  function viewAnalysis() {
    layout('tools', [ h('div', { class: 'page-pad' }, [ analysisShell() ]) ], null);
  }
  function analysisShell() {
    var wrap = h('div', { class: 'play-wrap' }, []);
    var boardEl = h('div', { class: 'board-host' }, []);
    var side = h('div', { class: 'play-side' }, []);
    wrap.appendChild(h('div', { class: 'board-col' }, [
      h('div', { class: 'eval-bar-wrap' }, [ h('div', { class: 'eval-fill', id: 'evalFill' }, []) ]),
      boardEl
    ]));
    wrap.appendChild(side);

    var board = new global.ChessBoard(boardEl, { interactive: true, onMove: onMove });

    var evalText = h('div', { class: 'play-status', id: 'evalText' }, ['Evaluation: 0.00']);
    var bestLine = h('div', { class: 'best-line', id: 'bestLine' }, ['Best move: —']);
    var fenRow = h('div', { class: 'fen-row' }, [
      h('input', { class: 'fen-input', id: 'fenInput', value: global.Chess.START_FEN }),
      h('button', { class: 'btn btn-ghost sm', onclick: loadFen }, ['Load'])
    ]);
    var controls = h('div', { class: 'play-controls' }, [
      h('button', { class: 'btn btn-ghost', onclick: function () { board.flip(); } }, ['⇅ Flip']),
      h('button', { class: 'btn btn-ghost', onclick: reset }, ['Reset']),
      h('button', { class: 'btn btn-green', onclick: playBest }, ['▶ Play best move'])
    ]);
    var movesPanel = h('div', { class: 'panel' }, [
      h('div', { class: 'panel-head' }, [h('span', {}, ['Moves']),
        h('button', { class: 'panel-link', onclick: copyPgn }, ['Copy PGN'])]),
      h('div', { class: 'move-list', id: 'anMoves' }, [])
    ]);

    side.appendChild(h('h2', { class: 'page-title' }, ['Analysis Board']));
    side.appendChild(evalText);
    side.appendChild(bestLine);
    side.appendChild(fenRow);
    side.appendChild(controls);
    side.appendChild(movesPanel);

    var moves = [];
    function onMove(mv) { moves.push(mv.san); refresh(); }
    function refresh() {
      var fen = board.getFen();
      document.getElementById('fenInput').value = fen;
      var score = global.Engine.evaluate(fen) / 100;
      var disp = (score >= 0 ? '+' : '') + score.toFixed(2);
      document.getElementById('evalText').textContent = 'Evaluation: ' + disp + ' (White ' + (score >= 0 ? 'better' : 'worse') + ')';
      var pct = Math.max(2, Math.min(98, 50 + score * 5));
      document.getElementById('evalFill').style.height = pct + '%';
      if (board.game.isGameOver()) {
        document.getElementById('bestLine').textContent = board.game.isCheckmate() ? 'Checkmate.' : 'Game over.';
      } else {
        var best = global.Engine.bestMove(fen, 3);
        document.getElementById('bestLine').textContent = best ? 'Best move: ' + best.san : 'Best move: —';
      }
      var list = document.getElementById('anMoves'); clear(list);
      for (var i = 0; i < moves.length; i += 2) {
        list.appendChild(h('div', { class: 'move-pair' }, [
          h('span', { class: 'move-no' }, [(i / 2 + 1) + '.']),
          h('span', { class: 'move-san' }, [moves[i] || '']),
          h('span', { class: 'move-san' }, [moves[i + 1] || ''])
        ]));
      }
    }
    function playBest() {
      var best = global.Engine.bestMove(board.getFen(), 3);
      if (best) { var mv = board.applyMove({ from: best.from, to: best.to, promotion: 'q' }); if (mv) { moves.push(mv.san); refresh(); } }
    }
    function loadFen() {
      var v = document.getElementById('fenInput').value.trim();
      try { board.setPosition(v); moves = []; refresh(); }
      catch (e) { document.getElementById('evalText').textContent = 'Invalid FEN.'; }
    }
    function reset() { board.setPosition(global.Chess.START_FEN); moves = []; refresh(); }
    function copyPgn() {
      var pgn = '';
      for (var i = 0; i < moves.length; i += 2) {
        pgn += (i / 2 + 1) + '. ' + moves[i] + (moves[i + 1] ? ' ' + moves[i + 1] + ' ' : ' ');
      }
      navigator.clipboard && navigator.clipboard.writeText(pgn.trim());
      document.getElementById('evalText').textContent = 'PGN copied to clipboard.';
    }
    // init after the shell is mounted by layout() so getElementById resolves
    setTimeout(refresh, 0);
    return wrap;
  }

  /* ===================================================================== *
   *  VIEW: GAME REVIEW
   * ===================================================================== */
  function viewReview() {
    layout('tools', [ h('div', { class: 'page-pad' }, [ reviewShell() ]) ], null);
  }
  function reviewShell() {
    var wrap = h('div', { class: 'play-wrap' }, []);
    var boardEl = h('div', { class: 'board-host' }, []);
    var side = h('div', { class: 'play-side' }, []);
    wrap.appendChild(h('div', { class: 'board-col' }, [boardEl]));
    wrap.appendChild(side);

    var board = new global.ChessBoard(boardEl, { interactive: false });
    var positions = [global.Chess.START_FEN];
    var sans = [];
    var ptr = 0;

    var sampleGame = '1. e4 e5 2. Nf3 Nc6 3. Bc4 Bc5 4. b4 Bxb4 5. c3 Ba5 6. d4 exd4 7. O-O d6 8. Qb3 Qf6 9. e5 Qg6 10. Re1 Nge7 11. Ba3 b5 12. Qxb5 Rb8 13. Qa4 Bb6 14. Nbd2 Bb7 15. Ne4 Qf5 16. Bxd3 Qh5 17. Nf6+ gxf6 18. exf6 Rg8 19. Rad1 Qxf3 20. Rxe7+ Nxe7 21. Qxd7+ Kxd7 22. Bf5+ Ke8 23. Bd7+ Kf8 24. Bxe7#';

    var pgnInput = h('textarea', { class: 'pgn-input', id: 'pgnInput', rows: '3',
      placeholder: 'Paste PGN here, or use the sample game…' }, [sampleGame]);
    var loadBtn = h('button', { class: 'btn btn-green', onclick: loadPgn }, ['Analyze game']);

    var evalText = h('div', { class: 'play-status', id: 'revEval' }, ['Load a game to begin.']);
    var nav = h('div', { class: 'play-controls' }, [
      h('button', { class: 'btn btn-ghost', onclick: function () { go(0); } }, ['⏮']),
      h('button', { class: 'btn btn-ghost', onclick: function () { go(ptr - 1); } }, ['◀']),
      h('button', { class: 'btn btn-ghost', onclick: function () { go(ptr + 1); } }, ['▶']),
      h('button', { class: 'btn btn-ghost', onclick: function () { go(positions.length - 1); } }, ['⏭'])
    ]);
    var movesPanel = h('div', { class: 'panel' }, [
      h('div', { class: 'panel-head' }, [h('span', {}, ['Moves'])]),
      h('div', { class: 'move-list', id: 'revMoves' }, [])
    ]);

    side.appendChild(h('h2', { class: 'page-title' }, ['Game Review']));
    side.appendChild(pgnInput);
    side.appendChild(loadBtn);
    side.appendChild(evalText);
    side.appendChild(nav);
    side.appendChild(movesPanel);

    function loadPgn() {
      var text = document.getElementById('pgnInput').value;
      var tokens = text.replace(/\{[^}]*\}/g, ' ')
        .replace(/\d+\.(\.\.)?/g, ' ')
        .replace(/(1-0|0-1|1\/2-1\/2|\*)/g, ' ')
        .trim().split(/\s+/).filter(Boolean);
      var g = new global.Chess(global.Chess.START_FEN);
      positions = [g.fen()]; sans = [];
      for (var i = 0; i < tokens.length; i++) {
        var mv = g.move(tokens[i]);
        if (!mv) break;
        sans.push(mv.san);
        positions.push(g.fen());
      }
      ptr = 0;
      renderMoves();
      go(0);
      document.getElementById('revEval').textContent = 'Loaded ' + sans.length + ' moves. Use ◀ ▶ to step through.';
    }
    function renderMoves() {
      var list = document.getElementById('revMoves'); clear(list);
      for (var i = 0; i < sans.length; i += 2) {
        var pair = h('div', { class: 'move-pair' }, [
          h('span', { class: 'move-no' }, [(i / 2 + 1) + '.']),
          h('span', { class: 'move-san clickable', 'data-ply': (i + 1), onclick: jump }, [sans[i] || '']),
          h('span', { class: 'move-san clickable', 'data-ply': (i + 2), onclick: jump }, [sans[i + 1] || ''])
        ]);
        list.appendChild(pair);
      }
    }
    function jump(e) { go(parseInt(e.target.dataset.ply, 10)); }
    function go(i) {
      ptr = Math.max(0, Math.min(positions.length - 1, i));
      board.setPosition(positions[ptr]);
      var score = global.Engine.evaluate(positions[ptr]) / 100;
      var disp = (score >= 0 ? '+' : '') + score.toFixed(2);
      var label = ptr === 0 ? 'Start position' : 'After ' + Math.ceil(ptr / 2) + (ptr % 2 ? '. ' : '... ') + sans[ptr - 1];
      document.getElementById('revEval').textContent = label + '  •  Eval ' + disp;
      document.querySelectorAll('#revMoves .move-san').forEach(function (s) {
        s.classList.toggle('cur', parseInt(s.dataset.ply, 10) === ptr);
      });
    }
    return wrap;
  }

  /* ===================================================================== *
   *  VIEW: TRAIN MENU (chessigma)
   * ===================================================================== */
  function viewTrain() {
    var groups = D.TRAIN_MENU.map(function (g) {
      return h('div', { class: 'menu-group' }, [
        h('div', { class: 'menu-group-title' }, [g.group]),
        h('div', { class: 'menu-items' }, g.items.map(function (it) {
          return menuItem(it);
        }))
      ]);
    });
    layout('train', [
      h('div', { class: 'page-pad' }, [
        h('h1', { class: 'page-title big' }, ['⚡ Train']),
        h('p', { class: 'page-lead' }, ['Sharpen tactics, fix blunders, and convert winning positions.']),
        h('div', { class: 'menu-wrap' }, groups)
      ])
    ], [ coachCard('Where do you leak the most rating? Start with Puzzles, then Blunder Shield.'), topSolvers() ]);
  }

  function viewTools() {
    layout('tools', [
      h('div', { class: 'page-pad' }, [
        h('h1', { class: 'page-title big' }, ['🛠️ Tools']),
        h('p', { class: 'page-lead' }, ['Analyze, edit positions, and crunch the numbers.']),
        h('div', { class: 'menu-items wide' }, D.TOOLS_MENU.map(menuItem))
      ])
    ], null);
  }

  function menuItem(it) {
    return h('a', {
      class: 'menu-item' + (it.soon ? ' soon' : ''),
      href: it.soon ? '#/tools' : it.route
    }, [
      h('span', { class: 'menu-ico' }, [it.icon]),
      h('div', { class: 'menu-body' }, [
        h('div', { class: 'menu-title' }, [it.title, it.soon ? h('span', { class: 'soon-tag' }, ['SOON']) : null]),
        h('div', { class: 'menu-desc' }, [it.desc])
      ])
    ]);
  }

  /* ===================================================================== *
   *  VIEW: OPENINGS / LEARN
   * ===================================================================== */
  function viewOpenings() {
    var cards = D.OPENINGS.map(function (o) {
      return h('div', { class: 'opening-card', onclick: function () { showOpening(o); } }, [
        h('div', { class: 'opening-head' }, [
          h('span', { class: 'opening-name' }, [o.name]),
          h('span', { class: 'opening-eco' }, [o.eco])
        ]),
        h('div', { class: 'opening-moves' }, [o.moves.join(' ')]),
        h('div', { class: 'opening-idea' }, [o.idea])
      ]);
    });
    layout('learn', [
      h('div', { class: 'page-pad' }, [
        h('h1', { class: 'page-title big' }, ['🎓 Learn — Opening Trainer']),
        h('p', { class: 'page-lead' }, ['Click an opening to play through its main line on the board.']),
        h('div', { class: 'opening-grid' }, cards),
        h('div', { class: 'opening-board-wrap', id: 'openingBoardWrap' }, [])
      ])
    ], null);
  }
  function showOpening(o) {
    var wrap = document.getElementById('openingBoardWrap');
    clear(wrap);
    var boardEl = h('div', { class: 'board-host narrow' }, []);
    var info = h('div', {}, [
      h('h3', { class: 'page-title' }, [o.name + ' (' + o.eco + ')']),
      h('div', { class: 'opening-idea' }, [o.idea]),
      h('div', { class: 'play-controls', id: 'opCtrls' }, [])
    ]);
    wrap.appendChild(h('div', { class: 'play-wrap' }, [
      h('div', { class: 'board-col' }, [boardEl]), info
    ]));
    var board = new global.ChessBoard(boardEl, { interactive: false });
    var g = new global.Chess(global.Chess.START_FEN);
    var positions = [g.fen()];
    o.moves.forEach(function (m) { g.move(m); positions.push(g.fen()); });
    var ptr = 0;
    function go(i) { ptr = Math.max(0, Math.min(positions.length - 1, i)); board.setPosition(positions[ptr]); }
    var ctrls = info.querySelector('#opCtrls');
    ctrls.appendChild(h('button', { class: 'btn btn-ghost', onclick: function () { go(ptr - 1); } }, ['◀ Prev']));
    ctrls.appendChild(h('button', { class: 'btn btn-ghost', onclick: function () { go(ptr + 1); } }, ['Next ▶']));
    ctrls.appendChild(h('button', { class: 'btn btn-green', onclick: function () {
      var step = 0;
      var iv = setInterval(function () { step++; go(step); if (step >= positions.length - 1) clearInterval(iv); }, 600);
    } }, ['▶ Auto-play']));
    go(0);
    wrap.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  /* ===================================================================== *
   *  VIEW: ELO CALCULATOR
   * ===================================================================== */
  function viewElo() {
    function calc() {
      var ra = parseFloat(document.getElementById('eloA').value) || 0;
      var rb = parseFloat(document.getElementById('eloB').value) || 0;
      var k = parseFloat(document.getElementById('eloK').value) || 32;
      var result = parseFloat(document.querySelector('input[name="res"]:checked').value);
      var expected = 1 / (1 + Math.pow(10, (rb - ra) / 400));
      var delta = Math.round(k * (result - expected));
      document.getElementById('eloOut').innerHTML =
        '<div class="elo-result">Expected score: <b>' + expected.toFixed(3) + '</b></div>' +
        '<div class="elo-result">Rating change: <b class="' + (delta >= 0 ? 'pos' : 'neg') + '">' +
        (delta >= 0 ? '+' : '') + delta + '</b></div>' +
        '<div class="elo-result">New rating: <b>' + (ra + delta) + '</b></div>';
    }
    var form = h('div', { class: 'elo-form' }, [
      eloField('Your rating', 'eloA', '1200'),
      eloField('Opponent rating', 'eloB', '1300'),
      eloField('K-factor', 'eloK', '32'),
      h('div', { class: 'elo-field' }, [
        h('label', {}, ['Result']),
        h('div', { class: 'radio-row' }, [
          radio('res', '1', 'Win', true),
          radio('res', '0.5', 'Draw', false),
          radio('res', '0', 'Loss', false)
        ])
      ]),
      h('button', { class: 'btn btn-green', onclick: calc }, ['Calculate']),
      h('div', { class: 'elo-out', id: 'eloOut' }, [])
    ]);
    layout('tools', [
      h('div', { class: 'page-pad' }, [
        h('h1', { class: 'page-title big' }, ['📈 Elo Calculator']),
        h('p', { class: 'page-lead' }, ['Estimate your rating change from a single game result.']),
        form
      ])
    ], null);
    setTimeout(calc, 0);
  }
  function eloField(label, id, val) {
    return h('div', { class: 'elo-field' }, [
      h('label', {}, [label]),
      h('input', { class: 'fen-input', id: id, type: 'number', value: val })
    ]);
  }
  function radio(name, val, label, checked) {
    var attrs = { type: 'radio', name: name, value: val };
    if (checked) attrs.checked = 'checked';
    return h('label', { class: 'radio' }, [ h('input', attrs), h('span', {}, [label]) ]);
  }

  /* ===================================================================== *
   *  VIEW: ABOUT
   * ===================================================================== */
  function viewAbout() {
    layout('about', [
      h('div', { class: 'page-pad about' }, [
        h('h1', { class: 'page-title big' }, ['ℹ️ About Chessigma']),
        h('p', { class: 'page-lead' }, [
          'A training-focused chess site that blends the dashboard feel of chess.com ' +
          'with the tactics-first layout of chessigma — built as a single, ' +
          'dependency-free static site.'
        ]),
        h('div', { class: 'about-grid' }, [
          aboutCard('🧩', 'Puzzles', 'Rated tactical puzzles with hints and a live rating.'),
          aboutCard('♟️', 'Play bots', 'Five bots from 400 to 2000, powered by a built-in engine.'),
          aboutCard('📊', 'Analysis', 'Engine eval bar, best-move suggestions, FEN/PGN tools.'),
          aboutCard('🔎', 'Game review', 'Step through any PGN with evaluations.'),
          aboutCard('🎓', 'Openings', 'Play through main lines move by move.'),
          aboutCard('📈', 'Elo tools', 'Calculate rating changes instantly.')
        ]),
        h('div', { class: 'about-note' }, [
          h('b', {}, ['Runs with VSCode Live Server.']),
          ' No build step, no install — open ', h('code', {}, ['index.html']),
          ' and click “Go Live”. Everything (chess engine, bot, UI) is plain HTML/CSS/JS.'
        ])
      ])
    ], null);
  }
  function aboutCard(icon, title, desc) {
    return h('div', { class: 'about-card' }, [
      h('div', { class: 'about-ico' }, [icon]),
      h('div', { class: 'about-title' }, [title]),
      h('div', { class: 'about-desc' }, [desc])
    ]);
  }

  /* ------------------------------- router -------------------------------- */
  var routes = {
    '': viewHome, 'home': viewHome, 'play': viewPlay, 'puzzles': viewPuzzles,
    'train': viewTrain, 'tools': viewTools, 'analysis': viewAnalysis,
    'review': viewReview, 'openings': viewOpenings, 'elo': viewElo, 'about': viewAbout
  };

  function parseQuery() {
    var hash = location.hash.slice(2); // strip "#/"
    var q = hash.split('?')[1] || '';
    var out = {};
    q.split('&').forEach(function (kv) {
      if (!kv) return;
      var p = kv.split('=');
      out[p[0]] = decodeURIComponent(p[1] || '');
    });
    return out;
  }

  function router() {
    var hash = location.hash.replace(/^#\//, '');
    var path = hash.split('?')[0];
    var view = routes[path] || viewHome;
    view();
    window.scrollTo(0, 0);
  }

  window.addEventListener('hashchange', router);
  window.addEventListener('DOMContentLoaded', function () {
    if (!location.hash) location.hash = '#/home';
    router();
  });
  // in case DOMContentLoaded already fired
  if (document.readyState !== 'loading') {
    if (!location.hash) location.hash = '#/home';
    router();
  }

  function sanEq(a, b) {
    return a.replace(/[+#!?]/g, '') === b.replace(/[+#!?]/g, '');
  }

  global.ChessApp = { Profile: Profile, router: router };
})(typeof window !== 'undefined' ? window : this);
