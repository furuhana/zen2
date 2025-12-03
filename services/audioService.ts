
export class AudioService {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private isMuted: boolean = false;
  
  // Music State
  private activeTimeouts: number[] = [];
  private activeNodes: AudioNode[] = [];
  private tapeHissNode: AudioBufferSourceNode | null = null;

  // Lobby/Ambient Music State
  private lobbyNodes: AudioNode[] = [];
  private lobbyGain: GainNode | null = null;
  private lobbyTimeouts: number[] = [];
  private desiredLobbyVolume: number = 0.5;
  private isLobbyPlaying: boolean = false; // Track if lobby music is currently active
  private stopLobbyTimer: number | null = null; // Track the cleanup timer

  // Note Frequencies
  private NOTES: Record<string, number> = {
    'R': 0,
    // Octave 1 (Sub/Drums)
    'C1': 32.70, 'D1': 36.71, 'E1': 41.20, 'F1': 43.65, 'G1': 49.00, 'A1': 55.00, 'B1': 61.74,
    // Octave 2 (Bass)
    'C2': 65.41, 'C#2': 69.30, 'D2': 73.42, 'D#2': 77.78, 'E2': 82.41, 'F2': 87.31, 'F#2': 92.50, 'G2': 98.00, 'G#2': 103.83, 'A2': 110.00, 'Bb2': 116.54, 'B2': 123.47,
    // Octave 3 (Bass/Low Mid)
    'C3': 130.81, 'C#3': 138.59, 'D3': 146.83, 'D#3': 155.56, 'E3': 164.81, 'F3': 174.61, 'F#3': 185.00, 'G3': 196.00, 'G#3': 207.65, 'A3': 220.00, 'Bb3': 233.08, 'B3': 246.94,
    // Octave 4 (Mid)
    'C4': 261.63, 'C#4': 277.18, 'D4': 293.66, 'D#4': 311.13, 'E4': 329.63, 'F4': 349.23, 'F#4': 369.99, 'G4': 392.00, 'G#4': 415.30, 'A4': 440.00, 'Bb4': 466.16, 'B4': 493.88,
    // Octave 5 (High)
    'C5': 523.25, 'C#5': 554.37, 'D5': 587.33, 'D#5': 622.25, 'E5': 659.25, 'F5': 698.46, 'F#5': 739.99, 'G5': 783.99, 'G#5': 830.61, 'A5': 880.00, 'Bb5': 932.33, 'B5': 987.77,
    // Octave 6 (Sparkle)
    'C6': 1046.50, 'C#6': 1108.73, 'D6': 1174.66, 'E6': 1318.51
  };

  // Base duration for 1/4 note in seconds (approx 120 BPM -> 0.5s per beat)
  private BEAT_DURATION = 0.5; 

