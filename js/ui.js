/**
 * Ludo Supreme - Visual & Interactive UI Controller
 * 3D Dice, Animated Pawn Movement, Confetti, Themes & Audio Integration
 */

class LudoUI {
  constructor(game) {
    this.game = game;
    this.boardEl = document.getElementById('ludo-board');
    this.pawnsLayerEl = document.getElementById('pawns-layer');
    this.diceCubeEl = document.getElementById('dice-cube');
    this.rollBtnEl = document.getElementById('roll-dice-btn');
    this.diceContainerEl = document.getElementById('dice-container');
    this.turnIndicatorEl = document.getElementById('current-turn-badge');
    this.statusMessageEl = document.getElementById('game-status-message');
    this.logsContainerEl = document.getElementById('game-logs-list');
    this.dicePlayerAvatar = document.getElementById('dice-player-avatar');
    this.dicePlayerName = document.getElementById('dice-player-name');
    this.dicePlayerStatus = document.getElementById('dice-player-status');
    this.liveToastEl = document.getElementById('arena-live-toast');
    this.confettiCanvas = document.getElementById('confetti-canvas');
    this.confettiCtx = this.confettiCanvas ? this.confettiCanvas.getContext('2d') : null;
    this.confettiParticles = [];
    this.isConfettiRunning = false;

    this.pawnElements = {}; // map 'player_pawnIdx' to DOM element
    this.initPawnElements();
    this.initConfetti();
    this.setupEventListeners();
  }

  // Initialize DOM elements for all 16 pawns (4 players x 4 pawns)
  initPawnElements() {
    this.pawnsLayerEl.innerHTML = '';
    this.pawnElements = {};

    const colors = ['red', 'green', 'yellow', 'blue'];
    colors.forEach(colorId => {
      for (let i = 0; i < 4; i++) {
        const key = `${colorId}_${i}`;
        const pawnEl = document.createElement('div');
        pawnEl.className = `ludo-pawn pawn-${colorId}`;
        pawnEl.dataset.playerId = colorId;
        pawnEl.dataset.pawnIndex = i;

        pawnEl.innerHTML = `
          <div class="pawn-body">
            <div class="pawn-head"></div>
            <div class="pawn-base"></div>
            <div class="pawn-shine"></div>
            <span class="pawn-number">${i + 1}</span>
          </div>
          <div class="pawn-shadow"></div>
          <div class="pawn-glow-ring"></div>
        `;

        pawnEl.addEventListener('click', (e) => {
          e.stopPropagation();
          this.handlePawnClick(colorId, i);
        });

        this.pawnsLayerEl.appendChild(pawnEl);
        this.pawnElements[key] = pawnEl;
      }
    });

    this.updateAllPawnPositions(false);
  }

  // Update positions of all pawns and resolve stacking
  updateAllPawnPositions(animate = true) {
    // Group pawns by their current coordinate
    const occupiedCells = {};

    this.game.players.forEach(player => {
      if (!player.active) {
        // Hide inactive player's pawns
        for (let i = 0; i < 4; i++) {
          const el = this.pawnElements[`${player.id}_${i}`];
          if (el) el.style.display = 'none';
        }
        return;
      }

      player.pawns.forEach((pawn, idx) => {
        const el = this.pawnElements[`${player.id}_${idx}`];
        if (!el) return;
        el.style.display = 'block';

        const coord = LUDO_CONFIG.getPawnCoordinate(player.id, idx, pawn.stepCount);
        const cellKey = `${coord.r.toFixed(1)}_${coord.c.toFixed(1)}`;

        if (!occupiedCells[cellKey]) {
          occupiedCells[cellKey] = [];
        }
        occupiedCells[cellKey].push({ player, pawn, idx, el, coord });
      });
    });

    // Position each pawn, offsetting if multiple share the same cell
    Object.keys(occupiedCells).forEach(cellKey => {
      const pawnsOnCell = occupiedCells[cellKey];
      const count = pawnsOnCell.length;

      pawnsOnCell.forEach((item, stackIdx) => {
        const percent = LUDO_CONFIG.coordToPercent(item.coord.r, item.coord.c);
        let offsetX = 0;
        let offsetY = 0;
        let scale = 1;

        if (count > 1) {
          scale = count === 2 ? 0.78 : 0.68;
          // Offset in cluster
          const offsets2 = [
            { x: -10, y: -6 },
            { x: 10, y: 6 }
          ];
          const offsets3_4 = [
            { x: -9, y: -9 },
            { x: 9, y: -9 },
            { x: -9, y: 9 },
            { x: 9, y: 9 }
          ];

          const offsetPattern = count === 2 ? offsets2 : offsets3_4;
          const chosen = offsetPattern[stackIdx % offsetPattern.length];
          offsetX = chosen.x;
          offsetY = chosen.y;
        }

        item.el.style.left = `${percent.left}%`;
        item.el.style.top = `${percent.top}%`;
        item.el.style.transform = `translate(-50%, -50%) translate(${offsetX}px, ${offsetY}px) scale(${scale})`;
        item.el.style.zIndex = 10 + stackIdx;
      });
    });
  }

