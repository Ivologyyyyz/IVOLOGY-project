/**
 * Quiet Garden - Gesture and Face Feature Engine
 */
import { AppConfig, Landmark, GestureState } from './types';

export class GestureEngine {
  private palmHistory: { x: number; y: number; time: number }[] = [];
  
  // Calibration states
  private calibrationState: 'idle' | 'calibrating' | 'completed' = 'idle';
  private calibrationStartTime: number | null = null;
  private calibrationSamples: number[] = [];
  private calibratedHandSize = 0.15; // default fallback index-to-wrist size
  
  // Facial tracking states
  private restingMouthWidth = 0;
  private restingMouthHeight = 0;
  private eyesClosedTimer = 0;
  private eyesClosedActive = false;
  private noseYHistory: number[] = [];
  private lastNodTime = 0;

  constructor(private config: AppConfig) {}

  public getCalibratedHandSize(): number {
    return this.calibratedHandSize;
  }

  public getCalibrationState(): 'idle' | 'calibrating' | 'completed' {
    return this.calibrationState;
  }

  public startHandCalibration() {
    this.calibrationState = 'calibrating';
    this.calibrationStartTime = Date.now();
    this.calibrationSamples = [];
    console.log('[Gesture Engine] Calibration started. Hold hand flat for 1s.');
    
    const uiCalib = document.getElementById('calibration-banner');
    if (uiCalib) {
      uiCalib.classList.remove('hidden');
      uiCalib.style.opacity = '1';
    }
  }

  private completeCalibration() {
    this.calibrationState = 'completed';
    if (this.calibrationSamples.length > 0) {
      const sum = this.calibrationSamples.reduce((a, b) => a + b, 0);
      this.calibratedHandSize = sum / this.calibrationSamples.length;
      console.log(`[Gesture Engine] Calibration completed. Hand size baseline set to: ${this.calibratedHandSize.toFixed(4)}`);
    } else {
      this.calibratedHandSize = 0.15;
    }
    
    // Hide UI
    const uiCalib = document.getElementById('calibration-banner');
    if (uiCalib) {
      uiCalib.style.opacity = '0';
      setTimeout(() => uiCalib.classList.add('hidden'), 500);
    }
  }

  /**
   * Distance between two 2D points
   */
  public distL(p1: Landmark, p2: Landmark): number {
    return Math.hypot(p1.x - p2.x, p1.y - p2.y);
  }

  /**
   * Process and verify palm stillness variance
   */
  public checkStillness(landmarks: Landmark[]): boolean {
    const wrist = landmarks[0];
    const knuckle9 = landmarks[9];
    if (!wrist || !knuckle9) return false;

    this.palmHistory.push({ x: knuckle9.x, y: knuckle9.y, time: Date.now() });
    
    // Cap hist to 30 frames
    if (this.palmHistory.length > 30) {
      this.palmHistory.shift();
    }

    // Determine stationary variance (wideness filter)
    if (this.palmHistory.length >= 20) {
      let minX = 1, maxX = 0, minY = 1, maxY = 0;
      for (const pos of this.palmHistory) {
        if (pos.x < minX) minX = pos.x;
        if (pos.x > maxX) maxX = pos.x;
        if (pos.y < minY) minY = pos.y;
        if (pos.y > maxY) maxY = pos.y;
      }
      const dx = maxX - minX;
      const dy = maxY - minY;
      return (dx < this.config.thresholds.palmStillnessMaxVariance && 
              dy < this.config.thresholds.palmStillnessMaxVariance);
    }
    return false;
  }

  public resetStillnessHistory() {
    this.palmHistory = [];
  }

  /**
   * Safe gesture checks using either calibrated or instant dynamic sizes
   */
  public checkFist(landmarks: Landmark[], hSize: number): boolean {
    const idxD = this.distL(landmarks[8], landmarks[0]) / hSize;
    const midD = this.distL(landmarks[12], landmarks[0]) / hSize;
    const ringD = this.distL(landmarks[16], landmarks[0]) / hSize;
    const pinkD = this.distL(landmarks[20], landmarks[0]) / hSize;
    return (idxD < 1.05 && midD < 1.05 && ringD < 1.05 && pinkD < 1.05);
  }

