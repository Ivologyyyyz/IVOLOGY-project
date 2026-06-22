/**
 * Quiet Garden - Guided Onboarding with Transparent Pulsing Ghost Hand
 */
import { Landmark } from './types';

export class TutorialGuide {
  private active = false;
  private currentStep = 0;
  private stepTimer = Date.now();
  private totalStepsCount = 5;

  constructor() {
    this.checkFirstLoad();
  }

  private checkFirstLoad() {
    try {
      const shown = localStorage.getItem('tutorialShown');
      if (shown !== 'true') {
        this.start();
      }
    } catch (e) {
      this.start();
    }
  }

  public isActive(): boolean {
    return this.active;
  }

  public getStep(): number {
    return this.currentStep;
  }

  public start() {
    this.active = true;
    this.currentStep = 0;
    this.stepTimer = Date.now();
    const overlay = document.getElementById('tutorial-overlay');
    if (overlay) {
      overlay.classList.remove('hidden');
      overlay.style.opacity = '1';
    }
  }

  public skip() {
    this.active = false;
    const overlay = document.getElementById('tutorial-overlay');
    if (overlay) {
      overlay.style.opacity = '0';
      setTimeout(() => {
        overlay.classList.add('hidden');
      }, 1000);
    }
    try {
      localStorage.setItem('tutorialShown', 'true');
    } catch (e) {}
  }

  public setStep(step: number) {
    if (step >= 0 && step < this.totalStepsCount) {
      this.currentStep = step;
      this.stepTimer = Date.now();
    }
  }

  private setMockFinger(arr: Landmark[], tipIdx: number, tx: number, ty: number) {
    arr[tipIdx] = { x: tx, y: ty };
    // Interpolate joints slightly for realism
    const baseIdx = tipIdx - 3;
    arr[baseIdx + 1] = { x: arr[baseIdx].x + (tx - arr[baseIdx].x) * 0.35, y: arr[baseIdx].y + (ty - arr[baseIdx].y) * 0.35 };
    arr[baseIdx + 2] = { x: arr[baseIdx].x + (tx - arr[baseIdx].x) * 0.7, y: arr[baseIdx].y + (ty - arr[baseIdx].y) * 0.7 };
  }

