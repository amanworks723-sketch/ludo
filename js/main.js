/**
 * Ludo Supreme - Main Application Controller
 * Board rendering, game bootstrap, settings, themes, and modals
 */

document.addEventListener('DOMContentLoaded', () => {
  // Render Board SVG / Grid cells
  renderBoardStructure();

  // Instantiate Game & UI
  const game = new LudoGame();
  const ui = new LudoUI(game);

  // Hook game events to UI
  game.onStateChange = (state, meta = {}) => {
    ui.updateHUD();

    if (meta.action === 'rolling') {
      ui.render3DDice(meta.value, true);
    } else if (meta.action === 'validMoves') {
      ui.render3DDice(state.diceValue, false);
      ui.highlightValidPawns(meta.validPawns);
    } else if (meta.action === 'turnChanged') {
      ui.render3DDice(state.diceValue, false);
      ui.highlightValidPawns([]);
    } else if (meta.action === 'bonusTurn') {
      ui.highlightValidPawns([]);
    }
  };

  game.onPawnMoveStep = async (playerId, pawnIndex, stepCount, isYardExit) => {
    await ui.animatePawnStep(playerId, pawnIndex, stepCount, isYardExit);
  };

  game.onPawnCaptured = async (oppPlayerId, oppPawnIndex) => {
    await ui.animatePawnCapture(oppPlayerId, oppPawnIndex);
  };

  game.onLogEvent = (msg, type) => {
    ui.addLogEntry(msg, type);
  };

  game.onGameOver = (ranks, stats) => {
    ui.showVictoryModal(ranks, stats);
  };

  // Start Default Game (1 Human Red vs 3 Bots)
  game.initGame();
  ui.initPawnElements();

  // Bind Navbar and Modal controls
  bindControls(game, ui);
});

/**
 * Generate the 15x15 SVG board and interactive cells
 */
function renderBoardStructure() {
  const boardEl = document.getElementById('ludo-board');
  if (!boardEl) return;

  // Render SVG base
  const svgNS = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(svgNS, 'svg');
  svg.setAttribute('viewBox', '0 0 1500 1500');
  svg.setAttribute('id', 'ludo-board-svg');

  // Background
  const bg = document.createElementNS(svgNS, 'rect');
  bg.setAttribute('width', '1500');
  bg.setAttribute('height', '1500');
  bg.setAttribute('fill', 'var(--board-bg, #ffffff)');
  svg.appendChild(bg);

  // 1. Draw 4 Corner Yards (600x600 each: 6x6 cells)
  drawYard(svg, svgNS, 0, 0, 600, 600, 'var(--c-red, #ef4444)', 'Red', [
    { x: 150, y: 150 }, { x: 350, y: 150 },
    { x: 150, y: 350 }, { x: 350, y: 350 }
  ]);

  drawYard(svg, svgNS, 900, 0, 600, 600, 'var(--c-green, #10b981)', 'Green', [
    { x: 1050, y: 150 }, { x: 1250, y: 150 },
    { x: 1050, y: 350 }, { x: 1250, y: 350 }
  ]);

  drawYard(svg, svgNS, 900, 900, 600, 600, 'var(--c-yellow, #f59e0b)', 'Yellow', [
    { x: 1050, y: 1050 }, { x: 1250, y: 1050 },
    { x: 1050, y: 1250 }, { x: 1250, y: 1250 }
  ]);

  drawYard(svg, svgNS, 0, 900, 600, 600, 'var(--c-blue, #3b82f6)', 'Blue', [
    { x: 150, y: 1050 }, { x: 350, y: 1050 },
    { x: 150, y: 1250 }, { x: 350, y: 1250 }
  ]);

  // 2. Draw Center Goal Triangles (300x300 at 600, 600)
  drawCenterTriangles(svg, svgNS);

  // 3. Draw Track Cells (15x15 grid, cells outside yards & center)
  drawTrackCells(svg, svgNS);

  boardEl.insertBefore(svg, boardEl.firstChild);
}

