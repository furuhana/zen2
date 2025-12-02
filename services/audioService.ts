
export class AudioService {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private isMuted: boolean = false;
  
  // Music State
  private musicInterval: any = null;
  private activeNodes: AudioNode[] = [];
  private tapeHissNode: AudioBufferSourceNode | null = null;

  private init() {
    if (!this.ctx) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioContextClass();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 0.15; // Keep volume reasonable
      this.masterGain.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  // --- Core Generators ---

  private playTone(
    freq: number, 
    type: OscillatorType, 
    duration: number, 
    startTime: number = 0, 
    vol: number = 0.1
  ) {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx || !this.masterGain) return;

    const t = this.ctx.currentTime + startTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);

    // Envelope
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(vol, t + 0.02);
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

  // --- Public SFX Methods ---

  public playBoot() {
    this.playTone(110, 'square', 0.1, 0);
    this.playTone(220, 'square', 0.1, 0.1);
    this.playTone(440, 'square', 0.4, 0.2);
  }

  public playClick() {
    this.playTone(1200, 'square', 0.05, 0, 0.05);
  }

  public playHover() {
    this.playTone(800, 'sawtooth', 0.01, 0, 0.02);
  }

  public playKeyStroke() {
    const freq = 600 + Math.random() * 200;
    this.playTone(freq, 'square', 0.03, 0, 0.03);
  }

  public playInsertTape() {
    this.playTone(100, 'sawtooth', 0.2, 0.1); 
  }

  public playEjectTape() {
    this.playTone(150, 'sawtooth', 0.2, 0); 
  }

  public playSuccess() {
    const now = 0;
    this.playTone(523.25, 'triangle', 0.1, now); // C5
    this.playTone(659.25, 'triangle', 0.1, now + 0.1); // E5
    this.playTone(783.99, 'triangle', 0.4, now + 0.2); // G5
  }

  public playError() {
    this.playTone(150, 'sawtooth', 0.3, 0);
    this.playTone(100, 'sawtooth', 0.3, 0.1);
  }
  
  public playProcessing() {
    this.playTone(2000, 'sine', 0.05, 0);
    this.playTone(1800, 'sine', 0.05, 0.05);
  }

  public playStaticNoise(duration: number = 0.5) {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx || !this.masterGain) return;

    const buffer = this.createNoiseBuffer();
    if (!buffer) return;

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;
    
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.05, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + duration);

    noise.connect(gain);
    gain.connect(this.masterGain);
    noise.start();
    noise.stop(this.ctx.currentTime + duration);
  }

  // --- Lofi Music Generator ---

  public startLofiLoop() {
    this.init();
    if (!this.ctx || !this.masterGain) return;
    this.stopLofiLoop(); // Ensure no duplicates

    // 1. Background Tape Hiss
    const buffer = this.createNoiseBuffer();
    if (buffer) {
      this.tapeHissNode = this.ctx.createBufferSource();
      this.tapeHissNode.buffer = buffer;
      this.tapeHissNode.loop = true;
      const hissGain = this.ctx.createGain();
      hissGain.gain.value = 0.015; // Very subtle
      
      // Lowpass filter to make it "warm" not harsh
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 800;

      this.tapeHissNode.connect(filter);
      filter.connect(hissGain);
      hissGain.connect(this.masterGain);
      this.tapeHissNode.start();
    }

    // 2. Procedural Melancholic Chords
    const chords = [
      [261.63, 311.13, 392.00, 493.88], // Cm7
      [233.08, 293.66, 349.23, 415.30], // Bb add9
      [207.65, 261.63, 311.13, 392.00], // AbMaj7
      [196.00, 246.94, 293.66, 349.23], // G7
    ];
    
    let step = 0;
    const playChord = () => {
      if (!this.ctx || !this.masterGain) return;
      const now = this.ctx.currentTime;
      const chord = chords[step % chords.length];
      
      chord.forEach((freq, i) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        
        // Detune slightly for "wobbly" tape feel
        const detune = (Math.random() - 0.5) * 15; 
        
        osc.type = 'triangle'; // Softer sound
        osc.frequency.setValueAtTime(freq, now);
        osc.detune.setValueAtTime(detune, now);
        
        // Slow attack, long release (pad-like)
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.03, now + 1); // Fade in
        gain.gain.exponentialRampToValueAtTime(0.001, now + 4.5); // Fade out

        osc.connect(gain);
        gain.connect(this.masterGain!);
        osc.start(now);
        osc.stop(now + 5);
        
        this.activeNodes.push(osc);
        this.activeNodes.push(gain);
      });
      step++;
    };

    playChord();
    this.musicInterval = setInterval(playChord, 4000); // New chord every 4s
  }

  public stopLofiLoop() {
    if (this.musicInterval) {
      clearInterval(this.musicInterval);
      this.musicInterval = null;
    }
    if (this.tapeHissNode) {
      try { this.tapeHissNode.stop(); } catch(e) {}
      this.tapeHissNode = null;
    }
    // Cleanup simple nodes (though they auto-stop, good practice to clear ref)
    this.activeNodes = []; 
  }
}

export const sfx = new AudioService();
