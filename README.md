# 🎲 LUDO SUPREME 3D — Championship Edition (2026)

A modern, fluid, beautifully animated 3D Ludo board game built in pure HTML5, CSS3 3D transforms, JavaScript (ES6+), and procedural Web Audio API. 100% in English with smooth animations, intelligent computer bots, multiple game modes, and customizable visual themes.

---

## ✨ Features & Highlights

- **3D Physics Animated Dice:**
  - Full 3D perspective cube rendered with CSS 3D transforms.
  - Realistic tumbling animations across X, Y, and Z axes on roll.
  - Authentic dice pips (dots) with drop shadows and floating result badges.
  - Roll via button click, clicking directly on the 3D dice, or pressing the **Spacebar**.

- **Fluid Tactile Pawn Animations:**
  - Tokens bounce and hop step-by-step with an arc trajectory.
  - Playable tokens pulse with an active radar beacon glow to guide your moves.
  - Smart multi-token clustering: multiple tokens on the same square automatically scale and offset neatly so all are visible.
  - Dramatic capture knockout effect with shockwave screen shake, spark blast, and spinning return to yard.

- **Celebratory Confetti & Sound Effects:**
  - Procedural Web Audio API sound synthesizer: dice rattles, wooden land thuds, melodic marimba hops, capture power strikes, and victory brass fanfares. Zero external audio file dependencies—works seamlessly anywhere.
  - Full-screen multi-colored HTML5 Canvas confetti explosion on game wins and major milestones.

- **Game Modes:**
  - **vs Computer (AI):** Play solo against 1, 2, or 3 smart heuristic bots.
  - **Pass & Play (Local Multiplayer):** Play with family and friends on the same screen (2 to 4 players).
  - **Bot Spectator Mode:** Watch computer bots compete against each other.

- **Smart AI Heuristics:**
  - Prioritizes capturing opponents' pawns.
  - Prioritizes reaching the center Home triangle.
  - Escapes from behind-threats.
  - Protects tokens in safe spots and home lanes.

- **Authentic Official Ludo Rules:**
  - Roll a **6** to bring a pawn out of the base yard.
  - Bonus turns on rolling a **6**, capturing an opponent, or reaching **Home**.
  - **Three 6s Penalty:** Rolling three consecutive 6s forfeits the third roll and passes the turn.
  - **8 Safe Spots:** 4 Starting squares and 4 Star cells (★) where tokens are immune to capture.
  - Exact roll required to reach the center Home triangle (step 56).

- **Themes & Speed Controls:**
  - **Royal Classic:** Clean ivory board with rich ruby, emerald, amber, and sapphire hues.
  - **Cyber Neon:** Dark futuristic mode with glowing neon cyan, magenta, and laser green lanes.
  - **Vintage Wood:** Warm walnut/oak wood grain with burnished brass accents.
  - **Speed Selector:** 1x (Normal), 2x (Fast), and 3.5x (Turbo).

---

## 🚀 How to Play / Run the Game

### Method 1: Direct File Open (Easiest)
Simply double-click [`ludo/index.html`](file:///Users/saifaman/Documents/Code/ludo/index.html) to open it in your favorite browser (Chrome, Safari, Firefox, Edge, Arc).

### Method 2: Local Web Server
You can also launch a lightweight local server from your terminal:
```bash
cd /Users/saifaman/Documents/Code/ludo
python3 -m http.server 8080
```
Then visit:
```
http://localhost:8080
```

---

## 📁 File Structure

```
ludo/
├── index.html            # Main HTML5 game interface and modals
├── README.md             # Documentation and game guide
├── css/
│   └── style.css         # 3D dice styling, animations, themes & responsive layouts
└── js/
    ├── audio.js          # Procedural Web Audio API sound synthesizer
    ├── board-config.js   # 15x15 board geometry, 52-step track & safe cells
    ├── ai.js             # Heuristic computer bot decision engine
    ├── game.js           # Core state machine, turns, rules & captures
    ├── ui.js             # 3D dice, token hopping, clustering & confetti engine
    └── main.js           # App bootstrap, SVG board generator & event bindings
```

---

Enjoy the game! 🎲🏆
