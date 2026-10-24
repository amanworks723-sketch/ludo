/**
 * Ludo Supreme - Core Game Engine
 * State machine, rules, turns, moves, captures, and victory conditions
 */

class LudoGame {
  constructor() {
    this.players = [];
    this.activePlayerIndices = [];
    this.currentTurnIndex = 0; // index into activePlayerIndices
    this.diceValue = 1;
    this.consecutiveSixes = 0;
    this.phase = 'IDLE'; // IDLE | WAITING_FOR_ROLL | ROLLING | WAITING_FOR_PAWN | ANIMATING | GAME_OVER
    this.ai = new LudoAI(this);
    this.ranksAssigned = [];
    this.gameSpeed = 1; // 1 = normal, 2 = fast, 4 = turbo
    this.stats = {
      startTime: null,
      totalTurns: 0,
      totalSixes: 0,
      totalCaptures: 0
    };
    this.onStateChange = null;
    this.onPawnMoveStep = null;
    this.onPawnCaptured = null;
    this.onLogEvent = null;
    this.onGameOver = null;
  }

  // Initialize new game with player configuration
  initGame(config = {}) {
    const defaultSetup = [
      { id: 'red', name: 'Player 1 (Red)', type: 'human', active: true },
      { id: 'green', name: 'Bot Green', type: 'bot', active: true },
      { id: 'yellow', name: 'Bot Yellow', type: 'bot', active: true },
      { id: 'blue', name: 'Bot Blue', type: 'bot', active: true }
    ];

    const setup = config.playerSetup || defaultSetup;
    this.players = setup.map(s => {
      const pConf = LUDO_CONFIG.PLAYERS[s.id];
      return {
        id: s.id,
        name: s.name || pConf.name,
        type: s.type || 'human', // 'human' | 'bot'
        active: s.active !== false,
        hex: pConf.hex,
        startIndex: pConf.startIndex,
        homeEntranceIndex: pConf.homeEntranceIndex,
        rank: null,
        pawns: [
          { id: 0, playerId: s.id, stepCount: -1 },
          { id: 1, playerId: s.id, stepCount: -1 },
          { id: 2, playerId: s.id, stepCount: -1 },
          { id: 3, playerId: s.id, stepCount: -1 }
        ]
      };
    });

    this.activePlayerIndices = [];
    this.players.forEach((p, idx) => {
      if (p.active) this.activePlayerIndices.push(idx);
    });

    this.currentTurnIndex = 0;
    this.diceValue = 1;
    this.consecutiveSixes = 0;
    this.ranksAssigned = [];
    this.stats = {
      startTime: Date.now(),
      totalTurns: 0,
      totalSixes: 0,
      totalCaptures: 0
    };

    this.phase = 'WAITING_FOR_ROLL';
    this.emitLog(`Game started with ${this.activePlayerIndices.length} players!`, 'info');

    // Notify UI
    if (this.onStateChange) this.onStateChange(this);

    // If first player is bot, trigger bot turn
    this.checkBotTurn();
  }

  getCurrentPlayer() {
    if (this.activePlayerIndices.length === 0) return null;
    const playerIdx = this.activePlayerIndices[this.currentTurnIndex];
    return this.players[playerIdx];
  }

  emitLog(message, type = 'normal') {
    if (this.onLogEvent) {
      this.onLogEvent(message, type);
    }
  }