function drawYard(svg, svgNS, x, y, w, h, color, name, pockets) {
  // Yard outer box
  const outer = document.createElementNS(svgNS, 'rect');
  outer.setAttribute('x', x);
  outer.setAttribute('y', y);
  outer.setAttribute('width', w);
  outer.setAttribute('height', h);
  outer.setAttribute('fill', color);
  outer.setAttribute('class', `yard-outer yard-${name.toLowerCase()}`);
  svg.appendChild(outer);

  // Inner white card
  const inner = document.createElementNS(svgNS, 'rect');
  inner.setAttribute('x', x + 90);
  inner.setAttribute('y', y + 90);
  inner.setAttribute('width', w - 180);
  inner.setAttribute('height', h - 180);
  inner.setAttribute('rx', '36');
  inner.setAttribute('fill', 'var(--yard-inner-bg, #ffffff)');
  inner.setAttribute('class', 'yard-inner-card');
  svg.appendChild(inner);

  // 4 Pockets
  pockets.forEach(p => {
    const pocketBg = document.createElementNS(svgNS, 'circle');
    pocketBg.setAttribute('cx', p.x);
    pocketBg.setAttribute('cy', p.y);
    pocketBg.setAttribute('r', '64');
    pocketBg.setAttribute('fill', color);
    pocketBg.setAttribute('class', 'yard-pocket-circle');
    svg.appendChild(pocketBg);

    const pocketRing = document.createElementNS(svgNS, 'circle');
    pocketRing.setAttribute('cx', p.x);
    pocketRing.setAttribute('cy', p.y);
    pocketRing.setAttribute('r', '52');
    pocketRing.setAttribute('fill', 'var(--pocket-ring, #ffffff)');
    pocketRing.setAttribute('opacity', '0.85');
    svg.appendChild(pocketRing);
  });
}

function drawCenterTriangles(svg, svgNS) {
  const g = document.createElementNS(svgNS, 'g');
  g.setAttribute('class', 'center-goal-group');

  // Red Left Triangle
  const redPoly = document.createElementNS(svgNS, 'polygon');
  redPoly.setAttribute('points', '600,600 750,750 600,900');
  redPoly.setAttribute('fill', 'var(--c-red, #ef4444)');
  g.appendChild(redPoly);

  // Green Top Triangle
  const greenPoly = document.createElementNS(svgNS, 'polygon');
  greenPoly.setAttribute('points', '600,600 750,750 900,600');
  greenPoly.setAttribute('fill', 'var(--c-green, #10b981)');
  g.appendChild(greenPoly);

  // Yellow Right Triangle
  const yellowPoly = document.createElementNS(svgNS, 'polygon');
  yellowPoly.setAttribute('points', '900,600 750,750 900,900');
  yellowPoly.setAttribute('fill', 'var(--c-yellow, #f59e0b)');
  g.appendChild(yellowPoly);

  // Blue Bottom Triangle
  const bluePoly = document.createElementNS(svgNS, 'polygon');
  bluePoly.setAttribute('points', '600,900 750,750 900,900');
  bluePoly.setAttribute('fill', 'var(--c-blue, #3b82f6)');
  g.appendChild(bluePoly);

  // Center Emblem (Golden Star / Trophy)
  const centerStar = document.createElementNS(svgNS, 'circle');
  centerStar.setAttribute('cx', '750');
  centerStar.setAttribute('cy', '750');
  centerStar.setAttribute('r', '40');
  centerStar.setAttribute('fill', '#ffd700');
  centerStar.setAttribute('stroke', '#ffffff');
  centerStar.setAttribute('stroke-width', '4');
  g.appendChild(centerStar);

  svg.appendChild(g);
}