  // Handle single pawn step animation with bouncy arc
  async animatePawnStep(playerId, pawnIndex, stepCount, isYardExit) {
    const el = this.pawnElements[`${playerId}_${pawnIndex}`];
    if (!el) return;

    const coord = LUDO_CONFIG.getPawnCoordinate(playerId, pawnIndex, stepCount);
    const percent = LUDO_CONFIG.coordToPercent(coord.r, coord.c);

    el.classList.add('is-hopping');
    el.style.zIndex = 100;
    el.style.left = `${percent.left}%`;
    el.style.top = `${percent.top}%`;
    el.style.transform = 'translate(-50%, -50%) scale(1.15)';

    await this.game.delay(120 / this.game.gameSpeed);
    el.style.transform = 'translate(-50%, -50%) scale(1)';
    el.classList.remove('is-hopping');

    // Update entire board clustering after step
    this.updateAllPawnPositions(false);
  }

  // Animate pawn capture (shockwave, spin, fly back to yard)
  async animatePawnCapture(playerId, pawnIndex) {
    const el = this.pawnElements[`${playerId}_${pawnIndex}`];
    if (!el) return;

    // Trigger board shockwave
    this.boardEl.classList.add('board-shake');
    setTimeout(() => this.boardEl.classList.remove('board-shake'), 400);

    // Blast particle at current pawn position
    this.triggerCaptureBlast(el);

    // Spin and fly to yard
    el.classList.add('is-captured');
    const yardCoord = LUDO_CONFIG.getPawnCoordinate(playerId, pawnIndex, -1);
    const percent = LUDO_CONFIG.coordToPercent(yardCoord.r, yardCoord.c);

    el.style.left = `${percent.left}%`;
    el.style.top = `${percent.top}%`;

    await this.game.delay(450 / this.game.gameSpeed);
    el.classList.remove('is-captured');
    this.updateAllPawnPositions(false);
  }

  // Visual blast particles when pawn is captured
  triggerCaptureBlast(targetEl) {
    const rect = targetEl.getBoundingClientRect();
    const boardRect = this.boardEl.getBoundingClientRect();

    const x = rect.left + rect.width / 2 - boardRect.left;
    const y = rect.top + rect.height / 2 - boardRect.top;

    const blastContainer = document.createElement('div');
    blastContainer.className = 'capture-blast-effect';
    blastContainer.style.left = `${x}px`;
    blastContainer.style.top = `${y}px`;

    for (let i = 0; i < 8; i++) {
      const spark = document.createElement('div');
      spark.className = 'blast-spark';
      const angle = (i * 45) * (Math.PI / 180);
      const dist = 32 + Math.random() * 16;
      spark.style.setProperty('--tx', `${Math.cos(angle) * dist}px`);
      spark.style.setProperty('--ty', `${Math.sin(angle) * dist}px`);
      blastContainer.appendChild(spark);
    }

    this.boardEl.appendChild(blastContainer);
    setTimeout(() => blastContainer.remove(), 600);
  }

  // 3D Dice rotation and face alignment
  render3DDice(value, isRolling = false) {
    if (!this.diceCubeEl) return;

    if (isRolling) {
      this.diceCubeEl.classList.add('rolling-animation');
      this.diceContainerEl.classList.add('shaking');
      return;
    }

    this.diceCubeEl.classList.remove('rolling-animation');
    this.diceContainerEl.classList.remove('shaking');

    // 3D rotations for standard dice faces
    const rotations = {
      1: { x: 0, y: 0 },
      2: { x: -90, y: 0 },
      3: { x: 0, y: -90 },
      4: { x: 0, y: 90 },
      5: { x: 90, y: 0 },
      6: { x: 180, y: 0 }
    };

    const targetRot = rotations[value] || rotations[1];
    // Add multiple of 360 to keep smooth rotation feel
    this.diceCubeEl.style.transform = `rotateX(${targetRot.x}deg) rotateY(${targetRot.y}deg)`;

    // Spawn floating number popup
    this.spawnDiceNumberPopup(value);
  }