  // Roll dice action
  async rollDice() {
    if (this.phase !== 'WAITING_FOR_ROLL') return false;

    this.phase = 'ROLLING';
    const player = this.getCurrentPlayer();
    this.stats.totalTurns++;

    // Audio rattle
    if (window.ludoAudio) window.ludoAudio.playDiceRoll();

    // Generate random 1..6
    const roll = Math.floor(Math.random() * 6) + 1;
    this.diceValue = roll;

    // Trigger visual roll on UI
    if (this.onStateChange) this.onStateChange(this, { action: 'rolling', value: roll });

    // Wait for dice rolling animation (approx 700ms / speed)
    await this.delay(650 / this.gameSpeed);

    if (window.ludoAudio) window.ludoAudio.playDiceLand();

    this.emitLog(`${player.name} rolled a ${roll}!`, roll === 6 ? 'highlight' : 'normal');

    if (roll === 6) {
      this.stats.totalSixes++;
      this.consecutiveSixes++;
      if (window.ludoAudio) window.ludoAudio.playSix();

      // Rule: Three consecutive sixes cancel turn
      if (this.consecutiveSixes === 3) {
        this.emitLog(`${player.name} rolled three consecutive 6s! Turn forfeited.`, 'warning');
        this.consecutiveSixes = 0;
        await this.delay(900 / this.gameSpeed);
        this.passTurn();
        return true;
      }
    } else {
      this.consecutiveSixes = 0;
    }

    // Determine valid pawns that can move with this roll
    const validPawnIndices = this.getValidPawnIndices(player, roll);

    if (validPawnIndices.length === 0) {
      this.emitLog(`No valid moves for ${player.name}. Turn passed.`, 'dim');
      this.phase = 'WAITING_FOR_ROLL';
      await this.delay(800 / this.gameSpeed);
      this.passTurn();
      return true;
    }

    // If valid moves exist
    this.phase = 'WAITING_FOR_PAWN';
    if (this.onStateChange) this.onStateChange(this, { action: 'validMoves', validPawns: validPawnIndices });

    // Handle bot decision or single auto-move
    if (player.type === 'bot') {
      await this.delay(600 / this.gameSpeed);
      const chosenPawnIndex = this.ai.chooseBestMove(player.id, validPawnIndices, roll);
      if (chosenPawnIndex !== null) {
        this.movePawn(player.id, chosenPawnIndex);
      }
    }

    return true;
  }

  // Get list of pawn indices (0..3) that can legally move with `diceValue`
  getValidPawnIndices(player, diceValue) {
    const valid = [];
    player.pawns.forEach((pawn, idx) => {
      // In base yard
      if (pawn.stepCount === -1) {
        if (diceValue === 6) {
          valid.push(idx);
        }
      } else if (pawn.stepCount >= 0 && pawn.stepCount < 56) {
        // Must not overshoot the goal (step 56)
        if (pawn.stepCount + diceValue <= 56) {
          valid.push(idx);
        }
      }
    });
    return valid;
  }

