/**
 * Ludo Supreme - Board Geometry & Coordinate System
 * Standard 15x15 Ludo Board Grid
 */

const LUDO_CONFIG = {
  GRID_SIZE: 15,
  CELL_PERCENT: 100 / 15, // 6.666667%

  // 4 Player Color Definitions
  PLAYERS: {
    red: {
      id: 'red',
      name: 'Red',
      colorName: 'Red',
      hex: '#ef4444',
      lightHex: '#fecaca',
      darkHex: '#991b1b',
      startIndex: 0,
      homeEntranceIndex: 50,
      startCoord: { r: 6, c: 1 },
      yardPockets: [
        { r: 1, c: 1 },
        { r: 1, c: 3 },
        { r: 3, c: 1 },
        { r: 3, c: 3 }
      ],
      homeStretch: [
        { r: 7, c: 1 },
        { r: 7, c: 2 },
        { r: 7, c: 3 },
        { r: 7, c: 4 },
        { r: 7, c: 5 }
      ],
      goalCoord: { r: 7, c: 6.3 },
      order: 0
    },
    green: {
      id: 'green',
      name: 'Green',
      colorName: 'Green',
      hex: '#10b981',
      lightHex: '#a7f3d0',
      darkHex: '#065f46',
      startIndex: 13,
      homeEntranceIndex: 11,
      startCoord: { r: 1, c: 8 },
      yardPockets: [
        { r: 1, c: 10 },
        { r: 1, c: 12 },
        { r: 3, c: 10 },
        { r: 3, c: 12 }
      ],
      homeStretch: [
        { r: 1, c: 7 },
        { r: 2, c: 7 },
        { r: 3, c: 7 },
        { r: 4, c: 7 },
        { r: 5, c: 7 }
      ],
      goalCoord: { r: 6.3, c: 7 },
      order: 1
    },
    yellow: {
      id: 'yellow',
      name: 'Yellow',
      colorName: 'Yellow',
      hex: '#f59e0b',
      lightHex: '#fde68a',
      darkHex: '#92400e',
      startIndex: 26,
      homeEntranceIndex: 24,
      startCoord: { r: 8, c: 13 },
      yardPockets: [
        { r: 10, c: 10 },
        { r: 10, c: 12 },
        { r: 12, c: 10 },
        { r: 12, c: 12 }
      ],
      homeStretch: [
        { r: 7, c: 13 },
        { r: 7, c: 12 },
        { r: 7, c: 11 },
        { r: 7, c: 10 },
        { r: 7, c: 9 }
      ],
      goalCoord: { r: 7, c: 7.7 },
      order: 2
    },
    blue: {
      id: 'blue',
      name: 'Blue',
      colorName: 'Blue',
      hex: '#3b82f6',
      lightHex: '#bfdbfe',
      darkHex: '#1e40af',
      startIndex: 39,
      homeEntranceIndex: 37,
      startCoord: { r: 13, c: 6 },
      yardPockets: [
        { r: 10, c: 1 },
        { r: 10, c: 3 },
        { r: 12, c: 1 },
        { r: 12, c: 3 }
      ],
      homeStretch: [
        { r: 13, c: 7 },
        { r: 12, c: 7 },
        { r: 11, c: 7 },
        { r: 10, c: 7 },
        { r: 9, c: 7 }
      ],
      goalCoord: { r: 7.7, c: 7 },
      order: 3
    }
  },

  // 52 common track steps (row, column) in clockwise order
  TRACK_52: [
    /* 0..4: Left arm top row heading right */
    { r: 6, c: 1 },  // 0: Red Start (SAFE)
    { r: 6, c: 2 },  // 1
    { r: 6, c: 3 },  // 2
    { r: 6, c: 4 },  // 3
    { r: 6, c: 5 },  // 4
    /* 5..10: Top arm left column heading up */
    { r: 5, c: 6 },  // 5
    { r: 4, c: 6 },  // 6
    { r: 3, c: 6 },  // 7
    { r: 2, c: 6 },  // 8: Star (SAFE)
    { r: 1, c: 6 },  // 9
    { r: 0, c: 6 },  // 10
    /* 11..12: Top arm top apex */
    { r: 0, c: 7 },  // 11
    { r: 0, c: 8 },  // 12
    /* 13..17: Top arm right column heading down */
    { r: 1, c: 8 },  // 13: Green Start (SAFE)
    { r: 2, c: 8 },  // 14
    { r: 3, c: 8 },  // 15
    { r: 4, c: 8 },  // 16
    { r: 5, c: 8 },  // 17
    /* 18..23: Right arm top row heading right */
    { r: 6, c: 9 },  // 18
    { r: 6, c: 10 }, // 19
    { r: 6, c: 11 }, // 20
    { r: 6, c: 12 }, // 21: Star (SAFE)
    { r: 6, c: 13 }, // 22
    { r: 6, c: 14 }, // 23
    /* 24..25: Right arm right apex */
    { r: 7, c: 14 }, // 24
    { r: 8, c: 14 }, // 25
    /* 26..30: Right arm bottom row heading left */
    { r: 8, c: 13 }, // 26: Yellow Start (SAFE)
    { r: 8, c: 12 }, // 27
    { r: 8, c: 11 }, // 28
    { r: 8, c: 10 }, // 29
    { r: 8, c: 9 },  // 30
    /* 31..36: Bottom arm right column heading down */
    { r: 9, c: 8 },  // 31
    { r: 10, c: 8 }, // 32
    { r: 11, c: 8 }, // 33
    { r: 12, c: 8 }, // 34: Star (SAFE)
    { r: 13, c: 8 }, // 35
    { r: 14, c: 8 }, // 36
    /* 37..38: Bottom arm bottom apex */
    { r: 14, c: 7 }, // 37
    { r: 14, c: 6 }, // 38
    /* 39..43: Bottom arm left column heading up */
    { r: 13, c: 6 }, // 39: Blue Start (SAFE)
    { r: 12, c: 6 }, // 40
    { r: 11, c: 6 }, // 41
    { r: 10, c: 6 }, // 42
    { r: 9, c: 6 },  // 43
    /* 44..49: Left arm bottom row heading left */
    { r: 8, c: 5 },  // 44
    { r: 8, c: 4 },  // 45
    { r: 8, c: 3 },  // 46
    { r: 8, c: 2 },  // 47: Star (SAFE)
    { r: 8, c: 1 },  // 48
    { r: 8, c: 0 },  // 49
    /* 50..51: Left arm left apex */
    { r: 7, c: 0 },  // 50
    { r: 6, c: 0 }   // 51
  ],

  // 8 Safe Spot Indices on TRACK_52
  SAFE_TRACK_INDICES: [0, 8, 13, 21, 26, 34, 39, 47],

  // Check if a global track index is safe
  isSafeTrackIndex(index) {
    return this.SAFE_TRACK_INDICES.includes(index);
  },

  // Get coordinate for a player's pawn given its stepCount (0 to 56, or -1 for yard)
  getPawnCoordinate(playerId, pawnIndex, stepCount) {
    const player = this.PLAYERS[playerId];
    if (stepCount < 0) {
      // In base yard
      return player.yardPockets[pawnIndex];
    }
    if (stepCount >= 0 && stepCount <= 50) {
      // Along common 52-step track
      const globalIndex = (player.startIndex + stepCount) % 52;
      return this.TRACK_52[globalIndex];
    }
    if (stepCount >= 51 && stepCount <= 55) {
      // Home stretch (1 to 5)
      const stretchIdx = stepCount - 51;
      return player.homeStretch[stretchIdx];
    }
    // Reached Goal / Home Triangle
    return player.goalCoord;
  },

  // Convert (row, col) grid coordinates to CSS percentage position (left%, top%)
  coordToPercent(r, c) {
    const cellSize = 100 / 15;
    return {
      left: (c + 0.5) * cellSize,
      top: (r + 0.5) * cellSize
    };
  }
};

window.LUDO_CONFIG = LUDO_CONFIG;
