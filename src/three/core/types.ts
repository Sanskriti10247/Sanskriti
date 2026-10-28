import type * as THREE from 'three';

/** Per-frame values handed to every scene controller. */
export interface FrameState {
  /** Seconds elapsed since the stage started. */
  time: number;
  /** Seconds since the previous frame, clamped to avoid jumps after tab switches. */
  delta: number;
  /** Smoothed pointer position, -1..1 on both axes, +y up. */
  pointer: THREE.Vector2;
  /** Page scroll progress, 0 at the top and 1 at the bottom. */
  scroll: number;
}

/** A pointer event translated into scene terms. */
export interface ScenePointer {
  type: 'down' | 'move' | 'up';
  /** Pointer position in normalised device coordinates (-1..1, +y up). */
  ndc: THREE.Vector2;
  /** Raycaster already aimed from the camera through the pointer. */
  raycaster: THREE.Raycaster;
  /** True while a mouse button or finger is held down. */
  pressed: boolean;
  /** 'mouse', 'pen' or 'touch'. */
  pointerType: string;
}

/** Objects a scene factory receives to build its world. */
export interface SceneSetup {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  /** True on small screens: scenes should use fewer objects. */
  compact: boolean;
  /** Publish a short, human-readable game status (score, result). */
  report(status: string): void;
  /** Change the CSS cursor over the canvas, e.g. 'pointer' when hovering a toy. */
  setCursor(cursor: string): void;
}

/** What a scene factory returns: an update loop plus optional hooks. */
export interface SceneController {
  update(frame: FrameState): void;
  resize?(width: number, height: number): void;
  /** Called for pointer activity on the canvas. */
  onPointer?(pointer: ScenePointer): void;
  /** Put the game back to its starting state. */
  reset?(): void;
  /** Free resources not attached to the scene graph. Scene graph objects are disposed automatically. */
  dispose?(): void;
}

export type SceneFactory = (setup: SceneSetup) => SceneController;

export type PointerSpace = 'element' | 'viewport';

export interface StageOptions {
  /** Measure the smoothed pointer relative to the canvas or to the whole viewport. */
  pointerSpace?: PointerSpace;
  /** Render a single still frame and ignore input instead of animating. */
  reducedMotion?: boolean;
  /** Upper bound on device pixel ratio for performance. */
  maxPixelRatio?: number;
  /** Light glossy materials with a soft studio environment. */
  environment?: boolean;
  /** Receives status text published by the scene. */
  onStatus?: (status: string) => void;
}

export interface Stage {
  /** Resume or pause the render loop, e.g. when the canvas scrolls out of view. */
  setActive(active: boolean): void;
  /** Ask the scene to restart its game. */
  reset(): void;
  dispose(): void;
}
