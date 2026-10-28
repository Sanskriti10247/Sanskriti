import * as THREE from 'three';
import { palette } from './palette';

/**
 * Soft, warm lighting shared by every toy scene: a sky/ground fill so shadows
 * stay pink rather than grey, plus a key light from the upper right.
 */
export function addSoftLights(scene: THREE.Scene, intensity = 1): void {
  const hemisphere = new THREE.HemisphereLight('#ffffff', palette.blush, 1.35 * intensity);
  const key = new THREE.DirectionalLight('#fff6f2', 1.5 * intensity);
  key.position.set(3, 5, 4);
  const rim = new THREE.DirectionalLight(palette.pink, 0.55 * intensity);
  rim.position.set(-4, 2, -3);
  scene.add(hemisphere, key, rim);
}