  // Move selected pawn
  async movePawn(playerId, pawnIndex) {
    if (this.phase !== 'WAITING_FOR_PAWN') return false;

    const player = this.getCurrentPlayer();
    if (!player || player.id !== playerId) return false;

    const pawn = player.pawns[pawnIndex];
    if (!pawn) return false;

    const validPawns = this.getValidPawnIndices(player, this.diceValue);
    if (!validPawns.includes(pawnIndex)) return false;

    this.phase = 'ANIMATING';
    if (this.onStateChange) this.onStateChange(this, { action: 'movingPawn', pawnIndex });

    let bonusTurnAwarded = false;
    const startStep = pawn.stepCount;

    if (startStep === -1) {
      // Step out of base yard to starting cell (step 0)
      pawn.stepCount = 0;
      if (window.ludoAudio) window.ludoAudio.playHop(0);

      if (this.onPawnMoveStep) {
        await this.onPawnMoveStep(player.id, pawnIndex, 0, true);
      }
      this.emitLog(`${player.name} brought a token out onto the board!`, 'success');
      await this.delay(200 / this.gameSpeed);
    } else {
      // Step-by-step hopping along the track
      const targetStep = startStep + this.diceValue;
      for (let s = startStep + 1; s <= targetStep; s++) {
        pawn.stepCount = s;
        if (window.ludoAudio) window.ludoAudio.playHop(s);

        if (this.onPawnMoveStep) {
          await this.onPawnMoveStep(player.id, pawnIndex, s, false);
        }
        await this.delay(160 / this.gameSpeed);
      }
    }

    // Now pawn has landed on final step
    const landedStep = pawn.stepCount;

    // Check if reached Goal / Home (step 56)
    if (landedStep === 56) {
      if (window.ludoAudio) window.ludoAudio.playHome();
      this.emitLog(`🎉 ${player.name}'s token reached HOME!`, 'highlight');
      bonusTurnAwarded = true;

      // Check if player completed all 4 tokens
      const finishedPawns = player.pawns.filter(p => p.stepCount === 56).length;
      if (finishedPawns === 4) {
        const rank = this.ranksAssigned.length + 1;
        player.rank = rank;
        this.ranksAssigned.push(player);
        this.emitLog(`🏆 ${player.name} finished in Rank #${rank}!`, 'success');

        // Check if game has ended (only 1 or 0 unfinished active players remaining)
        const unfinished = this.players.filter(p => p.active && p.rank === null);
        if (unfinished.length <= 1) {
          if (unfinished.length === 1) {
            unfinished[0].rank = this.ranksAssigned.length + 1;
            this.ranksAssigned.push(unfinished[0]);
          }
          this.endGame();
          return true;
        }
      }
    } else if (landedStep >= 0 && landedStep <= 50) {
      // Check for capture on the 52-step common track
      const globalIndex = (player.startIndex + landedStep) % 52;
      const isSafe = LUDO_CONFIG.isSafeTrackIndex(globalIndex);

      if (isSafe) {
        if (window.ludoAudio) window.ludoAudio.playSafe();
      } else {
        // Check for opponent tokens at this position
        const capturedOpponents = [];
        this.players.forEach(opp => {
          if (!opp.active || opp.id === player.id) return;
          opp.pawns.forEach((oppPawn, oppPawnIdx) => {
            if (oppPawn.stepCount >= 0 && oppPawn.stepCount <= 50) {
              const oppGlobalIndex = (opp.startIndex + oppPawn.stepCount) % 52;
              if (oppGlobalIndex === globalIndex) {
                capturedOpponents.push({ opp, oppPawn, oppPawnIdx });
              }
            }
          });
        });

        if (capturedOpponents.length > 0) {
          // Knock out opponent tokens!
          for (const item of capturedOpponents) {
            item.oppPawn.stepCount = -1; // Send back to yard
            this.stats.totalCaptures++;
            if (window.ludoAudio) window.ludoAudio.playCapture();

            if (this.onPawnCaptured) {
              await this.onPawnCaptured(item.opp.id, item.oppPawnIdx);
            }
            this.emitLog(`⚔️ ${player.name} captured ${item.opp.name}'s token!`, 'danger');
          }
          bonusTurnAwarded = true;
          await this.delay(300 / this.gameSpeed);
        }
      }
    }

    // Check if player gets a bonus turn
    if (this.diceValue === 6 && !player.rank) {
      bonusTurnAwarded = true;
    }

    if (bonusTurnAwarded && !player.rank) {
      this.emitLog(`⭐ Extra turn awarded to ${player.name}!`, 'highlight');
      this.phase = 'WAITING_FOR_ROLL';
      if (this.onStateChange) this.onStateChange(this, { action: 'bonusTurn' });
      this.checkBotTurn();
    } else {
      this.passTurn();
    }

    return true;
  }

  // Pass turn to next active, unfinished player
  passTurn() {
    if (this.phase === 'GAME_OVER') return;

    let attempts = 0;
    do {
      this.currentTurnIndex = (this.currentTurnIndex + 1) % this.activePlayerIndices.length;
      attempts++;
    } while (this.getCurrentPlayer().rank !== null && attempts < this.activePlayerIndices.length);

    this.consecutiveSixes = 0;
    this.phase = 'WAITING_FOR_ROLL';

    if (this.onStateChange) this.onStateChange(this, { action: 'turnChanged' });
    this.checkBotTurn();
  }

  // If current player is bot and phase is waiting for roll, roll automatically
  async checkBotTurn() {
    if (this.phase !== 'WAITING_FOR_ROLL') return;
    const player = this.getCurrentPlayer();
    if (!player || player.type !== 'bot') return;

    await this.delay(650 / this.gameSpeed);
    if (this.phase === 'WAITING_FOR_ROLL' && this.getCurrentPlayer().id === player.id) {
      this.rollDice();
    }
  }

  endGame() {
    this.phase = 'GAME_OVER';
    if (window.ludoAudio) window.ludoAudio.playWin();
    this.emitLog(`🏆 Game finished! Winner: ${this.ranksAssigned[0]?.name || 'Player'}!`, 'success');

    if (this.onGameOver) {
      this.onGameOver(this.ranksAssigned, this.stats);
    }
    if (this.onStateChange) this.onStateChange(this, { action: 'gameOver' });
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, Math.max(10, ms)));
  }
}

window.LudoGame = LudoGame;
