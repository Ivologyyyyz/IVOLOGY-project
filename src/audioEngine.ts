/**
 * Quiet Garden - Audio Procedural Synthesizer Engine
 */
import { AppConfig } from './types';

export class AudioEngine {
  public ctx: AudioContext | null = null;
  private bgAmbientNode: AudioBufferSourceNode | null = null;
  private rainNoiseNode: AudioBufferSourceNode | null = null;
  private rainGainNode: GainNode | null = null;
  private wetLayerNode: AudioBufferSourceNode | null = null;
  private wetLayerGainNode: GainNode | null = null;
  private activeMushroomOsc: OscillatorNode | null = null;
  private activeMushroomGain: GainNode | null = null;

  private lastBirdCallTime = Date.now();
  private nextBirdCallDelay = 15000; // default 15s

  private noiseBuffer: AudioBuffer | null = null;

  constructor(private config: AppConfig) {
    this.nextBirdCallDelay = (this.config.timers.birdCallMin + Math.random() * this.config.timers.birdCallRange) * 1000;
  }

  public init() {
    if (this.ctx) return;
    try {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioCtxClass();
      if (this.ctx.state === 'suspended') {
        this.ctx.resume();
      }

      this.updateStatusText();

      this.noiseBuffer = this.createNoiseBuffer();

      // 1. Background ambient node (very soft wind lowpass murmur)
      const bgNode = this.ctx.createBufferSource();
      bgNode.buffer = this.noiseBuffer;
      bgNode.loop = true;
      const bgLP = this.ctx.createBiquadFilter();
      bgLP.type = 'lowpass';
      bgLP.frequency.value = 1000;
      const bgGain = this.ctx.createGain();
      bgGain.gain.setValueAtTime(0.012, this.ctx.currentTime);

      bgNode.connect(bgLP);
      bgLP.connect(bgGain);
      bgGain.connect(this.ctx.destination);
      bgNode.start();
      this.bgAmbientNode = bgNode;

      // 2. Rain ambient node setup
      const rainNode = this.ctx.createBufferSource();
      rainNode.buffer = this.noiseBuffer;
      rainNode.loop = true;
      const rainLP = this.ctx.createBiquadFilter();
      rainLP.type = 'lowpass';
      rainLP.frequency.value = 2000;
      this.rainGainNode = this.ctx.createGain();
      this.rainGainNode.gain.setValueAtTime(0, this.ctx.currentTime);

      rainNode.connect(rainLP);
      rainLP.connect(this.rainGainNode);
      this.rainGainNode.connect(this.ctx.destination);
      rainNode.start();
      this.rainNoiseNode = rainNode;

      // 3. Wet ambient layer setup
      const wetNode = this.ctx.createBufferSource();
      wetNode.buffer = this.noiseBuffer;
      wetNode.loop = true;
      const wetLP = this.ctx.createBiquadFilter();
      wetLP.type = 'lowpass';
      wetLP.frequency.value = 800;
      this.wetLayerGainNode = this.ctx.createGain();
      this.wetLayerGainNode.gain.setValueAtTime(0, this.ctx.currentTime);

      wetNode.connect(wetLP);
      wetLP.connect(this.wetLayerGainNode);
      this.wetLayerGainNode.connect(this.ctx.destination);
      wetNode.start();
      this.wetLayerNode = wetNode;

    } catch (e) {
      console.warn('[Audio Engine] Init blocked or failed:', e);
    }
  }

