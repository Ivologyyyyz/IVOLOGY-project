/**
 * Quiet Garden - Wristband Simulator and Multiplier Calculation
 */
import { WristbandData } from './types';

export class WristbandSimulator {
  private data: WristbandData;

  constructor() {
    this.data = {
      heartRate: 72,
      steps: 1000,
      mode: 'simulate',
      bloomFactor: 1.0,
    };
    this.parseQueryParams();
  }

  private parseQueryParams() {
    const params = new URLSearchParams(window.location.search);
    const mode = params.get('handBandMode');
    const hr = parseInt(params.get('hr') || '', 10);
    const steps = parseInt(params.get('step') || '', 10);

    if (mode === 'real' && !isNaN(hr) && !isNaN(steps)) {
      this.data.mode = 'real';
      this.data.heartRate = hr;
      this.data.steps = steps;
    } else {
      this.data.mode = 'simulate';
      if (!isNaN(hr)) this.data.heartRate = hr;
      if (!isNaN(steps)) this.data.steps = steps;
    }
    console.log(`[Wristband Engine] Initialized in ${this.data.mode} mode. Heart Rate: ${this.data.heartRate}, Steps: ${this.data.steps}`);
  }

  public getBloomFactor(): number {
    const stepsFactor = 1.0 + (this.data.steps / 1000) * 0.1;
    return Math.min(3.0, stepsFactor);
  }

  public getHeartRate(): number {
    return this.data.heartRate;
  }

  public getSteps(): number {
    return this.data.steps;
  }

  public getStepCount(): number {
    return this.getSteps();
  }

  public getMode(): 'real' | 'simulate' {
    return this.data.mode;
  }

  /**
   * Slowly fluctuates simulated heart rate and occasional step increases
   */
  public update() {
    if (this.data.mode === 'simulate') {
      const hrBase = 72;
      const timePhase = Date.now() / 6000;
      this.data.heartRate = Math.round(hrBase + Math.sin(timePhase) * 6 + (Math.random() - 0.5) * 2);

      // Trigger standard step increments
      if (Math.random() < 0.005) {
        this.data.steps += Math.floor(Math.random() * 3) + 1;
      }
    }

    // Safeguard rational outputs (40 bpm to 220 bpm)
    this.data.heartRate = Math.max(40, Math.min(220, this.data.heartRate));
    this.data.steps = Math.max(0, this.data.steps);
    this.data.bloomFactor = this.getBloomFactor();

    this.updateHUD();
  }

  private updateHUD() {
    const uiSource = document.getElementById('wb-source');
    const uiHr = document.getElementById('wb-hr');
    const uiSteps = document.getElementById('wb-steps');
    const uiBloomFactor = document.getElementById('wb-bloom-factor');

    if (uiSource) {
      uiSource.innerText = this.data.mode.toUpperCase();
      if (this.data.mode === 'real') {
        uiSource.className = 'text-[9px] px-1 border border-green-400/40 text-green-400 rounded uppercase tracking-wider font-semibold';
      } else {
        uiSource.className = 'text-[9px] px-1 border border-amber-400/40 text-amber-300 rounded uppercase tracking-wider font-semibold';
      }
    }
    if (uiHr) uiHr.innerText = `${this.data.heartRate} bpm`;
    if (uiSteps) uiSteps.innerText = `${this.data.steps} steps`;

    if (uiBloomFactor) {
      const factor = this.data.bloomFactor;
      if (factor >= 3.0) {
        uiBloomFactor.innerHTML = `${factor.toFixed(2)}x <span class="text-rose-400 font-bold animate-pulse text-[9px] ml-1">(MAX LIMIT)</span>`;
      } else {
        uiBloomFactor.innerText = `${factor.toFixed(2)}x`;
      }
    }
  }
}