function drawTrackCells(svg, svgNS) {
  const cellSize = 100;
  const trackGroup = document.createElementNS(svgNS, 'g');
  trackGroup.setAttribute('class', 'track-cells-group');

  // Safe Track spots lookup
  const safeSpotsMap = {
    '6_1': 'red',     // Red Start
    '2_6': 'star',    // Star
    '1_8': 'green',   // Green Start
    '6_12': 'star',   // Star
    '8_13': 'yellow', // Yellow Start
    '12_8': 'star',   // Star
    '13_6': 'blue',   // Blue Start
    '8_2': 'star'     // Star
  };

  // Home paths lookup
  const homePathsMap = {};
  for (let c = 1; c <= 5; c++) homePathsMap[`7_${c}`] = 'red';
  for (let r = 1; r <= 5; r++) homePathsMap[`${r}_7`] = 'green';
  for (let c = 9; c <= 13; c++) homePathsMap[`7_${c}`] = 'yellow';
  for (let r = 9; r <= 13; r++) homePathsMap[`${r}_7`] = 'blue';

  for (let r = 0; r < 15; r++) {
    for (let c = 0; c < 15; c++) {
      // Skip corner yards (0..5, 0..5), (0..5, 9..14), (9..14, 0..5), (9..14, 9..14)
      if ((r < 6 && c < 6) || (r < 6 && c > 8) || (r > 8 && c < 6) || (r > 8 && c > 8)) {
        continue;
      }
      // Skip center 3x3 (6..8, 6..8)
      if (r >= 6 && r <= 8 && c >= 6 && c <= 8) {
        continue;
      }

      const key = `${r}_${c}`;
      const cellRect = document.createElementNS(svgNS, 'rect');
      cellRect.setAttribute('x', c * cellSize);
      cellRect.setAttribute('y', r * cellSize);
      cellRect.setAttribute('width', cellSize);
      cellRect.setAttribute('height', cellSize);
      cellRect.setAttribute('stroke', 'var(--cell-border, #e2e8f0)');
      cellRect.setAttribute('stroke-width', '2');

      // Check for Home Path color
      if (homePathsMap[key]) {
        const colorName = homePathsMap[key];
        cellRect.setAttribute('fill', `var(--c-${colorName}, #ccc)`);
        cellRect.setAttribute('class', `cell-home-stretch cell-${colorName}`);
        trackGroup.appendChild(cellRect);
      } else if (safeSpotsMap[key]) {
        // Safe spots (Color Start or Star)
        const safeType = safeSpotsMap[key];
        if (safeType === 'star') {
          cellRect.setAttribute('fill', 'var(--cell-bg, #ffffff)');
          trackGroup.appendChild(cellRect);
          drawStarIcon(trackGroup, svgNS, c * cellSize + 50, r * cellSize + 50);
        } else {
          // Starting safe cell
          cellRect.setAttribute('fill', `var(--c-${safeType}, #ccc)`);
          cellRect.setAttribute('class', `cell-start cell-${safeType}`);
          trackGroup.appendChild(cellRect);
          drawStartArrow(trackGroup, svgNS, safeType, c * cellSize + 50, r * cellSize + 50);
        }
      } else {
        cellRect.setAttribute('fill', 'var(--cell-bg, #ffffff)');
        cellRect.setAttribute('class', 'track-cell-regular');
        trackGroup.appendChild(cellRect);
      }
    }
  }

  svg.appendChild(trackGroup);
}

function drawStarIcon(parent, svgNS, cx, cy) {
  const g = document.createElementNS(svgNS, 'g');
  g.setAttribute('class', 'safe-star-badge');

  // Background shield / ring
  const circle = document.createElementNS(svgNS, 'circle');
  circle.setAttribute('cx', cx);
  circle.setAttribute('cy', cy);
  circle.setAttribute('r', '32');
  circle.setAttribute('fill', 'rgba(245, 158, 11, 0.18)');
  circle.setAttribute('stroke', '#f59e0b');
  circle.setAttribute('stroke-width', '2.5');
  g.appendChild(circle);

  // 5-Pointed Golden Star
  const star = document.createElementNS(svgNS, 'polygon');
  const points = [];
  for (let i = 0; i < 10; i++) {
    const angle = (i * 36 - 90) * (Math.PI / 180);
    const r = i % 2 === 0 ? 24 : 11;
    points.push(`${cx + Math.cos(angle) * r},${cy + Math.sin(angle) * r}`);
  }
  star.setAttribute('points', points.join(' '));
  star.setAttribute('fill', '#f59e0b');
  star.setAttribute('stroke', '#b45309');
  star.setAttribute('stroke-width', '1.5');
  g.appendChild(star);

  parent.appendChild(g);
}