  public resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().then(() => this.updateStatusText());
    }
  }

  private updateStatusText() {
    const dbAud = document.getElementById('db-audio');
    if (dbAud && this.ctx) {
      dbAud.innerText = this.ctx.state.toUpperCase();
      if (this.ctx.state === 'running') {
        dbAud.className = 'text-green-400 font-semibold font-mono';
      }
    }
  }

  private createNoiseBuffer(): AudioBuffer {
    const sampleRate = this.ctx ? this.ctx.sampleRate : 44100;
    const bufferSize = 2 * sampleRate;
    const buffer = (this.ctx || new (window.AudioContext || (window as any).webkitAudioContext)()).createBuffer(1, bufferSize, sampleRate);
    const output = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }
    return buffer;
  }

  private getNoiseBuffer(): AudioBuffer {
    if (!this.noiseBuffer) {
      this.noiseBuffer = this.createNoiseBuffer();
    }
    return this.noiseBuffer;
  }

  // --- Dynamic gain manipulation ---

  public updateRainAndMoistureGains(rainFactor: number, wetFactor: number) {
    if (!this.ctx || !this.rainGainNode || !this.wetLayerGainNode) return;
    const t = this.ctx.currentTime;
    
    // Smooth gain scaling
    this.rainGainNode.gain.setTargetAtTime(rainFactor * this.config.thresholds.rainVolCoefficient, t, 0.3);
    this.wetLayerGainNode.gain.setTargetAtTime(wetFactor * 0.04, t, 0.4);
  }

  // --- Particle Synthesizer Hooks ---

  public playSoftButterflyBurst() {
    this.playButterflyFlutterSound();
  }

  public playButterflyFlutterSound() {
    const context = this.ctx;
    if (!context || context.state === 'suspended') return;
    try {
      const t = context.currentTime;
      for (let i = 0; i < 3; i++) {
        const delayTime = i * 0.05;
        const osc = context.createOscillator();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(320 + i * 150, t + delayTime);
        osc.frequency.exponentialRampToValueAtTime(750 + i * 200, t + delayTime + 0.12);

        const gainNode = context.createGain();
        gainNode.gain.setValueAtTime(0, t + delayTime);
        gainNode.gain.linearRampToValueAtTime(0.024, t + delayTime + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.001, t + delayTime + 0.15);

        osc.connect(gainNode);
        gainNode.connect(context.destination);
        osc.start(t + delayTime);
        osc.stop(t + delayTime + 0.18);
      }
    } catch (e) {}
  }

  public playFlowerBloomChime() {
    const context = this.ctx;
    if (!context || context.state === 'suspended') return;
    try {
      const t = context.currentTime;
      const notes = [523.25, 659.25, 783.99, 987.77]; // C5, E5, G5, B5
      notes.forEach((freq, idx) => {
        const timeOffset = idx * 0.04;
        const osc = context.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, t + timeOffset);

        const gainNode = context.createGain();
        gainNode.gain.setValueAtTime(0, t + timeOffset);
        gainNode.gain.linearRampToValueAtTime(0.028, t + timeOffset + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.001, t + timeOffset + 0.3);

        osc.connect(gainNode);
        gainNode.connect(context.destination);
        osc.start(t + timeOffset);
        osc.stop(t + timeOffset + 0.35);
      });
    } catch (e) {}
  }

  public playSoftPlantRustleSound() {
    const context = this.ctx;
    if (!context || context.state === 'suspended') return;
    try {
      const t = context.currentTime;
      const src = context.createBufferSource();
      src.buffer = this.getNoiseBuffer();
      const filter = context.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.setValueAtTime(7500, t);

      const gainNode = context.createGain();
      gainNode.gain.setValueAtTime(0, t);
      gainNode.gain.linearRampToValueAtTime(0.015, t + 0.008);
      gainNode.gain.exponentialRampToValueAtTime(0.001, t + 0.08);

      src.connect(filter);
      filter.connect(gainNode);
      gainNode.connect(context.destination);
      src.start(t);
    } catch (e) {}
  }

  public playWaterDropletSound() {
    this.playHeavyRainPatterSound();
  }

  public playSoftTrailTinkle() {
    this.playSoftPlantRustleSound();
    const context = this.ctx;
    if (!context || context.state === 'suspended') return;
    try {
      const t = context.currentTime;
      const osc = context.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1600 + Math.random() * 400, t);

      const gainNode = context.createGain();
      gainNode.gain.setValueAtTime(0, t);
      gainNode.gain.linearRampToValueAtTime(0.014, t + 0.006);
      gainNode.gain.exponentialRampToValueAtTime(0.001, t + 0.1);

      osc.connect(gainNode);
      gainNode.connect(context.destination);
      osc.start(t);
      osc.stop(t + 0.12);
    } catch (e) {}
  }

  public playHeavyRainPatterSound() {
    const context = this.ctx;
    if (!context || context.state === 'suspended') return;
    try {
      const t = context.currentTime;
      const src = context.createBufferSource();
      src.buffer = this.getNoiseBuffer();
      
      const filter = context.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1500 + Math.random() * 1000, t);
      filter.Q.setValueAtTime(2.0, t);

      const gainNode = context.createGain();
      gainNode.gain.setValueAtTime(0, t);
      gainNode.gain.linearRampToValueAtTime(0.038, t + 0.004);
      gainNode.gain.exponentialRampToValueAtTime(0.001, t + 0.11);

      src.connect(filter);
      filter.connect(gainNode);
      gainNode.connect(context.destination);
      src.start(t);
    } catch (e) {}
  }

  public playSoftPlopSound() {
    this.playHeavyRainPatterSound();
  }

  public playSoftSporePopSound() {
    const context = this.ctx;
    if (!context || context.state === 'suspended') return;
    try {
      const t = context.currentTime;
      const osc = context.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1050, t);
      osc.frequency.exponentialRampToValueAtTime(320, t + 0.05);

      const gainNode = context.createGain();
      gainNode.gain.setValueAtTime(0, t);
      gainNode.gain.linearRampToValueAtTime(0.018, t + 0.005);
      gainNode.gain.exponentialRampToValueAtTime(0.001, t + 0.06);

      osc.connect(gainNode);
      gainNode.connect(context.destination);
      osc.start(t);
      osc.stop(t + 0.07);
    } catch (e) {}
  }

  public playPinchPlingSound() {
    const context = this.ctx;
    if (!context || context.state === 'suspended') return;
    try {
      const t = context.currentTime;
      const osc = context.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1250, t);
      osc.frequency.exponentialRampToValueAtTime(1850, t + 0.06);

      const gainNode = context.createGain();
      gainNode.gain.setValueAtTime(0, t);
      gainNode.gain.linearRampToValueAtTime(0.022, t + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.001, t + 0.14);

      osc.connect(gainNode);
      gainNode.connect(context.destination);
      osc.start(t);
      osc.stop(t + 0.16);
    } catch (e) {}
  }

  public playSoftDropletWetSound() {
    const context = this.ctx;
    if (!context || context.state === 'suspended') return;
    try {
      const t = context.currentTime;
      const src = context.createBufferSource();
      src.buffer = this.getNoiseBuffer();
      const filter = context.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(750, t);

      const gainNode = context.createGain();
      gainNode.gain.setValueAtTime(0.024, t);
      gainNode.gain.exponentialRampToValueAtTime(0.001, t + 0.14);

      src.connect(filter);
      filter.connect(gainNode);
      gainNode.connect(context.destination);
      src.start(t);
    } catch (e) {}
  }

  public playShutterClick() {
    this.playCameraShutterClick();
  }

  public playCameraShutterClick() {
    const context = this.ctx;
    if (!context || context.state === 'suspended') return;
    try {
      const t = context.currentTime;
      // 1. Shutter noise burst
      const noise = context.createBufferSource();
      noise.buffer = this.getNoiseBuffer();
      
      const filter = context.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(4000, t);
      filter.Q.setValueAtTime(3.0, t);

      const noiseGain = context.createGain();
      noiseGain.gain.setValueAtTime(0, t);
      noiseGain.gain.linearRampToValueAtTime(0.04, t + 0.005);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 0.07);

      noise.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(context.destination);
      noise.start(t);

      // 2. Click slap tone
      const osc = context.createOscillator();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(2500, t);
      osc.frequency.setValueAtTime(150, t + 0.02); // rapid pitch dive

      const oscGain = context.createGain();
      oscGain.gain.setValueAtTime(0, t);
      oscGain.gain.linearRampToValueAtTime(0.028, t + 0.002);
      oscGain.gain.exponentialRampToValueAtTime(0.001, t + 0.03);

      osc.connect(oscGain);
      oscGain.connect(context.destination);
      
      osc.start(t);
      osc.stop(t + 0.08);
    } catch (e) {}
  }

  public startMushroomGrowHum() {
    const context = this.ctx;
    if (!context || context.state === 'suspended') return;
    try {
      const t = context.currentTime;
      const osc = context.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(120, t);

      const gainNode = context.createGain();
      gainNode.gain.setValueAtTime(0, t);
      gainNode.gain.linearRampToValueAtTime(0.03, t + 0.5);

      osc.connect(gainNode);
      gainNode.connect(context.destination);
      osc.start(t);

      this.activeMushroomOsc = osc;
      this.activeMushroomGain = gainNode;
    } catch (e) {}
  }

  public stopMushroomGrowHum() {
    if (this.activeMushroomOsc && this.activeMushroomGain && this.ctx) {
      try {
        const t = this.ctx.currentTime;
        this.activeMushroomGain.gain.cancelScheduledValues(t);
        this.activeMushroomGain.gain.setValueAtTime(this.activeMushroomGain.gain.value, t);
        this.activeMushroomGain.gain.linearRampToValueAtTime(0, t + 0.3);
        const oscToStop = this.activeMushroomOsc;
        setTimeout(() => {
          try { oscToStop.stop(); } catch (e) {}
        }, 400);
      } catch (e) {}
      this.activeMushroomOsc = null;
      this.activeMushroomGain = null;
    }
  }

  public playMushroomAppearsChime() {
    const context = this.ctx;
    if (!context || context.state === 'suspended') return;
    try {
      const t = context.currentTime;
      const osc = context.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(2000, t);
      osc.detune.setValueAtTime(10, t);

      const gainNode = context.createGain();
      gainNode.gain.setValueAtTime(0.05, t);
      gainNode.gain.exponentialRampToValueAtTime(0.001, t + 0.1);

      osc.connect(gainNode);
      gainNode.connect(context.destination);
      osc.start(t);
      osc.stop(t + 0.15);
    } catch (e) {}
  }

  public playSmileWarmArpeggio() {
    const context = this.ctx;
    if (!context || context.state === 'suspended') return;
    try {
      const t = context.currentTime;
      const notes = [261.63, 329.63, 392.00, 523.25, 659.25]; // C4, E4, G4, C5, E5
      notes.forEach((freq, idx) => {
        const timeOffset = idx * 0.05;
        const osc = context.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, t + timeOffset);

        const gainNode = context.createGain();
        gainNode.gain.setValueAtTime(0, t + timeOffset);
        gainNode.gain.linearRampToValueAtTime(0.035, t + timeOffset + 0.02);
        gainNode.gain.exponentialRampToValueAtTime(0.001, t + timeOffset + 0.5);

        osc.connect(gainNode);
        gainNode.connect(context.destination);
        osc.start(t + timeOffset);
        osc.stop(t + timeOffset + 0.6);
      });
    } catch (e) {}
  }

  public playNodBreezeSound() {
    const context = this.ctx;
    if (!context || context.state === 'suspended') return;
    try {
      const t = context.currentTime;
      const src = context.createBufferSource();
      src.buffer = this.getNoiseBuffer();
      
      const filter = context.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(400, t);
      filter.frequency.exponentialRampToValueAtTime(1400, t + 0.3);
      filter.frequency.exponentialRampToValueAtTime(300, t + 1.0);
      filter.Q.setValueAtTime(1.5, t);

      const gainNode = context.createGain();
      gainNode.gain.setValueAtTime(0, t);
      gainNode.gain.linearRampToValueAtTime(0.06, t + 0.3);
      gainNode.gain.exponentialRampToValueAtTime(0.001, t + 1.2);

      src.connect(filter);
      filter.connect(gainNode);
      gainNode.connect(context.destination);
      src.start(t);
      src.stop(t + 1.3);
    } catch (e) {}
  }

  public playDandelionDispersionSound() {
    const context = this.ctx;
    if (!context || context.state === 'suspended') return;
    try {
      const t = context.currentTime;
      const notes = [523.25, 587.33, 659.25, 698.46, 783.99, 880.00, 987.77, 1046.50];
      notes.forEach((freq, idx) => {
        const timeOffset = idx * 0.03;
        const osc = context.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, t + timeOffset);

        const gainNode = context.createGain();
        gainNode.gain.setValueAtTime(0, t + timeOffset);
        gainNode.gain.linearRampToValueAtTime(0.024, t + timeOffset + 0.015);
        gainNode.gain.exponentialRampToValueAtTime(0.001, t + timeOffset + 0.7);

        osc.connect(gainNode);
        gainNode.connect(context.destination);
        osc.start(t + timeOffset);
        osc.stop(t + timeOffset + 0.85);
      });
    } catch (e) {}
  }

  public updateTimeBasedTriggers() {
    const now = Date.now();
    if (now - this.lastBirdCallTime > this.nextBirdCallDelay) {
      this.playBirdCall();
      this.lastBirdCallTime = now;
      this.nextBirdCallDelay = (this.config.timers.birdCallMin + Math.random() * this.config.timers.birdCallRange) * 1000;
    }
  }

  public playBirdCall() {
    const context = this.ctx;
    if (!context || context.state === 'suspended') return;
    try {
      const t = context.currentTime;
      const osc = context.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1800, t);
      osc.frequency.exponentialRampToValueAtTime(1200, t + 0.15);

      const gainNode = context.createGain();
      gainNode.gain.setValueAtTime(0, t);
      gainNode.gain.linearRampToValueAtTime(0.02, t + 0.02);
      gainNode.gain.exponentialRampToValueAtTime(0.001, t + 0.15);

      const delay = context.createDelay();
      delay.delayTime.value = 0.08;
      const feedback = context.createGain();
      feedback.gain.value = 0.2;

      osc.connect(gainNode);
      gainNode.connect(context.destination);
      
      gainNode.connect(delay);
      delay.connect(feedback);
      feedback.connect(delay);
      delay.connect(audioCtxDestinationFallback(context));

      osc.start(t);
      osc.stop(t + 0.3);
    } catch (e) {}
  }

  public tick() {
    this.updateTimeBasedTriggers();
  }

  public playFocusDropletChime() {
    this.playSoftTrailTinkle();
  }

  public playRainSound() {
    this.playHeavyRainPatterSound();
  }

  public triggerEyesClosedHum() {
    const context = this.ctx;
    if (!context || context.state === 'suspended') return;
    try {
      const t = context.currentTime;
      const osc = context.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(150, t);
      
      const gainNode = context.createGain();
      gainNode.gain.setValueAtTime(0, t);
      gainNode.gain.linearRampToValueAtTime(0.02, t + 0.1);
      gainNode.gain.exponentialRampToValueAtTime(0.001, t + 1.0);

      osc.connect(gainNode);
      gainNode.connect(context.destination);
      osc.start(t);
      osc.stop(t + 1.1);
    } catch (e) {}
  }

  public cleanUp() {
    this.stopMushroomGrowHum();
    if (this.bgAmbientNode) {
      try { this.bgAmbientNode.stop(); } catch(e){}
    }
    if (this.rainNoiseNode) {
      try { this.rainNoiseNode.stop(); } catch(e){}
    }
    if (this.wetLayerNode) {
      try { this.wetLayerNode.stop(); } catch(e){}
    }
    if (this.ctx) {
      this.ctx.close();
    }
  }
}

function audioCtxDestinationFallback(ctx: AudioContext): AudioNode {
  return ctx.destination;
}