  spawnDiceNumberPopup(value) {
    const badge = document.createElement('div');
    badge.className = 'dice-popup-number';
    badge.textContent = value;
    if (value === 6) badge.classList.add('is-six');
    this.diceContainerEl.appendChild(badge);

    setTimeout(() => badge.remove(), 700);
  }

  // Highlight playable pawns with pulsing ring & bounce
  highlightValidPawns(validPawnIndices) {
    const curPlayer = this.game.getCurrentPlayer();
    if (!curPlayer) return;

    // Remove highlight from all pawns first
    document.querySelectorAll('.ludo-pawn').forEach(p => {
      p.classList.remove('playable-pawn');
    });

    if (curPlayer.type !== 'human' || !validPawnIndices) return;

    validPawnIndices.forEach(idx => {
      const el = this.pawnElements[`${curPlayer.id}_${idx}`];
      if (el) {
        el.classList.add('playable-pawn');
      }
    });
  }

  handlePawnClick(playerId, pawnIndex) {
    const curPlayer = this.game.getCurrentPlayer();
    if (!curPlayer || curPlayer.id !== playerId) return;
    if (curPlayer.type !== 'human') return;
    if (this.game.phase !== 'WAITING_FOR_PAWN') return;

    const validPawns = this.game.getValidPawnIndices(curPlayer, this.game.diceValue);
    if (!validPawns.includes(pawnIndex)) return;

    // Clear highlights and move
    this.highlightValidPawns([]);
    this.game.movePawn(playerId, pawnIndex);
  }

  // Update Turn Status Bar & Player HUDs
  updateHUD() {
    const curPlayer = this.game.getCurrentPlayer();
    if (!curPlayer) return;

    // 1. DYNAMIC COLOR ON THE ROLL DICE SPACE
    if (this.diceContainerEl) {
      this.diceContainerEl.dataset.turn = curPlayer.id;
      this.diceContainerEl.classList.remove('turn-red', 'turn-green', 'turn-yellow', 'turn-blue');
      this.diceContainerEl.classList.add(`turn-${curPlayer.id}`);
      this.diceContainerEl.style.setProperty('--turn-color', curPlayer.hex);
      this.diceContainerEl.style.setProperty('--turn-glow', `${curPlayer.hex}55`);
      this.diceContainerEl.style.setProperty('--turn-tint', `${curPlayer.hex}18`);
    }

    // Update Turn Indicator Banner
    if (this.turnIndicatorEl) {
      this.turnIndicatorEl.textContent = `${curPlayer.name}'s Turn`;
      this.turnIndicatorEl.style.background = curPlayer.hex;
      this.turnIndicatorEl.style.boxShadow = `0 4px 18px ${curPlayer.hex}77`;
    }

    // Update Player metadata inside the Dice Station
    if (this.dicePlayerAvatar) {
      this.dicePlayerAvatar.textContent = curPlayer.name.charAt(0);
      this.dicePlayerAvatar.style.background = curPlayer.hex;
      this.dicePlayerAvatar.style.boxShadow = `0 2px 10px ${curPlayer.hex}77`;
    }

    if (this.dicePlayerName) {
      this.dicePlayerName.textContent = curPlayer.name;
    }

    if (this.dicePlayerStatus) {
      if (this.game.phase === 'GAME_OVER') {
        this.dicePlayerStatus.textContent = 'Match Finished!';
      } else if (curPlayer.type === 'bot') {
        this.dicePlayerStatus.textContent = '🤖 Computer Bot rolling...';
      } else if (this.game.phase === 'WAITING_FOR_PAWN') {
        this.dicePlayerStatus.textContent = '👆 Click a glowing token to move!';
      } else {
        this.dicePlayerStatus.textContent = '🎲 Your turn! Click or Press Space';
      }
    }

    // Update Roll Button state and color styling
    if (this.rollBtnEl) {
      this.rollBtnEl.style.background = `linear-gradient(135deg, ${curPlayer.hex}, rgba(0, 0, 0, 0.35))`;
      this.rollBtnEl.style.borderColor = curPlayer.hex;
      this.rollBtnEl.style.boxShadow = `0 4px 18px ${curPlayer.hex}55`;

      if (this.game.phase === 'WAITING_FOR_ROLL' && curPlayer.type === 'human') {
        this.rollBtnEl.disabled = false;
        this.rollBtnEl.classList.add('ready-to-roll');
        this.rollBtnEl.innerHTML = `<span class="btn-dice-icon">🎲</span> Roll Dice <kbd class="kbd-hint">Space</kbd>`;
      } else if (curPlayer.type === 'bot') {
        this.rollBtnEl.disabled = true;
        this.rollBtnEl.classList.remove('ready-to-roll');
        this.rollBtnEl.innerHTML = `🤖 Bot Rolling...`;
      } else if (this.game.phase === 'WAITING_FOR_PAWN') {
        this.rollBtnEl.disabled = true;
        this.rollBtnEl.classList.remove('ready-to-roll');
        this.rollBtnEl.innerHTML = `Select Pawn`;
      } else {
        this.rollBtnEl.disabled = true;
        this.rollBtnEl.classList.remove('ready-to-roll');
      }
    }

    // Update player cards in sidebar / HUD
    this.game.players.forEach(player => {
      const card = document.getElementById(`player-card-${player.id}`);
      if (!card) return;

      if (!player.active) {
        card.classList.add('is-inactive');
        return;
      }
      card.classList.remove('is-inactive');

      // Active turn indicator
      if (player.id === curPlayer.id && this.game.phase !== 'GAME_OVER') {
        card.classList.add('active-turn');
      } else {
        card.classList.remove('active-turn');
      }

      // Count pawns at home
      const homeCount = player.pawns.filter(p => p.stepCount === 56).length;
      const progressEl = card.querySelector('.player-progress-bar');
      if (progressEl) {
        progressEl.style.width = `${(homeCount / 4) * 100}%`;
      }

      const scoreEl = card.querySelector('.player-home-count');
      if (scoreEl) {
        scoreEl.textContent = `${homeCount} / 4 Home`;
      }

      // Update 4 Home Token dots
      const dots = card.querySelectorAll('.dot-token');
      dots.forEach((dot, dIdx) => {
        if (dIdx < homeCount) {
          dot.classList.add('filled');
        } else {
          dot.classList.remove('filled');
        }
      });

      // Rank badge
      const rankBadge = card.querySelector('.player-rank-badge');
      if (rankBadge) {
        if (player.rank) {
          rankBadge.textContent = `#${player.rank}`;
          rankBadge.style.display = 'inline-block';
        } else {
          rankBadge.style.display = 'none';
        }
      }
    });
  }

