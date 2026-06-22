/**
 * Quiet Garden - Finite State Machine for Gesture Transitions
 */
import { GestureState } from './types';

export interface StateMachineListener {
  onTransition(fromState: GestureState, toState: GestureState): void;
  onGestureAction(gestureName: string, x?: number, y?: number): void;
}

export class GestureStateMachine {
  private currentState: GestureState = 'IDLE';
  private previousState: GestureState = 'IDLE';
  private stateTimers: Record<GestureState, number> = {
    IDLE: 0,
    FIST_CLOSED: 0,
    OPEN_PALM: 0,
    PINCHING: 0,
    INDEX_TAP: 0,
    STILL_PALM: 0,
  };
  private cooldowns: Record<string, number> = {};
  private listeners: StateMachineListener[] = [];
  
  // Transition stability thresholds: require a state to be consistently detected 
  // for at least N consecutive updates before officially transitioning.
  private stabilityFrames: Record<GestureState, number> = {
    IDLE: 1,
    FIST_CLOSED: 3,
    OPEN_PALM: 4,
    PINCHING: 3,
    INDEX_TAP: 2,
    STILL_PALM: 6, // Stillness requires a bit of stability
  };
  
  private currentDetectionCounter: Record<GestureState, number> = {
    IDLE: 0,
    FIST_CLOSED: 0,
    OPEN_PALM: 0,
    PINCHING: 0,
    INDEX_TAP: 0,
    STILL_PALM: 0,
  };

  constructor() {
    this.reset();
  }

  public registerListener(listener: StateMachineListener) {
    this.listeners.push(listener);
  }

  public reset() {
    this.currentState = 'IDLE';
    this.previousState = 'IDLE';
    Object.keys(this.currentDetectionCounter).forEach((key) => {
      this.currentDetectionCounter[key as GestureState] = 0;
    });
    this.cooldowns = {};
  }

  public getCurrentState(): GestureState {
    return this.currentState;
  }

  public getPreviousState(): GestureState {
    return this.previousState;
  }

  /**
   * Keep track of simple time-based cooldowns
   */
  public setCooldown(name: string, durationMs: number) {
    this.cooldowns[name] = Date.now() + durationMs;
  }

  public isCoolingDown(name: string): boolean {
    const expires = this.cooldowns[name];
    if (!expires) return false;
    return Date.now() < expires;
  }

  /**
   * Process raw gesture detections on every frame and decide transitions
   */
  public update(rawDetections: {
    fist: boolean;
    openPalm: boolean;
    pinch: boolean;
    indexTap: boolean;
    stillPalm: boolean;
  }, x: number | null, y: number | null) {
    // 1. Identify which state is actively being detected
    let activeRaw: GestureState = 'IDLE';
    if (rawDetections.fist) activeRaw = 'FIST_CLOSED';
    else if (rawDetections.pinch) activeRaw = 'PINCHING';
    else if (rawDetections.indexTap) activeRaw = 'INDEX_TAP';
    else if (rawDetections.stillPalm) activeRaw = 'STILL_PALM';
    else if (rawDetections.openPalm) activeRaw = 'OPEN_PALM';

    // 2. Increment counters, decrement rest
    Object.keys(this.currentDetectionCounter).forEach((s) => {
      const state = s as GestureState;
      if (state === activeRaw) {
        this.currentDetectionCounter[state]++;
      } else {
        this.currentDetectionCounter[state] = Math.max(0, this.currentDetectionCounter[state] - 1);
      }
    });

    // 3. Determine if we should transition
    if (activeRaw !== this.currentState) {
      const requiredFrames = this.stabilityFrames[activeRaw];
      if (this.currentDetectionCounter[activeRaw] >= requiredFrames) {
        // Double-check custom guards to prevent transitions under cooldowns
        if (activeRaw === 'INDEX_TAP' && this.isCoolingDown('rain')) return;
        if (activeRaw === 'FIST_CLOSED' && this.isCoolingDown('butterflies')) return;
        if (activeRaw === 'STILL_PALM' && this.isCoolingDown('mushroom')) return;
        if (activeRaw === 'OPEN_PALM' && this.isCoolingDown('flowers')) return;
        if (activeRaw === 'PINCHING' && this.isCoolingDown('droplet')) return;

        this.transitionTo(activeRaw, x ?? undefined, y ?? undefined);
      }
    }
  }

  /**
   * Execute state transitions
   */
  private transitionTo(nextState: GestureState, x?: number, y?: number) {
    if (nextState === this.currentState) return;
    
    const from = this.currentState;
    this.previousState = from;
    this.currentState = nextState;

    // Trigger action callbacks for state entries
    this.listeners.forEach((listener) => {
      listener.onTransition(from, nextState);
    });

    this.handleStateActions(from, nextState, x, y);
  }

  /**
   * State Actions based on specific transitions
   */
  private handleStateActions(from: GestureState, to: GestureState, x?: number, y?: number) {
    if (from === 'FIST_CLOSED' && to === 'OPEN_PALM') {
      // Release of fist generates butterflies
      this.listeners.forEach((l) => l.onGestureAction('release_butterflies', x, y));
    } else if (to === 'OPEN_PALM') {
      this.listeners.forEach((l) => l.onGestureAction('open_palm_sweep', x, y));
    } else if (to === 'INDEX_TAP') {
      this.listeners.forEach((l) => l.onGestureAction('rain_tap', x, y));
    } else if (to === 'PINCHING') {
      this.listeners.forEach((l) => l.onGestureAction('focus_droplet', x, y));
    } else if (to === 'STILL_PALM') {
      this.listeners.forEach((l) => l.onGestureAction('grow_mushroom', x, y));
    }
  }
}