  public checkOpenHand(landmarks: Landmark[], hSize: number): boolean {
    const idxD = this.distL(landmarks[8], landmarks[0]) / hSize;
    const midD = this.distL(landmarks[12], landmarks[0]) / hSize;
    const ringD = this.distL(landmarks[16], landmarks[0]) / hSize;
    const pinkD = this.distL(landmarks[20], landmarks[0]) / hSize;
    return (idxD > 1.05 && midD > 1.05 && ringD > 1.05 && pinkD > 0.95);
  }

  public checkPinch(landmarks: Landmark[], hSize: number): boolean {
    const dTip = this.distL(landmarks[4], landmarks[8]) / hSize;
    const midD = this.distL(landmarks[12], landmarks[0]) / hSize;
    const ringD = this.distL(landmarks[16], landmarks[0]) / hSize;
    const pinkD = this.distL(landmarks[20], landmarks[0]) / hSize;

    return (dTip <= this.config.thresholds.pinchTipDistance && 
            midD < this.config.thresholds.pinchFingerDistance && 
            ringD < this.config.thresholds.pinchFingerDistance && 
            pinkD < this.config.thresholds.pinchFingerDistance);
  }

  public checkIndexExtended(landmarks: Landmark[], hSize: number): boolean {
    const idxD = this.distL(landmarks[8], landmarks[0]) / hSize;
    const midD = this.distL(landmarks[12], landmarks[0]) / hSize;
    const ringD = this.distL(landmarks[16], landmarks[0]) / hSize;
    const pinkD = this.distL(landmarks[20], landmarks[0]) / hSize;
    const dTip = this.distL(landmarks[4], landmarks[8]) / hSize;

    return (idxD >= this.config.thresholds.tapIndexDistance && 
            midD < this.config.thresholds.tapFingerCurled && 
            ringD < this.config.thresholds.tapFingerCurled && 
            pinkD < this.config.thresholds.tapFingerCurled &&
            dTip > this.config.thresholds.tapThumbMargin);
  }

  /**
   * Main metrics filter for a single Hand Landmark frame
   */
  public analyzeHandSignals(landmarks: Landmark[], isMobile: boolean): {
    fist: boolean;
    openPalm: boolean;
    pinch: boolean;
    indexTap: boolean;
    stillPalm: boolean;
    handSize: number;
  } {
    const wrist = landmarks[0];
    const knuckle9 = landmarks[9];
    
    // Dynamic hand size
    const rawSize = this.distL(wrist, knuckle9);

    // Support calibration gathering
    if (this.calibrationState === 'calibrating' && this.calibrationStartTime) {
      this.calibrationSamples.push(rawSize);
      if (Date.now() - this.calibrationStartTime > 1000) {
        this.completeCalibration();
      }
    }

    // Adapt tracking context size: use calibrated hand size if active, else raw size
    const finalHandSize = (this.calibrationState === 'completed' && this.calibratedHandSize > 0)
      ? this.calibratedHandSize
      : rawSize;

    // Mobile gesture parameters tweak: increases confidence slightly
    const adjustedHandSize = finalHandSize * (isMobile ? 0.95 : 1.0);

    const isFist = this.checkFist(landmarks, adjustedHandSize);
    const isOpen = this.checkOpenHand(landmarks, adjustedHandSize);
    const isPinch = this.checkPinch(landmarks, adjustedHandSize);
    const isIndex = this.checkIndexExtended(landmarks, adjustedHandSize);
    const isStill = this.checkStillness(landmarks);

    return {
      fist: isFist,
      openPalm: isOpen,
      pinch: isPinch,
      indexTap: isIndex,
      stillPalm: isStill,
      handSize: adjustedHandSize,
    };
  }