  addLogEntry(message, type = 'normal') {
    if (this.logsContainerEl) {
      const entry = document.createElement('div');
      entry.className = `log-entry log-${type}`;
      entry.innerHTML = `<span class="log-bullet">•</span> <span class="log-text">${message}</span>`;
      this.logsContainerEl.insertBefore(entry, this.logsContainerEl.firstChild);

      // Limit log count to 40
      if (this.logsContainerEl.children.length > 40) {
        this.logsContainerEl.lastElementChild.remove();
      }
    }

    // Update Navbar Live Toast
    if (this.liveToastEl) {
      const textSpan = this.liveToastEl.querySelector('.toast-text');
      if (textSpan) {
        textSpan.innerHTML = message;
      } else {
        this.liveToastEl.innerHTML = `<span class="toast-dot"></span> <span class="toast-text">${message}</span>`;
      }
      this.liveToastEl.classList.remove('pop-animate');
      void this.liveToastEl.offsetWidth; // trigger reflow
      this.liveToastEl.classList.add('pop-animate');
    }
  }

  // Confetti Canvas Particle Engine
  initConfetti() {
    if (!this.confettiCanvas) return;

    const resize = () => {
      this.confettiCanvas.width = window.innerWidth;
      this.confettiCanvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);
  }

  triggerConfetti(durationMs = 4000) {
    if (!this.confettiCanvas || !this.confettiCtx) return;

    const colors = ['#ef4444', '#10b981', '#f59e0b', '#3b82f6', '#ec4899', '#8b5cf6', '#14b8a6'];
    const count = 150;

    for (let i = 0; i < count; i++) {
      this.confettiParticles.push({
        x: Math.random() * this.confettiCanvas.width,
        y: -20 - Math.random() * 50,
        w: 6 + Math.random() * 8,
        h: 10 + Math.random() * 12,
        color: colors[Math.floor(Math.random() * colors.length)],
        vx: (Math.random() - 0.5) * 4,
        vy: 2.5 + Math.random() * 4.5,
        rot: Math.random() * 360,
        vRot: (Math.random() - 0.5) * 8
      });
    }

    if (!this.isConfettiRunning) {
      this.isConfettiRunning = true;
      this.runConfettiLoop();
    }

    setTimeout(() => {
      // Allow remaining particles to fall off
      setTimeout(() => {
        this.isConfettiRunning = false;
        this.confettiParticles = [];
        this.confettiCtx.clearRect(0, 0, this.confettiCanvas.width, this.confettiCanvas.height);
      }, 2500);
    }, durationMs);
  }