  /**
   * Refined Ghost Hand Overlay and skeleton joint drawing loop
   */
  public updateAndDraw(
    ctx: CanvasRenderingContext2D,
    canvasWidth: number,
    canvasHeight: number,
    spawnButterfly: () => void,
    spawnFlower: (x: number, y: number) => void,
    spawnRain: (x: number, y: number) => void,
    spawnDroplet: (x: number, y: number) => void,
    growMushroom: (x: number, y: number) => void
  ) {
    if (!this.active) return;

    const timeInStep = Date.now() - this.stepTimer;
    if (timeInStep > 4000) {
      this.currentStep++;
      this.stepTimer = Date.now();
      if (this.currentStep >= this.totalStepsCount) {
        this.skip();
        return;
      }
    }

    const helperBox = document.getElementById('tutorial-helper');
    const mockLandmarks: Landmark[] = [];
    
    // Set default base wrist (around middle-bottom)
    const wristX = 0.5;
    const wristY = 0.74;

    for (let idx = 0; idx < 21; idx++) {
      mockLandmarks.push({ x: wristX, y: wristY });
    }

    // Set knuckles baselines
    mockLandmarks[1] = { x: wristX - 0.04, y: wristY - 0.08 };
    mockLandmarks[2] = { x: wristX - 0.07, y: wristY - 0.12 };
    mockLandmarks[3] = { x: wristX - 0.09, y: wristY - 0.15 };
    mockLandmarks[4] = { x: wristX - 0.11, y: wristY - 0.17 }; // thumb tip

    mockLandmarks[5] = { x: wristX - 0.05, y: wristY - 0.14 };
    mockLandmarks[9] = { x: wristX - 0.01, y: wristY - 0.15 };
    mockLandmarks[13] = { x: wristX + 0.03, y: wristY - 0.14 };
    mockLandmarks[17] = { x: wristX + 0.07, y: wristY - 0.12 };

    const pulseMultiplier = 1.0 + Math.sin(Date.now() * 0.0055) * 0.07;
    const pulseOpacity = 0.15 + Math.sin(Date.now() * 0.0055) * 0.05;

    switch (this.currentStep) {
      case 0: // Fist -> Release
        if (helperBox) {
          helperBox.innerText = '1. FIST & RELEASE: Clench your hand strongly, then open it completely to release butterflies.';
        }
        
        const isClenched = (timeInStep % 1800) < 900;
        if (isClenched) {
          this.setMockFinger(mockLandmarks, 8, wristX - 0.04, wristY - 0.16);
          this.setMockFinger(mockLandmarks, 12, wristX - 0.01, wristY - 0.17);
          this.setMockFinger(mockLandmarks, 16, wristX + 0.03, wristY - 0.16);
          this.setMockFinger(mockLandmarks, 20, wristX + 0.06, wristY - 0.14);
        } else {
          this.setMockFinger(mockLandmarks, 8, wristX - 0.08, wristY - 0.35);
          this.setMockFinger(mockLandmarks, 12, wristX - 0.02, wristY - 0.38);
          this.setMockFinger(mockLandmarks, 16, wristX + 0.04, wristY - 0.37);
          this.setMockFinger(mockLandmarks, 20, wristX + 0.09, wristY - 0.33);
          
          if (Math.random() < 0.12) {
            spawnButterfly();
          }
        }
        break;

      case 1: // Open Palm Sweep
        if (helperBox) {
          helperBox.innerText = '2. OPEN PALM SWEEP: Open your palm flat, and glide horizontal paths across the soil to paint flowers.';
        }
        
        const swingX = wristX + Math.sin(Date.now() * 0.0035) * 0.15;
        mockLandmarks[0] = { x: swingX, y: wristY };
        mockLandmarks[1] = { x: swingX - 0.04, y: wristY - 0.08 };
        mockLandmarks[2] = { x: swingX - 0.07, y: wristY - 0.12 };
        mockLandmarks[3] = { x: swingX - 0.09, y: wristY - 0.14 };
        mockLandmarks[4] = { x: swingX - 0.10, y: wristY - 0.16 };

        mockLandmarks[5] = { x: swingX - 0.05, y: wristY - 0.14 };
        mockLandmarks[9] = { x: swingX - 0.01, y: wristY - 0.15 };
        mockLandmarks[13] = { x: swingX + 0.03, y: wristY - 0.14 };
        mockLandmarks[17] = { x: swingX + 0.07, y: wristY - 0.12 };

        this.setMockFinger(mockLandmarks, 8, swingX - 0.08, wristY - 0.34);
        this.setMockFinger(mockLandmarks, 12, swingX - 0.02, wristY - 0.37);
        this.setMockFinger(mockLandmarks, 16, swingX + 0.04, wristY - 0.36);
        this.setMockFinger(mockLandmarks, 20, swingX + 0.09, wristY - 0.32);

        if (Math.random() < 0.1) {
          spawnFlower(swingX, 0.52);
        }
        break;

      case 2: // Index Tap
        if (helperBox) {
          helperBox.innerText = '3. INDEX TAP: Close other fingers and move your index down quickly to sprinkle soothing raindrops.';
        }
        
        const tapOffset = 0.52 + Math.abs(Math.sin(Date.now() * 0.0055)) * 0.12;
        this.setMockFinger(mockLandmarks, 8, wristX - 0.04, tapOffset); // moving index
        this.setMockFinger(mockLandmarks, 12, wristX - 0.01, wristY - 0.17);
        this.setMockFinger(mockLandmarks, 16, wristX + 0.03, wristY - 0.16);
        this.setMockFinger(mockLandmarks, 20, wristX + 0.06, wristY - 0.14);

        if (tapOffset > 0.6 && Math.random() < 0.14) {
          spawnRain(wristX - 0.04, 0.6);
        }
        break;

      case 3: // Pinch Droplet
        if (helperBox) {
          helperBox.innerText = '4. PINCH: Bring your thumb and index tips together to generate hanging droplets of concentration.';
        }
        
        const isPinched = (timeInStep % 1200) > 600;
        if (isPinched) {
          const pinchX = wristX - 0.03;
          const pinchY = wristY - 0.22;
          mockLandmarks[4] = { x: pinchX, y: pinchY }; // Thumb tip touch
          mockLandmarks[8] = { x: pinchX, y: pinchY }; // Index tip touch
        } else {
          mockLandmarks[4] = { x: wristX - 0.06, y: wristY - 0.23 }; // Thumb tip apart
          mockLandmarks[8] = { x: wristX - 0.01, y: wristY - 0.25 }; // Index tip apart
        }
        // Others apart
        this.setMockFinger(mockLandmarks, 12, wristX + 0.02, wristY - 0.32);
        this.setMockFinger(mockLandmarks, 16, wristX + 0.07, wristY - 0.31);
        this.setMockFinger(mockLandmarks, 20, wristX + 0.11, wristY - 0.28);

        if (isPinched && Math.random() < 0.05) {
          spawnDroplet(wristX - 0.03, 0.54);
        }
        break;

      case 4: // Hold Still
        if (helperBox) {
          helperBox.innerText = '5. HOLD STILL: Rest your flat hand in one place for 1.5s to sprout cozy forest mushrooms.';
        }
        
        this.setMockFinger(mockLandmarks, 8, wristX - 0.08, wristY - 0.34);
        this.setMockFinger(mockLandmarks, 12, wristX - 0.02, wristY - 0.37);
        this.setMockFinger(mockLandmarks, 16, wristX + 0.04, wristY - 0.36);
        this.setMockFinger(mockLandmarks, 20, wristX + 0.09, wristY - 0.32);

        growMushroom(0.5, 0.72);
        break;
    }

    ctx.save();
    
    // DRAW SEMI-TRANSPARENT pulsing skin hull
    ctx.strokeStyle = `rgba(239, 212, 118, ${pulseOpacity + 0.1})`;
    ctx.fillStyle = `rgba(239, 212, 118, ${pulseOpacity})`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    // draw palm perimeter outline
    ctx.moveTo(mockLandmarks[0].x * canvasWidth, mockLandmarks[0].y * canvasHeight);
    
    // Trace thumb boundary
    for (let i = 1; i <= 4; i++) {
      ctx.lineTo(mockLandmarks[i].x * canvasWidth, mockLandmarks[i].y * canvasHeight);
    }
    // Trace fingers
    const fingerTips = [8, 12, 16, 20];
    for (const tip of fingerTips) {
      ctx.lineTo(mockLandmarks[tip - 2].x * canvasWidth, mockLandmarks[tip - 2].y * canvasHeight);
      ctx.lineTo(mockLandmarks[tip - 1].x * canvasWidth, mockLandmarks[tip - 1].y * canvasHeight);
      ctx.lineTo(mockLandmarks[tip].x * canvasWidth, mockLandmarks[tip].y * canvasHeight);
    }
    // Pinky knucle base to wrist
    ctx.lineTo(mockLandmarks[17].x * canvasWidth, mockLandmarks[17].y * canvasHeight);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Draw glowing skeleton lines
    ctx.strokeStyle = 'rgba(255, 215, 0, 0.7)';
    ctx.fillStyle = 'rgba(255, 235, 140, 0.9)';
    ctx.lineWidth = 4;
    ctx.shadowBlur = 10;
    ctx.shadowColor = 'rgba(255, 215, 0, 0.8)';

    const bones = [
      [0, 1], [1, 2], [2, 3], [3, 4],
      [0, 5], [5, 6], [6, 7], [7, 8],
      [0, 9], [9, 10], [10, 11], [11, 12],
      [0, 13], [13, 14], [14, 15], [15, 16],
      [0, 17], [17, 18], [18, 19], [19, 20]
    ];

    for (const [b1, b2] of bones) {
      const p1 = mockLandmarks[b1];
      const p2 = mockLandmarks[b2];
      ctx.beginPath();
      ctx.moveTo(p1.x * canvasWidth, p1.y * canvasHeight);
      ctx.lineTo(p2.x * canvasWidth, p2.y * canvasHeight);
      ctx.stroke();
    }

    // Joint circular caps
    for (const pt of mockLandmarks) {
      ctx.beginPath();
      ctx.arc(pt.x * canvasWidth, pt.y * canvasHeight, 5.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }

    // Subtle pulsing ripple cue at the active focal point
    if (this.currentStep === 2) {
      // raindrops ripple cue
      const activeIdx = 8;
      const ax = mockLandmarks[activeIdx].x * canvasWidth;
      const ay = mockLandmarks[activeIdx].y * canvasHeight;
      ctx.strokeStyle = `rgba(135, 206, 250, ${0.8 - pulseOpacity})`;
      ctx.beginPath();
      ctx.arc(ax, ay, 20 * pulseMultiplier, 0, Math.PI * 2);
      ctx.stroke();
    } else if (this.currentStep === 3) {
      // pinch droplet ripple cue
      const activeIdx = 8;
      const ax = mockLandmarks[activeIdx].x * canvasWidth;
      const ay = mockLandmarks[activeIdx].y * canvasHeight;
      ctx.strokeStyle = `rgba(165, 225, 200, ${0.8 - pulseOpacity})`;
      ctx.beginPath();
      ctx.arc(ax, ay, 15 * pulseMultiplier, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.restore();
  }
}
