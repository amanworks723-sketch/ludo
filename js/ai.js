/**
 * Ludo Supreme - Smart AI Engine
 * Heuristic evaluation for computer opponents
 */
class LudoAI {
  constructor(game) {
    this.game = game;
  }

  // Choose best pawn to move given valid pawn indices and dice value
  chooseBestMove(playerId, validPawnIndices, diceValue) {
    if (!validPawnIndices || validPawnIndices.length === 0) return null;
    if (validPawnIndices.length === 1) return validPawnIndices[0];

    let bestScore = -Infinity;
    let bestPawnIndex = validPawnIndices[0];

    const player = this.game.players.find(p => p.id === playerId);
    if (!player) return validPawnIndices[0];

    for (const pawnIndex of validPawnIndices) {
      const pawn = player.pawns[pawnIndex];
      const score = this.evaluateMove(player, pawn, pawnIndex, diceValue);

      if (score > bestScore) {
        bestScore = score;
        bestPawnIndex = pawnIndex;
      }
    }

    return bestPawnIndex;
  }

  evaluateMove(player, pawn, pawnIndex, diceValue) {
    let score = 0;

    // 1. Moving out of yard on rolling a 6
    if (pawn.stepCount === -1) {
      // Base score for releasing a token
      score += 650;
      // Bonus if board is currently empty for this player
      const activePawns = player.pawns.filter(p => p.stepCount >= 0 && p.stepCount < 56).length;
      if (activePawns === 0) score += 400;
      return score + Math.random() * 20;
    }

    const currentStep = pawn.stepCount;
    const targetStep = currentStep + diceValue;

    // 2. Can Reach Goal (Home Triangle)
    if (targetStep === 56) {
      score += 1500; // Winning goal! Highest priority
      return score;
    }

    // 3. Can Enter Safe Home Stretch (steps 51 to 55)
    if (currentStep < 51 && targetStep >= 51) {
      score += 700;
    }

    // Check target position on global track (if step < 51)
    if (targetStep <= 50) {
      const targetGlobalIndex = (player.startIndex + targetStep) % 52;
      const isTargetSafe = LUDO_CONFIG.isSafeTrackIndex(targetGlobalIndex);

      // 4. Capture an opponent!
      if (!isTargetSafe) {
        const capturableEnemies = this.getOpponentPawnsAtTrackIndex(player.id, targetGlobalIndex);
        if (capturableEnemies.length > 0) {
          score += 1200; // Huge capture bonus!
        }
      }

      // 5. Land on a Safe Star / Starting Cell
      if (isTargetSafe) {
        score += 450;
      }

      // 6. Check if target position puts pawn in immediate danger
      if (!isTargetSafe) {
        const isTargetThreatened = this.isTrackIndexThreatened(player.id, targetGlobalIndex);
        if (isTargetThreatened) {
          score -= 300; // Danger penalty
        }
      }
    }

    // 7. Escape from current danger
    if (currentStep <= 50) {
      const currentGlobalIndex = (player.startIndex + currentStep) % 52;
      const isCurrentSafe = LUDO_CONFIG.isSafeTrackIndex(currentGlobalIndex);
      if (!isCurrentSafe && this.isTrackIndexThreatened(player.id, currentGlobalIndex)) {
        score += 500; // Escape bonus!
      }
    }

    // 8. General progress towards finish
    score += targetStep * 4;

    // Slight randomness to avoid repetitive play
    score += Math.random() * 25;

    return score;
  }

  // Find opponent pawns located at a specific global track index
  getOpponentPawnsAtTrackIndex(myPlayerId, trackIndex) {
    const opponents = [];
    for (const player of this.game.players) {
      if (!player.active || player.id === myPlayerId) continue;
      for (const pawn of player.pawns) {
        if (pawn.stepCount >= 0 && pawn.stepCount <= 50) {
          const enemyTrackIndex = (player.startIndex + pawn.stepCount) % 52;
          if (enemyTrackIndex === trackIndex) {
            opponents.push({ player, pawn });
          }
        }
      }
    }
    return opponents;
  }

  // Check if an enemy pawn is 1 to 6 steps behind a track index
  isTrackIndexThreatened(myPlayerId, trackIndex) {
    for (const player of this.game.players) {
      if (!player.active || player.id === myPlayerId) continue;
      for (const pawn of player.pawns) {
        if (pawn.stepCount >= 0 && pawn.stepCount <= 50) {
          const enemyTrackIndex = (player.startIndex + pawn.stepCount) % 52;
          // Calculate distance along 52 loop from enemy to target
          const dist = (trackIndex - enemyTrackIndex + 52) % 52;
          if (dist >= 1 && dist <= 6) {
            return true;
          }
        }
      }
    }
    return false;
  }
}

window.LudoAI = LudoAI;