function drawStartArrow(parent, svgNS, color, cx, cy) {
  const text = document.createElementNS(svgNS, 'text');
  text.setAttribute('x', cx);
  text.setAttribute('y', cy + 9);
  text.setAttribute('text-anchor', 'middle');
  text.setAttribute('fill', '#ffffff');
  text.setAttribute('font-size', '28');
  text.setAttribute('font-weight', 'bold');
  text.textContent = '★';
  parent.appendChild(text);
}

/**
 * Bind UI controls, modals, audio, themes
 */
function bindControls(game, ui) {
  // Theme Switcher
  const themeBtns = document.querySelectorAll('.theme-btn');
  themeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      themeBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const theme = btn.dataset.theme;
      document.documentElement.setAttribute('data-theme', theme);
      if (window.ludoAudio) window.ludoAudio.playClick();
    });
  });

  // Sound Mute Toggle
  const soundToggleBtn = document.getElementById('sound-toggle-btn');
  if (soundToggleBtn) {
    soundToggleBtn.addEventListener('click', () => {
      const isMuted = !window.ludoAudio.isMuted;
      window.ludoAudio.setMute(isMuted);
      soundToggleBtn.classList.toggle('muted', isMuted);
      const icon = soundToggleBtn.querySelector('.sound-icon');
      if (icon) {
        icon.textContent = isMuted ? '🔇' : '🔊';
      }
    });
  }

  // Game Speed Buttons
  const speedBtns = document.querySelectorAll('.speed-btn');
  speedBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      speedBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      game.gameSpeed = parseFloat(btn.dataset.speed || 1);
      if (window.ludoAudio) window.ludoAudio.playClick();
    });
  });

  // New Game Modal Open / Close
  const newGameBtn = document.getElementById('new-game-btn');
  const setupModal = document.getElementById('setup-modal');
  const closeSetupBtn = document.getElementById('close-setup-btn');

  if (newGameBtn && setupModal) {
    newGameBtn.addEventListener('click', () => {
      setupModal.classList.add('is-open');
      if (window.ludoAudio) window.ludoAudio.playClick();
    });
  }

  if (closeSetupBtn && setupModal) {
    closeSetupBtn.addEventListener('click', () => {
      setupModal.classList.remove('is-open');
    });
  }

  // Rules Modal Open / Close
  const rulesBtn = document.getElementById('rules-btn');
  const rulesModal = document.getElementById('rules-modal');
  const closeRulesBtn = document.getElementById('close-rules-btn');

  if (rulesBtn && rulesModal) {
    rulesBtn.addEventListener('click', () => {
      rulesModal.classList.add('is-open');
      if (window.ludoAudio) window.ludoAudio.playClick();
    });
  }

  if (closeRulesBtn && rulesModal) {
    closeRulesBtn.addEventListener('click', () => {
      rulesModal.classList.remove('is-open');
    });
  }

  // History Feed Drawer Open / Close
  const historyToggleBtn = document.getElementById('history-toggle-btn');
  const historyDrawer = document.getElementById('history-drawer');
  const closeHistoryBtn = document.getElementById('close-history-btn');

  if (historyToggleBtn && historyDrawer) {
    historyToggleBtn.addEventListener('click', () => {
      historyDrawer.classList.toggle('is-open');
      if (window.ludoAudio) window.ludoAudio.playClick();
    });
  }

  if (closeHistoryBtn && historyDrawer) {
    closeHistoryBtn.addEventListener('click', () => {
      historyDrawer.classList.remove('is-open');
    });
  }

  if (historyDrawer) {
    historyDrawer.addEventListener('click', (e) => {
      if (e.target === historyDrawer) {
        historyDrawer.classList.remove('is-open');
      }
    });
  }

  // Victory Modal Close / Play Again
  const playAgainBtn = document.getElementById('victory-play-again-btn');
  const victoryModal = document.getElementById('victory-modal');

  if (playAgainBtn && victoryModal) {
    playAgainBtn.addEventListener('click', () => {
      victoryModal.classList.remove('is-open');
      startCustomGame(game, ui);
    });
  }

  // Setup Modal Form Submission
  const startGameForm = document.getElementById('setup-game-form');
  if (startGameForm) {
    startGameForm.addEventListener('submit', (e) => {
      e.preventDefault();
      startCustomGame(game, ui);
      if (setupModal) setupModal.classList.remove('is-open');
    });
  }
}

