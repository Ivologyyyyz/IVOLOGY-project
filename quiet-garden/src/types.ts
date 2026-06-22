/**
 * Quiet Garden - Type Definitions and Configuration Interfaces
 */

export interface AppConfig {
  thresholds: {
    pinchTipDistance: number;
    pinchFingerDistance: number;
    tapIndexDistance: number;
    tapFingerCurled: number;
    tapThumbMargin: number;
    tapMinDownwardVelocity: number;
    palmStillnessMaxVariance: number;
    palmStillnessDurationMs: number;
    smileWidthRatio: number;
    grimaceEARThreshold: number;
    grimaceHeightRatio: number;
    rainVolCoefficient: number;
  };
  timers: {
    dandelionIdleDelaySec: number;
    handLostGraceMs: number;
    birdCallMin: number;
    birdCallRange: number;
    petalMin: number;
    petalRange: number;
  };
  caps: {
    mushrooms: number;
    mushroomSpores: number;
    butterflies: number;
    flowers: number;
    raindrops: number;
    fallingPetals: number;
    splashes: number;
    blowingSeeds: number;
    grimaceStars: number;
    droplets: number;
  };
  particles: {
    pollenDensity: number;
    lowPerformanceFailsafe: boolean;
    flowerScale: number;
    blowingSeedLifeDecay: number;
    shutterFlashDecay: number;
    petalFallSpeed: number;
    grimaceStarGravity: number;
  };
  gestures: {
    cooldowns: {
      butterflies: number;
      flowers: number;
      rain: number;
      droplet: number;
      mushroom: number;
      smile: number;
      grimace: number;
    };
  };
}

export type GestureState = 'IDLE' | 'FIST_CLOSED' | 'OPEN_PALM' | 'PINCHING' | 'INDEX_TAP' | 'STILL_PALM';

export interface Particle {
  update(shouldUpdatePhysics: boolean): void;
  draw(ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D): void;
  life: number;
}

export interface WristbandData {
  heartRate: number;
  steps: number;
  mode: 'real' | 'simulate';
  bloomFactor: number;
}

export interface Landmark {
  x: number;
  y: number;
  z?: number;
}

export interface PolaroidPhoto {
  id: string;
  dataUrl: string;
  timestamp: number;
}