  /**
   * Main metrics filter for a single FaceMesh Landmark frame
   */
  public analyzeFacialSignals(landmarks: Landmark[]): {
    smile: boolean;
    grimace: boolean;
    eyesClosed: boolean;
    frowning: boolean;
    ear: number;
    noseTip: Landmark | null;
    nod: boolean;
  } {
    const nose = landmarks[1];
    const p61 = landmarks[61];    // Right corner
    const p291 = landmarks[291];  // Left corner
    const p13 = landmarks[13];    // Top lip center
    const p14 = landmarks[14];    // Bottom lip center

    if (!p61 || !p291 || !p13 || !p14) {
      return { smile: false, grimace: false, eyesClosed: false, frowning: false, ear: 0.3, noseTip: null, nod: false };
    }

    const mWidth = this.distL(p61, p291);
    const mHeight = this.distL(p13, p14);

    if (this.restingMouthWidth === 0) {
      this.restingMouthWidth = mWidth;
      this.restingMouthHeight = mHeight;
    } else {
      this.restingMouthWidth = this.restingMouthWidth * 0.995 + mWidth * 0.005;
      this.restingMouthHeight = this.restingMouthHeight * 0.995 + mHeight * 0.005;
    }

    // Lips pulled downwards ( corners lower than mouth center verticality )
    const mouthCornersY = (p61.y + p291.y) / 2;
    const mouthCenterY = (p13.y + p14.y) / 2;
    const isFrowning = mouthCornersY > mouthCenterY + 0.002;

    // Check eyes closure ratio (EAR)
    const earnNumeratorLeft = this.distL(landmarks[159], landmarks[145]) + this.distL(landmarks[158], landmarks[153]);
    const earnDenominatorLeft = 2 * this.distL(landmarks[33], landmarks[133]);
    const earLeft = earnNumeratorLeft / earnDenominatorLeft;

    const earnNumeratorRight = this.distL(landmarks[386], landmarks[374]) + this.distL(landmarks[385], landmarks[380]);
    const earnDenominatorRight = 2 * this.distL(landmarks[263], landmarks[362]);
    const earRight = earnNumeratorRight / earnDenominatorRight;

    const avgEAR = (earLeft + earRight) / 2;

    // Grimace classification: Squinted eyes + frowned mouth + small lips height
    const grimaceChecked = (avgEAR < this.config.thresholds.grimaceEARThreshold) &&
                           (mHeight < this.restingMouthHeight * this.config.thresholds.grimaceHeightRatio) &&
                           isFrowning;

    // Smile classification: Width pulled out and not frowning
    const smileChecked = (mWidth > this.restingMouthWidth * this.config.thresholds.smileWidthRatio) && !isFrowning;

    // Eyes closed meditation filter
    let eyesClosed = false;
    if (avgEAR < 0.20 && !grimaceChecked) {
      if (this.eyesClosedTimer === 0) {
        this.eyesClosedTimer = Date.now();
      } else if (Date.now() - this.eyesClosedTimer > 2000) {
        this.eyesClosedActive = true;
        eyesClosed = true;
      }
    } else {
      this.eyesClosedTimer = 0;
      this.eyesClosedActive = false;
    }

    // Nod (点头) detection: vertical displacement check of nose
    let nodChecked = false;
    if (nose) {
      this.noseYHistory.push(nose.y);
      if (this.noseYHistory.length > 20) {
        this.noseYHistory.shift();
      }
      if (this.noseYHistory.length >= 10) {
        const peakY = Math.max(...this.noseYHistory);
        const valleyY = Math.min(...this.noseYHistory);
        const diff = peakY - valleyY;
        const newestY = this.noseYHistory[this.noseYHistory.length - 1];
        if (diff > 0.05 && newestY < peakY - 0.01) {
          const now = Date.now();
          if (now - this.lastNodTime > 2200) {
            this.lastNodTime = now;
            nodChecked = true;
          }
        }
      }
    }

    return {
      smile: smileChecked,
      grimace: grimaceChecked,
      eyesClosed: eyesClosed || this.eyesClosedActive,
      frowning: isFrowning,
      ear: avgEAR,
      noseTip: nose || null,
      nod: nodChecked,
    };
  }
}