  runConfettiLoop() {
    if (!this.isConfettiRunning) return;

    this.confettiCtx.clearRect(0, 0, this.confettiCanvas.width, this.confettiCanvas.height);

    for (let i = this.confettiParticles.length - 1; i >= 0; i--) {
      const p = this.confettiParticles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.rot += p.vRot;

      this.confettiCtx.save();
      this.confettiCtx.translate(p.x, p.y);
      this.confettiCtx.rotate((p.rot * Math.PI) / 180);
      this.confettiCtx.fillStyle = p.color;
      this.confettiCtx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      this.confettiCtx.restore();

      if (p.y > this.confettiCanvas.height + 30) {
        this.confettiParticles.splice(i, 1);
      }
    }

    if (this.confettiParticles.length > 0) {
      requestAnimationFrame(() => this.runConfettiLoop());
    } else {
      this.isConfettiRunning = false;
    }
  }

  setupEventListeners() {
    // Roll button click
    if (this.rollBtnEl) {
      this.rollBtnEl.addEventListener('click', () => {
        const cur = this.game.getCurrentPlayer();
        if (cur && cur.type === 'human') {
          this.game.rollDice();
        }
      });
    }

    // Dice cube click to roll
    if (this.diceContainerEl) {
      this.diceContainerEl.addEventListener('click', () => {
        const cur = this.game.getCurrentPlayer();
        if (cur && cur.type === 'human') {
          this.game.rollDice();
        }
      });
    }

    // Keyboard Spacebar to roll
    window.addEventListener('keydown', (e) => {
      if (e.code === 'Space' && !e.target.matches('input, textarea')) {
        e.preventDefault();
        const cur = this.game.getCurrentPlayer();
        if (cur && cur.type === 'human' && this.game.phase === 'WAITING_FOR_ROLL') {
          this.game.rollDice();
        }
      }
    });
  }

  // Show Game Over Modal
  showVictoryModal(ranks, stats) {
    const modal = document.getElementById('victory-modal');
    if (!modal) return;

    this.triggerConfetti(6000);

    const winnerNameEl = document.getElementById('victory-winner-name');
    if (winnerNameEl && ranks[0]) {
      winnerNameEl.textContent = `${ranks[0].name} Wins!`;
      winnerNameEl.style.color = ranks[0].hex;
    }

    // Populate Podium
    const podiumEl = document.getElementById('victory-podium-list');
    if (podiumEl) {
      podiumEl.innerHTML = '';
      ranks.forEach((p, idx) => {
        const item = document.createElement('div');
        item.className = `podium-entry rank-${idx + 1}`;
        item.innerHTML = `
          <div class="podium-rank-badge">#${idx + 1}</div>
          <div class="podium-player-color" style="background:${p.hex}"></div>
          <div class="podium-player-name">${p.name}</div>
        `;
        podiumEl.appendChild(item);
      });
    }

    // Populate Stats
    const statsContainer = document.getElementById('victory-stats-details');
    if (statsContainer) {
      const minutes = Math.floor((Date.now() - stats.startTime) / 60000);
      const seconds = Math.floor(((Date.now() - stats.startTime) % 60000) / 1000);
      statsContainer.innerHTML = `
        <div class="stat-item"><span class="stat-label">Total Turns:</span> <span class="stat-val">${stats.totalTurns}</span></div>
        <div class="stat-item"><span class="stat-label">Total Sixes:</span> <span class="stat-val">${stats.totalSixes}</span></div>
        <div class="stat-item"><span class="stat-label">Captures Made:</span> <span class="stat-val">${stats.totalCaptures}</span></div>
        <div class="stat-item"><span class="stat-label">Match Duration:</span> <span class="stat-val">${minutes}m ${seconds}s</span></div>
      `;
    }

    modal.classList.add('is-open');
  }
}

window.LudoUI = LudoUI;