function startCustomGame(game, ui) {
  const playerCount = parseInt(document.querySelector('input[name="player-count"]:checked')?.value || 4);
  const gameMode = document.querySelector('input[name="game-mode"]:checked')?.value || 'vs-computer';

  // Read player names
  const redName = document.getElementById('name-red')?.value.trim() || 'Player 1 (Red)';
  const greenName = document.getElementById('name-green')?.value.trim() || 'Player 2 (Green)';
  const yellowName = document.getElementById('name-yellow')?.value.trim() || 'Player 3 (Yellow)';
  const blueName = document.getElementById('name-blue')?.value.trim() || 'Player 4 (Blue)';

  let setup = [];

  if (playerCount === 2) {
    // 2 Players: Red and Yellow (Standard opposite sides)
    setup = [
      { id: 'red', name: redName, type: 'human', active: true },
      { id: 'green', name: greenName, type: 'bot', active: false },
      { id: 'yellow', name: yellowName, type: gameMode === 'pass-play' ? 'human' : 'bot', active: true },
      { id: 'blue', name: blueName, type: 'bot', active: false }
    ];
  } else if (playerCount === 3) {
    setup = [
      { id: 'red', name: redName, type: 'human', active: true },
      { id: 'green', name: greenName, type: gameMode === 'pass-play' ? 'human' : 'bot', active: true },
      { id: 'yellow', name: yellowName, type: gameMode === 'pass-play' ? 'human' : 'bot', active: true },
      { id: 'blue', name: blueName, type: 'bot', active: false }
    ];
  } else {
    // 4 Players
    if (gameMode === 'pass-play') {
      setup = [
        { id: 'red', name: redName, type: 'human', active: true },
        { id: 'green', name: greenName, type: 'human', active: true },
        { id: 'yellow', name: yellowName, type: 'human', active: true },
        { id: 'blue', name: blueName, type: 'human', active: true }
      ];
    } else if (gameMode === 'spectate') {
      setup = [
        { id: 'red', name: 'Bot Red', type: 'bot', active: true },
        { id: 'green', name: 'Bot Green', type: 'bot', active: true },
        { id: 'yellow', name: 'Bot Yellow', type: 'bot', active: true },
        { id: 'blue', name: 'Bot Blue', type: 'bot', active: true }
      ];
    } else {
      // vs Computer: 1 Human, 3 Bots
      setup = [
        { id: 'red', name: redName, type: 'human', active: true },
        { id: 'green', name: greenName || 'Bot Green', type: 'bot', active: true },
        { id: 'yellow', name: yellowName || 'Bot Yellow', type: 'bot', active: true },
        { id: 'blue', name: blueName || 'Bot Blue', type: 'bot', active: true }
      ];
    }
  }

  // Update UI Player names in sidebar
  setup.forEach(p => {
    const nameEl = document.querySelector(`#player-card-${p.id} .player-card-name`);
    if (nameEl) nameEl.textContent = p.name;
    const typeBadge = document.querySelector(`#player-card-${p.id} .player-type-badge`);
    if (typeBadge) {
      typeBadge.textContent = p.type === 'bot' ? '🤖 Bot' : '👤 Human';
      typeBadge.className = `player-type-badge ${p.type === 'bot' ? 'badge-bot' : 'badge-human'}`;
    }
  });

  game.initGame({ playerSetup: setup });
  ui.initPawnElements();
}
