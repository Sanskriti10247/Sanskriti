import type * as THREE from 'three';

export type GamePhase = 'intro' | 'countdown' | 'playing' | 'over';

/** Everything the on-screen HUD needs to draw itself. */
export interface HudState {
  phase: GamePhase;
  score: number;
  best: number;
  /** Seconds left in the round. */
  timeLeft: number;
  /** Seconds left before the round starts, during the countdown. */
  countdown: number;
  boosting: boolean;
  /** True once a round ends with a new best score. */
  newBest: boolean;
}

export type TouchControl = 'left' | 'right' | 'gas' | 'brake' | 'drift';

/** Public handle the React overlay uses to drive the game. */
export interface DriveGame {
  /** Leave the intro and start the countdown. */
  start(): void;
  /** Reset the island and start a fresh round. */
  restart(): void;
  /** Hold or release an on-screen touch control. */
  setTouch(control: TouchControl, pressed: boolean): void;
  dispose(): void;
}

/** A solid round obstacle on the ground plane. */
export interface Collider {
  x: number;
  z: number;
  radius: number;
}

/** What the player is asking the car to do this frame. */
export interface DriveIntent {
  /** -1 (brake / reverse) to 1 (full throttle). */
  throttle: number;
  /** -1 (right) to 1 (left). */
  steer: number;
  drift: boolean;
}

export interface TrackSample {
  point: THREE.Vector3;
  tangent: THREE.Vector3;
  /** Unit vector pointing to the left of the direction of travel. */
  side: THREE.Vector3;
}
