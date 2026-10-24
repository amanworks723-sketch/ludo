/**
 * Ludo Supreme - Procedural Web Audio API Engine
 * Generates all sound effects dynamically without external asset dependencies.
 */
class LudoAudio {
  constructor() {
    this.ctx = null;
    this.isMuted = false;
    this.volume = 0.7;
  }

  init() {
    if (!this.ctx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        this.ctx = new AudioContext();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  setMute(mute) {
    this.isMuted = mute;
  }

  setVolume(val) {
    this.volume = Math.max(0, Math.min(1, val));
  }

  // Play a simple synthesized tone
  playTone(freq, type = 'sine', duration = 0.1, gainValue = 0.3) {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

      gain.gain.setValueAtTime(gainValue * this.volume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + duration);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + duration);
    } catch (e) {
      console.warn('Audio playback error', e);
    }
  }

  // Dice rolling rattle sound
  playDiceRoll() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    try {
      const count = 5;
      const now = this.ctx.currentTime;
      for (let i = 0; i < count; i++) {
        const time = now + i * 0.08 + (Math.random() * 0.02);
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(250 + Math.random() * 300, time);

        gain.gain.setValueAtTime(0.2 * this.volume, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.05);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(time);
        osc.stop(time + 0.05);
      }
    } catch (e) {}
  }

  // Dice land impact thud
  playDiceLand() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(160, now);
      osc.frequency.exponentialRampToValueAtTime(40, now + 0.12);

      gain.gain.setValueAtTime(0.4 * this.volume, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.12);
    } catch (e) {}
  }

  // Pawn single hop step sound (melodic marimba pop)
  playHop(stepIndex = 0) {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    try {
      const baseFreq = 440;
      const pentatonic = [0, 2, 4, 7, 9, 12, 14, 16];
      const semitone = pentatonic[stepIndex % pentatonic.length];
      const freq = baseFreq * Math.pow(2, semitone / 12);

      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);

      gain.gain.setValueAtTime(0.3 * this.volume, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.09);
    } catch (e) {}
  }

  // Rolled a six! Joyful ascending chime
  playSix() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    notes.forEach((freq, i) => {
      setTimeout(() => {
        this.playTone(freq, 'triangle', 0.18, 0.35);
      }, i * 70);
    });
  }

  // Reached Safe Zone (shimmering bell)
  playSafe() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    const notes = [880, 1108.73, 1318.51]; // A5, C#6, E6
    notes.forEach((freq, i) => {
      setTimeout(() => {
        this.playTone(freq, 'sine', 0.25, 0.25);
      }, i * 60);
    });
  }

  // Token captured an opponent (punch/laser strike)
  playCapture() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(450, now);
      osc.frequency.exponentialRampToValueAtTime(80, now + 0.25);

      gain.gain.setValueAtTime(0.5 * this.volume, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.25);

      // Followed by a rapid descent whoosh
      setTimeout(() => {
        this.playTone(220, 'sine', 0.15, 0.2);
      }, 100);
    } catch (e) {}
  }

  // Token reached HOME (triumphant brass)
  playHome() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    const chords = [587.33, 739.99, 880, 1174.66]; // D5, F#5, A5, D6
    chords.forEach((freq, i) => {
      setTimeout(() => {
        this.playTone(freq, 'triangle', 0.35, 0.4);
      }, i * 80);
    });
  }

  // Victory Fanfare (Full Game Win Celebration)
  playWin() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    const sequence = [
      { f: 523.25, d: 150 }, // C5
      { f: 523.25, d: 150 }, // C5
      { f: 523.25, d: 150 }, // C5
      { f: 659.25, d: 350 }, // E5
      { f: 587.33, d: 150 }, // D5
      { f: 659.25, d: 150 }, // E5
      { f: 783.99, d: 600 }  // G5
    ];

    let delay = 0;
    sequence.forEach(note => {
      setTimeout(() => {
        this.playTone(note.f, 'triangle', note.d / 1000, 0.45);
      }, delay);
      delay += note.d + 30;
    });
  }

  // UI button click
  playClick() {
    this.playTone(600, 'sine', 0.04, 0.15);
  }
}

// Global instance
window.ludoAudio = new LudoAudio();
