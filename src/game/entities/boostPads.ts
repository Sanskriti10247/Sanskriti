import * as THREE from 'three';
import { canvasTexture, palette } from '@/three/core';
import type { Track } from '../world/track';

export interface BoostPads {
  group: THREE.Group;
  /** True when the car rolls onto a pad that is ready. */
  update(delta: number, car: THREE.Vector3): boolean;
}

const TRIGGER_RADIUS = 2.7;

/** Mint pads on the road with scrolling chevrons; driving over one gives a short boost. */
export function createBoostPads(track: Track): BoostPads {
  const group = new THREE.Group();
  const texture = canvasTexture(128, 128, (context, w, h) => {
    context.fillStyle = palette.mint;
    context.fillRect(0, 0, w, h);
    context.strokeStyle = '#ffffff';
    context.lineWidth = 16;
    context.lineCap = 'round';
    context.lineJoin = 'round';
    context.beginPath();
    context.moveTo(28, 92);
    context.lineTo(64, 48);
    context.lineTo(100, 92);
    context.stroke();
  });
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(1, 2.5);
  const material = new THREE.MeshStandardMaterial({ map: texture, roughness: 0.6 });
  const geometry = new THREE.PlaneGeometry(3.4, 5.2);
  const pads: Array<{ position: THREE.Vector3; cooldown: number }> = [];

  for (const u of [0.22, 0.47, 0.72]) {
    const { point, tangent } = track.sample(u);
    const pad = new THREE.Group();
    const mesh = new THREE.Mesh(geometry, material);
    mesh.rotation.x = -Math.PI / 2;
    mesh.receiveShadow = true;
    pad.add(mesh);
    pad.position.set(point.x, 0.05, point.z);
    pad.rotation.y = Math.atan2(-tangent.x, -tangent.z);
    group.add(pad);
    pads.push({ position: point.clone(), cooldown: 0 });
  }

  return {
    group,
    update(delta, car) {
      texture.offset.y -= delta * 1.6;
      let triggered = false;
      for (const pad of pads) {
        pad.cooldown = Math.max(0, pad.cooldown - delta);
        if (pad.cooldown > 0) continue;
        if (Math.hypot(pad.position.x - car.x, pad.position.z - car.z) < TRIGGER_RADIUS) {
          pad.cooldown = 1;
          triggered = true;
        }
      }
      return triggered;
    },
  };
}