  private init() {
    if (!this.ctx) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioContextClass();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 0.5; // Master volume
      this.masterGain.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public resumeContext() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  // --- Core Generators ---

  private playTone(
    freq: number, 
    type: OscillatorType, 
    duration: number, 
    startTime: number = 0, 
    vol: number = 0.1,
    slide: boolean = false
  ) {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx || !this.masterGain) return;

    const t = this.ctx.currentTime + startTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    if (slide) {
        osc.frequency.exponentialRampToValueAtTime(freq * 0.5, t + duration);
    }

    // Envelope
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(vol, t + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, t + duration);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + duration);
  }

  private createNoiseBuffer(): AudioBuffer | null {
    if (!this.ctx) return null;
    const bufferSize = this.ctx.sampleRate * 2; // 2 seconds
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    return buffer;
  }

  // --- Instruments ---

  private playMelodyNote(noteName: string, startTime: number, duration: number, destination?: AudioNode) {
    if (!this.ctx || !this.masterGain || noteName === 'R') return;
    const freq = this.NOTES[noteName];
    if (!freq) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();
    const dest = destination || this.masterGain;

    osc.type = 'square'; // 8-bit lead
    osc.frequency.setValueAtTime(freq, startTime);
    
    // Slight Vibrato
    osc.detune.setValueAtTime(0, startTime);
    osc.detune.linearRampToValueAtTime(5, startTime + duration);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(2500, startTime); // Softer

    gain.gain.setValueAtTime(0, startTime);
    gain.gain.linearRampToValueAtTime(0.03, startTime + 0.02); // Low volume
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(dest);
    osc.start(startTime);
    osc.stop(startTime + duration);
    this.activeNodes.push(osc, gain);
  }

  private playBassNote(noteName: string, startTime: number, duration: number, destination?: AudioNode) {
    if (!this.ctx || !this.masterGain || noteName === 'R') return;
    const freq = this.NOTES[noteName];
    if (!freq) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const dest = destination || this.masterGain;

    osc.type = 'triangle'; // Rounder bass
    osc.frequency.setValueAtTime(freq, startTime);

    gain.gain.setValueAtTime(0, startTime);
    gain.gain.linearRampToValueAtTime(0.06, startTime + 0.02); // Slightly louder than melody
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

    osc.connect(gain);
    gain.connect(dest);
    osc.start(startTime);
    osc.stop(startTime + duration);
    this.activeNodes.push(osc, gain);
  }

  private playKick(startTime: number, destination?: AudioNode) {
    if (!this.ctx || !this.masterGain) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const dest = destination || this.masterGain;

    osc.type = 'square'; // 8-bit kick
    osc.frequency.setValueAtTime(120, startTime);
    osc.frequency.exponentialRampToValueAtTime(50, startTime + 0.08);

    gain.gain.setValueAtTime(0.15, startTime);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.1);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 150;

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(dest);
    osc.start(startTime);
    osc.stop(startTime + 0.1);
    this.activeNodes.push(osc, gain);
  }

  private playSnare(startTime: number, destination?: AudioNode) {
    if (!this.ctx || !this.masterGain) return;
    const dest = destination || this.masterGain;
    
    // Noise part (Bitcrushed feel)
    const buffer = this.createNoiseBuffer();
    if (buffer) {
        const source = this.ctx.createBufferSource();
        source.buffer = buffer;
        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.05, startTime); // Quiet
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.08);
        
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 3000;
        
        source.connect(filter);
        filter.connect(gain);
        gain.connect(dest);
        source.start(startTime);
        source.stop(startTime + 0.1);
        this.activeNodes.push(source, gain);
    }
  }

  private playHiHat(startTime: number, destination?: AudioNode) {
    if (!this.ctx || !this.masterGain) return;
    const dest = destination || this.masterGain;
    const buffer = this.createNoiseBuffer();
    if (buffer) {
        const source = this.ctx.createBufferSource();
        source.buffer = buffer;
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.value = 6000;
        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.02, startTime); // Very Quiet
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.03); // Short
        source.connect(filter);
        filter.connect(gain);
        gain.connect(dest);
        source.start(startTime);
        source.stop(startTime + 0.05);
        this.activeNodes.push(source, gain);
    }
  }

  // --- Stardew / Pastoral Instruments (8-bit modified) ---

  private playPluck(noteName: string, startTime: number, duration: number, destination?: AudioNode) {
    if (!this.ctx || !this.masterGain || noteName === 'R') return;
    const freq = this.NOTES[noteName];
    if (!freq) return;

    // Chords: Filtered Square for NES feeling
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();
    const dest = destination || this.masterGain;

    osc.type = 'square';
    osc.frequency.setValueAtTime(freq, startTime);
    
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(800, startTime); // Darker 8-bit tone

    // Pluck Envelope
    gain.gain.setValueAtTime(0, startTime);
    gain.gain.linearRampToValueAtTime(0.08, startTime + 0.02); // Quiet
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration); 

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(dest);
    osc.start(startTime);
    osc.stop(startTime + duration + 0.1);
    this.lobbyNodes.push(osc, gain);
  }

  private playLead(noteName: string, startTime: number, duration: number, destination?: AudioNode) {
    if (!this.ctx || !this.masterGain || noteName === 'R') return;
    const freq = this.NOTES[noteName];
    if (!freq) return;

    // Lead: Square wave with Low Pass for Lo-Fi warmth
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();
    const dest = destination || this.masterGain;

    osc.type = 'square';
    osc.frequency.setValueAtTime(freq, startTime);
    
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1200, startTime); // Muffled lead

    // Vibrato
    osc.detune.setValueAtTime(0, startTime);
    osc.detune.linearRampToValueAtTime(8, startTime + duration); // More detune for old tape feel

    // Envelope
    gain.gain.setValueAtTime(0, startTime);
    gain.gain.linearRampToValueAtTime(0.08, startTime + 0.05); // Quiet lead
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(dest);
    osc.start(startTime);
    osc.stop(startTime + duration);
    this.lobbyNodes.push(osc, gain);
  }


  // --- Public SFX Methods ---
  public playBoot() { this.playTone(110, 'square', 0.1, 0); }
  public playClick() { this.playTone(1200, 'square', 0.05, 0, 0.05); }
  public playHover() { this.playTone(600, 'sawtooth', 0.02, 0, 0.02); }
  public playFlip() { this.playTone(400, 'square', 0.05, 0, 0.05); this.playTone(300, 'square', 0.05, 0.05, 0.05); }
  public playKeyStroke() { const freq = 800 + Math.random() * 200; this.playTone(freq, 'square', 0.02, 0, 0.03); }
  public playInsertTape() { this.playTone(100, 'sawtooth', 0.2, 0.1); this.playTone(80, 'square', 0.3, 0); }
  public playEjectTape() { this.playTone(150, 'sawtooth', 0.2, 0); this.playTone(200, 'square', 0.1, 0.2); }
  public playPowerDown() { 
    if (this.isMuted) return; this.init(); if (!this.ctx || !this.masterGain) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine'; osc.frequency.setValueAtTime(400, t); osc.frequency.exponentialRampToValueAtTime(10, t + 0.4);
    gain.gain.setValueAtTime(0.3, t); gain.gain.linearRampToValueAtTime(0, t + 0.4);
    osc.connect(gain); gain.connect(this.masterGain); osc.start(t); osc.stop(t + 0.4);
  }
  public playDelete() { this.playTone(100, 'sawtooth', 0.1, 0, 0.2); this.playStaticNoise(0.2); }
  public playSuccess() { this.playTone(523.25, 'triangle', 0.1, 0); this.playTone(659.25, 'triangle', 0.1, 0.1); this.playTone(783.99, 'triangle', 0.4, 0.2); }
  public playStaticNoise(duration: number = 0.5) {
    if (this.isMuted) return; this.init(); if (!this.ctx || !this.masterGain) return;
    const buffer = this.createNoiseBuffer(); if (!buffer) return;
    const noise = this.ctx.createBufferSource(); noise.buffer = buffer; noise.loop = true;
    const gain = this.ctx.createGain(); gain.gain.setValueAtTime(0.05, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + duration);
    noise.connect(gain); gain.connect(this.masterGain); noise.start(); noise.stop(this.ctx.currentTime + duration);
  }

  // --- Lobby Music ---

  public async startLobbyMusic() {
    this.init();
    if (this.ctx && this.ctx.state === 'suspended') {
      try { await this.ctx.resume(); } catch(e) {}
    }

    if (!this.ctx || !this.masterGain) return;

    // Fix Race Condition: Cancel any pending stop cleanup if we are restarting
    if (this.stopLobbyTimer !== null) {
      clearTimeout(this.stopLobbyTimer);
      this.stopLobbyTimer = null;
    }

    // Idempotency check to prevent restart glitches
    if (this.isLobbyPlaying) {
        this.setLobbyVolume(this.desiredLobbyVolume);
        return;
    }
    
    this.isLobbyPlaying = true;

    this.lobbyGain = this.ctx.createGain();
    this.lobbyGain.gain.setValueAtTime(0, this.ctx.currentTime);
    this.lobbyGain.gain.linearRampToValueAtTime(this.desiredLobbyVolume, this.ctx.currentTime + 2);
    this.lobbyGain.connect(this.masterGain);
    this.lobbyNodes.push(this.lobbyGain);

    const beatDuration = 0.5; 

    // Background Tape Hiss for Lo-Fi texture
    const buffer = this.createNoiseBuffer();
    if (buffer) {
      const hiss = this.ctx.createBufferSource();
      hiss.buffer = buffer;
      hiss.loop = true;
      const hissGain = this.ctx.createGain();
      hissGain.gain.value = 0.05; // Audible noise floor
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 1000;
      hiss.connect(filter);
      filter.connect(hissGain);
      hissGain.connect(this.lobbyGain);
      hiss.start();
      this.lobbyNodes.push(hiss, hissGain);
    }

    // User-Defined Composition
    const pattern = {
        // C Major -> F Major -> G Major -> A Minor
        pluck: [
            // C: C4 E4 G4
            ['C4', 8], ['E4', 8], ['G4', 8], ['E4', 8], ['C4', 8], ['E4', 8], ['G4', 8], ['E4', 8],
            // F: F4 A4 C5
            ['F4', 8], ['A4', 8], ['C5', 8], ['A4', 8], ['F4', 8], ['A4', 8], ['C5', 8], ['A4', 8],
            // G: G4 B4 D5
            ['G4', 8], ['B4', 8], ['D5', 8], ['B4', 8], ['G4', 8], ['B4', 8], ['D5', 8], ['B4', 8],
            // Am: A4 C5 E5
            ['A4', 8], ['C5', 8], ['E5', 8], ['C5', 8], ['A4', 8], ['C5', 8], ['E5', 8], ['C5', 8]
        ],
        // Lead Melody from prompt
        lead: [
            // Section 1
            ['C4', 8], ['E4', 8], ['G4', 8], ['C5', 8], ['E5', 2], ['R', 4], // C4 E4 G4 C5 E5
            ['D4', 8], ['E4', 8], ['F4', 8], ['G4', 8], ['A4', 2], ['R', 4], // D4 E4 F4 G4 A4
            ['C4', 8], ['G4', 8], ['E4', 8], ['C5', 8], ['R', 2],           // C4 G4 E4 C5
            ['F4', 8], ['A4', 8], ['G4', 8], ['F4', 8], ['E4', 2], ['R', 4], // F4 A4 G4 F4 E4

            // Section 2
            ['G4', 8], ['E4', 8], ['C4', 8], ['G4', 8], ['R', 2],           // G4 E4 C4 G4
            ['F4', 8], ['E4', 8], ['D4', 8], ['C4', 8], ['R', 2],           // F4 E4 D4 C4
            ['E4', 8], ['G4', 8], ['C5', 8], ['E4', 8], ['R', 2],           // E4 G4 C5 E4
            ['D4', 8], ['F4', 8], ['A4', 8], ['G4', 8], ['R', 2],           // D4 F4 A4 G4

            // Section 3
            ['C5', 8], ['E5', 8], ['G5', 8], ['C5', 8], ['R', 2],           // C5 E5 G5 C5
            ['C4', 8], ['E4', 8], ['G4', 8], ['C5', 8], ['R', 2],           // C4 E4 G4 C5
            ['F4', 8], ['G4', 8], ['A4', 8], ['G4', 8], ['R', 2],           // F4 G4 A4 G4
            ['D4', 8], ['E4', 8], ['C4', 8], ['F4', 8], ['R', 2],           // D4 E4 C4 F4
            ['R', 1] // Rest for a bar
        ],
        // Drum Pattern: Kick on Quarter, Snare on Backbeat (simulated), HH on 8th
        kick: [
            ['C1', 4], ['C1', 4], ['C1', 4], ['C1', 4]
        ],
        snare: [
            ['R', 4], ['D1', 4], ['R', 4], ['D1', 4]
        ],
        hihat: [
            ['F1', 8], ['F1', 8], ['F1', 8], ['F1', 8], ['F1', 8], ['F1', 8], ['F1', 8], ['F1', 8]
        ]
    };

    // Helper for playing tracks
    const playLobbyTrack = (trackName: string, notes: [string, number][], loopIndex: number = 0) => {
        if (!this.ctx || !this.isLobbyPlaying) return; // Stop if flag cleared
        if (loopIndex >= notes.length) loopIndex = 0;

        const [note, type] = notes[loopIndex];
        const duration = (4 / type) * beatDuration;
        const now = this.ctx.currentTime;

        if (trackName === 'pluck') this.playPluck(note, now, duration * 2, this.lobbyGain!);
        else if (trackName === 'lead') this.playLead(note, now, duration, this.lobbyGain!);
        else if (trackName === 'kick' && note !== 'R') this.playKick(now, this.lobbyGain!);
        else if (trackName === 'snare' && note !== 'R') this.playSnare(now, this.lobbyGain!);
        else if (trackName === 'hihat' && note !== 'R') this.playHiHat(now, this.lobbyGain!);

        const id = window.setTimeout(() => {
            playLobbyTrack(trackName, notes, loopIndex + 1);
        }, duration * 1000);
        this.lobbyTimeouts.push(id);
    };

    playLobbyTrack('pluck', pattern.pluck as [string, number][]);
    playLobbyTrack('lead', pattern.lead as [string, number][]);
    playLobbyTrack('kick', pattern.kick as [string, number][]);
    playLobbyTrack('snare', pattern.snare as [string, number][]);
    playLobbyTrack('hihat', pattern.hihat as [string, number][]);
  }

  public setLobbyVolume(vol: number) {
    this.desiredLobbyVolume = vol;
    if (this.lobbyGain && this.ctx) {
        this.lobbyGain.gain.setTargetAtTime(vol, this.ctx.currentTime, 0.5);
    }
  }

  public stopLobbyMusic() {
    this.isLobbyPlaying = false;
    
    // Clear any existing cleanup timer so we don't have multiple
    if (this.stopLobbyTimer !== null) {
      clearTimeout(this.stopLobbyTimer);
      this.stopLobbyTimer = null;
    }

    // Fade out
    if (this.lobbyGain && this.ctx) {
         this.lobbyGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.5);
    }

    // Delayed cleanup
    this.stopLobbyTimer = window.setTimeout(() => {
        this.cleanupLobbyNodes();
        this.lobbyTimeouts.forEach(id => clearTimeout(id));
        this.lobbyTimeouts = [];
        this.stopLobbyTimer = null;
    }, 550);
  }

  private cleanupLobbyNodes() {
    this.lobbyNodes.forEach(node => {
        try {
           if (node instanceof OscillatorNode || node instanceof AudioBufferSourceNode) node.stop();
           node.disconnect();
        } catch(e) {}
    });
    this.lobbyNodes = [];
    if (this.lobbyGain) {
        try { this.lobbyGain.disconnect(); } catch(e) {}
        this.lobbyGain = null;
    }
  }

  // --- Music Sequencer (Tape Player) ---

  private getDuration(type: number): number {
    return (4 / type) * this.BEAT_DURATION;
  }

  private getPattern(moodColor: string): { melody: [string, number][], bass: [string, number][], kick: [string, number][], snare: [string, number][], hihat: [string, number][] } {
    // 1. Happy (Pink) - Jumpy, 8th notes, upbeat
    if (moodColor.includes("pink")) {
        return {
            melody: [
              ['C4', 8], ['D4', 8], ['E4', 8], ['G4', 8], ['C5', 4], 
              ['E4', 8], ['G4', 8], ['C5', 8], ['D5', 8], ['E5', 4],
              ['G4', 8], ['E4', 8], ['C4', 8], ['G4', 8], ['R', 4],
              ['C4', 8], ['E4', 8], ['G4', 8], ['C5', 8], ['D5', 4]
            ],
            bass: [
              ['C3', 4], ['G3', 4], ['E3', 4], ['G3', 4],
              ['C3', 4], ['G3', 4], ['F3', 4], ['G3', 4]
            ],
            kick: [['C1', 4], ['C1', 4], ['C1', 4], ['C1', 4]], // BD 4
            snare: [['R', 4], ['D1', 4], ['R', 4], ['D1', 4]], // SD 4
            hihat: [['F1', 8], ['F1', 8], ['F1', 8], ['F1', 8], ['F1', 8], ['F1', 8], ['F1', 8], ['F1', 8]] // HH 8
        };
    }
    // 2. Melancholy (Blue) - Slow, Quarter notes
    else if (moodColor.includes("blue")) {
        return {
            melody: [
              ['D4', 4], ['F4', 4], ['E4', 4], ['D4', 4], ['C4', 2], ['R', 2],
              ['E4', 4], ['D4', 4], ['C4', 4], ['A3', 4], ['G3', 2], ['R', 2],
              ['D4', 4], ['C4', 4], ['E4', 4], ['D4', 4], ['C4', 2], ['R', 2],
              ['G3', 4], ['E4', 4], ['D4', 4], ['F4', 4], ['E4', 2], ['R', 2]
            ],
            bass: [
              ['D3', 2], ['C3', 2], ['A2', 2], ['G2', 2], 
              ['D3', 2], ['C3', 2], ['G2', 2], ['E2', 2]
            ],
            kick: [['C1', 4], ['R', 4], ['C1', 4], ['R', 4]], // BD 4 spaced
            snare: [['R', 8], ['D1', 8], ['R', 8], ['D1', 8], ['R', 8], ['D1', 8], ['R', 8], ['D1', 8]], // SD 8
            hihat: [['F1', 4], ['F1', 4], ['F1', 4], ['F1', 4]] // HH 4
        };
    }
    // 3. Throbbing/Excitement (Amber) - Fast, Urgent
    else if (moodColor.includes("amber")) {
        return {
            melody: [
              ['C4', 8], ['E4', 8], ['G4', 8], ['A4', 8], ['R', 4],
              ['C5', 8], ['D5', 8], ['E5', 8], ['G4', 8], ['R', 4],
              ['G4', 8], ['F4', 8], ['E4', 8], ['D4', 8], ['R', 4],
              ['A4', 8], ['E4', 8], ['G4', 8], ['C5', 8], ['R', 4]
            ],
            bass: [
              ['C3', 4], ['A2', 4], ['C3', 4], ['G3', 4],
              ['G3', 4], ['F3', 4], ['A3', 4], ['C4', 4]
            ],
            kick: [['C1', 2], ['C1', 2]], // BD 2 (Half note feel)
            snare: [['R', 4], ['D1', 4], ['R', 4], ['D1', 4]], // SD 4
            hihat: [['F1', 8], ['F1', 8], ['F1', 8], ['F1', 8], ['F1', 8], ['F1', 8], ['F1', 8], ['F1', 8]] // HH 8
        };
    }
    // 4. Angry (Red) - Aggressive, Heavy
    else if (moodColor.includes("red")) {
        return {
            melody: [
              ['G4', 8], ['F4', 8], ['E4', 8], ['D4', 8], ['C4', 2],
              ['D4', 8], ['C4', 8], ['B3', 8], ['A3', 8], ['R', 2],
              ['C4', 8], ['E4', 8], ['G4', 8], ['A4', 8], ['R', 2],
              ['D4', 8], ['E4', 8], ['G4', 8], ['F4', 8], ['E4', 2]
            ],
            bass: [
              ['G2', 4], ['C3', 4], ['D3', 4], ['A2', 4],
              ['C3', 4], ['A3', 4], ['D3', 4], ['E3', 4]
            ],
            kick: [['C1', 2], ['C1', 2]], // BD 2
            snare: [['R', 2], ['D1', 2]], // SD 2
            hihat: [['F1', 4], ['F1', 4], ['F1', 4], ['F1', 4]] // HH 4
        };
    }
    // 5. Relaxed (Emerald) - Flowing, Chill
    else if (moodColor.includes("emerald")) {
        return {
            melody: [
              ['C4', 4], ['E4', 4], ['G4', 4], ['E4', 4],
              ['D4', 2], ['R', 2],
              ['C4', 4], ['G4', 4], ['E4', 4], ['C4', 4],
              ['F4', 4], ['G4', 4], ['E4', 4], ['C4', 4]
            ],
            bass: [
              ['C3', 2], ['G3', 2], ['D3', 2], ['R', 2],
              ['C3', 2], ['E3', 2], ['F3', 2], ['C3', 2]
            ],
            kick: [['C1', 4], ['R', 4], ['C1', 4], ['R', 4]], // BD 4
            snare: [['R', 8], ['D1', 8], ['R', 8], ['D1', 8], ['R', 8], ['D1', 8], ['R', 8], ['D1', 8]], // SD 8
            hihat: [['F1', 8], ['F1', 8], ['F1', 8], ['F1', 8], ['F1', 8], ['F1', 8], ['F1', 8], ['F1', 8]] // HH 8
        };
    }
    // 6. Mysterious (Purple) - Sparse, Minor
    else if (moodColor.includes("purple")) {
        return {
            melody: [
              ['E4', 4], ['G4', 4], ['F4', 4], ['E4', 4], ['D4', 2], ['R', 2],
              ['G4', 4], ['A4', 4], ['G4', 4], ['E4', 4], ['C4', 2], ['R', 2],
              ['F4', 4], ['G4', 4], ['E4', 4], ['D4', 4], ['C4', 2], ['R', 2],
              ['D4', 4], ['G4', 4], ['E4', 4], ['C4', 4], ['R', 4]
            ],
            bass: [
              ['E3', 2], ['F3', 2], ['G3', 2], ['R', 2],
              ['G3', 2], ['A3', 2], ['F3', 2], ['C3', 2]
            ],
            kick: [['C1', 4], ['R', 4], ['C1', 4], ['R', 4]], // BD 4
            snare: [['R', 8], ['D1', 8], ['R', 8], ['D1', 8], ['R', 8], ['D1', 8], ['R', 8], ['D1', 8]], // SD 8
            hihat: [['F1', 8], ['F1', 8], ['F1', 8], ['F1', 8], ['F1', 8], ['F1', 8], ['F1', 8], ['F1', 8]] // HH 8
        };
    }
    
    // Fallback
    return {
        melody: [['C5', 4], ['E5', 4], ['G5', 2]],
        bass: [['C3', 4], ['G3', 4], ['C3', 2]],
        kick: [['C1', 4], ['C1', 4]],
        snare: [['R', 4], ['D1', 4]],
        hihat: [['F1', 8], ['F1', 8]]
    };
  }

  public startLofiLoop(moodColor: string = "bg-amber-600") {
    this.init();
    if (!this.ctx || !this.masterGain) return;
    this.stopLofiLoop(); 

    // Background Tape Hiss
    const buffer = this.createNoiseBuffer();
    if (buffer) {
      this.tapeHissNode = this.ctx.createBufferSource();
      this.tapeHissNode.buffer = buffer;
      this.tapeHissNode.loop = true;
      const hissGain = this.ctx.createGain();
      hissGain.gain.value = 0.03; 
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 800;
      this.tapeHissNode.connect(filter);
      filter.connect(hissGain);
      hissGain.connect(this.masterGain);
      this.tapeHissNode.start();
    }

    const pattern = this.getPattern(moodColor);

    // Track Helper
    const playTrack = (trackName: string, notes: [string, number][], loopIndex: number = 0) => {
        if (!this.ctx) return;
        if (loopIndex >= notes.length) loopIndex = 0; // Loop track

        const [note, type] = notes[loopIndex];
        const duration = this.getDuration(type);
        const now = this.ctx.currentTime;

        // Schedule Sound
        if (trackName === 'melody') this.playMelodyNote(note, now, duration);
        else if (trackName === 'bass') this.playBassNote(note, now, duration);
        else if (trackName === 'kick' && note !== 'R') this.playKick(now);
        else if (trackName === 'snare' && note !== 'R') this.playSnare(now);
        else if (trackName === 'hihat' && note !== 'R') this.playHiHat(now);

        // Schedule Next Note
        const id = window.setTimeout(() => {
            playTrack(trackName, notes, loopIndex + 1);
        }, duration * 1000);
        
        this.activeTimeouts.push(id);
    };

    // Start 5 Parallel Tracks
    playTrack('melody', pattern.melody);
    playTrack('bass', pattern.bass);
    playTrack('kick', pattern.kick);
    playTrack('snare', pattern.snare);
    playTrack('hihat', pattern.hihat);
  }

  public stopLofiLoop() {
    // Clear Loops
    this.activeTimeouts.forEach(id => clearTimeout(id));
    this.activeTimeouts = [];
    
    // Stop Hiss
    if (this.tapeHissNode) {
      try { this.tapeHissNode.stop(); this.tapeHissNode.disconnect(); } catch(e) {}
      this.tapeHissNode = null;
    }

    // Stop All Notes (Hard Stop)
    this.activeNodes.forEach(node => {
        try {
            if (node instanceof OscillatorNode || node instanceof AudioBufferSourceNode) {
                node.stop();
            }
            node.disconnect();
        } catch (e) {}
    });
    this.activeNodes = [];
  }
}

export const sfx = new AudioService();
