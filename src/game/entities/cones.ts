import * as THREE from 'three';
import { candyMaterial, palette, RoundedBoxGeometry } from '@/three/core';
import type { Track } from '../world/track';

interface Cone {
  group: THREE.Group;
  home: THREE.Vector3;
  velocity: THREE.Vector3;
  spin: THREE.Vector3;
  knocked: boolean;
}

export interface Cones {
  group: THREE.Group;
  /** Knocks over any cone the car drives into; returns how many were hit. */
  update(delta: number, car: THREE.Vector3, carVelocity: THREE.Vector3): number;
  reset(): void;
}

const HIT_RADIUS = 1.6;

/** Little slaloms of traffic cones on the road that go flying when you hit them. */
export function createCones(track: Track): Cones {
  const group = new THREE.Group();
  const coneGeometry = new THREE.ConeGeometry(0.42, 1.1, 18);
  const baseGeometry = new RoundedBoxGeometry(0.95, 0.14, 0.95, 2, 0.05);
  const stripeGeometry = new THREE.CylinderGeometry(0.27, 0.32, 0.18, 18);
  const coneMaterial = candyMaterial(palette.peach);
  const stripeMaterial = candyMaterial('#ffffff');
  const baseMaterial = candyMaterial(palette.rose);
  const cones: Cone[] = [];

  for (const u of [0.13, 0.36, 0.6, 0.83]) {
    for (let i = 0; i < 3; i += 1) {
      const { point } = track.sample(u + i * 0.012, (i - 1) * 1.9);
      const cone = new THREE.Group();
      const base = new THREE.Mesh(baseGeometry, baseMaterial);
      base.position.y = 0.07;
      const body = new THREE.Mesh(coneGeometry, coneMaterial);
      body.position.y = 0.65;
      const stripe = new THREE.Mesh(stripeGeometry, stripeMaterial);
      stripe.position.y = 0.72;
      for (const part of [base, body, stripe]) part.castShadow = true;
      cone.add(base, body, stripe);
      cone.position.copy(point);
      group.add(cone);
      cones.push({
        group: cone,
        home: point.clone(),
        velocity: new THREE.Vector3(),
        spin: new THREE.Vector3(),
        knocked: false,
      });
    }
  }

  return {
    group,
    update(delta, car, carVelocity) {
      let hits = 0;
      for (const cone of cones) {
        const { group: g } = cone;
        if (!cone.knocked) {
          const dx = g.position.x - car.x;
          const dz = g.position.z - car.z;
          if (dx * dx + dz * dz < HIT_RADIUS * HIT_RADIUS && carVelocity.lengthSq() > 4) {
            cone.knocked = true;
            hits += 1;
            cone.velocity
              .copy(carVelocity)
              .multiplyScalar(0.9)
              .add(new THREE.Vector3(dx, 0, dz).normalize().multiplyScalar(3));
            cone.velocity.y = 5 + carVelocity.length() * 0.2;
            cone.spin.set(Math.random() * 12 - 6, Math.random() * 8 - 4, Math.random() * 12 - 6);
          }
          continue;
        }
        if (cone.velocity.lengthSq() < 0.01 && g.position.y <= 0.31) continue;
        cone.velocity.y -= 22 * delta;
        g.position.addScaledVector(cone.velocity, delta);
        g.rotation.x += cone.spin.x * delta;
        g.rotation.y += cone.spin.y * delta;
        g.rotation.z += cone.spin.z * delta;
        if (g.position.y < 0.3) {
          g.position.y = 0.3;
          cone.velocity.y *= -0.35;
          cone.velocity.x *= 0.6;
          cone.velocity.z *= 0.6;
          cone.spin.multiplyScalar(0.6);
          if (Math.abs(cone.velocity.y) < 1) {
            cone.velocity.set(0, 0, 0);
            // Settle lying on its side.
            g.rotation.set(Math.PI / 2, g.rotation.y, 0);
          }
        }
      }
      return hits;
    },
    reset() {
      for (const cone of cones) {
        cone.knocked = false;
        cone.velocity.set(0, 0, 0);
        cone.group.position.copy(cone.home);
        cone.group.rotation.set(0, 0, 0);
      }
    },
  };
}
