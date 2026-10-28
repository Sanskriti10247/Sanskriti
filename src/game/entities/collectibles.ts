import * as THREE from 'three';
import { between, candyMaterial, createBlobShadow, palette, toyGeometry } from '@/three/core';
import { GAME } from '../config';
import type { Collider } from '../types';
import type { Track } from '../world/track';

export interface Pickup {
  group: THREE.Group;
  value: number;
  active: boolean;
  phase: number;
}

export interface Collectibles {
  group: THREE.Group;
  hearts: Pickup[];
  star: Pickup;
  /** Collects anything the car touches; returns the picked-up items. */
  update(time: number, delta: number, car: THREE.Vector3): Pickup[];
  reset(car: THREE.Vector3): void;
}

const PICKUP_RADIUS = 2;

/** Floating hearts (1 point) spread along the road, plus one bonus star (3 points). */
export function createCollectibles(track: Track, colliders: Collider[]): Collectibles {
  const group = new THREE.Group();
  const heartGeometry = toyGeometry('heart', 0.75);
  const heartMaterial = candyMaterial(palette.rose);
  const starGeometry = toyGeometry('star', 0.85);
  const starMaterial = candyMaterial(palette.butter);
  let starTimer = 0;

  const make = (
    geometry: THREE.BufferGeometry,
    material: THREE.Material,
    value: number,
  ): Pickup => {
    const item = new THREE.Group();
    const mesh = new THREE.Mesh(geometry, material);
    mesh.castShadow = true;
    mesh.name = 'shape';
    const shadow = createBlobShadow(2, 0.35);
    shadow.position.y = 0.06;
    item.add(mesh, shadow);
    group.add(item);
    return { group: item, value, active: true, phase: Math.random() * Math.PI * 2 };
  };

  const hearts = Array.from({ length: GAME.heartCount }, () =>
    make(heartGeometry, heartMaterial, 1),
  );
  const star = make(starGeometry, starMaterial, 3);

  const isClear = (x: number, z: number, avoid: THREE.Vector3) => {
    if (Math.hypot(x - avoid.x, z - avoid.z) < 14) return false;
    if (Math.hypot(x, z) > GAME.driveRadius - 3) return false;
    if (colliders.some((c) => Math.hypot(c.x - x, c.z - z) < c.radius + 1.5)) return false;
    const others = [...hearts, star].filter((p) => p.active);
    return !others.some((p) => Math.hypot(p.group.position.x - x, p.group.position.z - z) < 4);
  };

  const place = (pickup: Pickup, avoid: THREE.Vector3, offRoadChance = 0.25) => {
    pickup.active = false;
    for (let attempt = 0; attempt < 40; attempt += 1) {
      const offRoad = Math.random() < offRoadChance;
      const lateral = offRoad
        ? Math.sign(Math.random() - 0.5) * between(GAME.roadWidth / 2 + 3, GAME.roadWidth / 2 + 9)
        : between(-GAME.roadWidth / 2 + 1, GAME.roadWidth / 2 - 1);
      const { point } = track.sample(Math.random(), lateral);
      if (!isClear(point.x, point.z, avoid)) continue;
      pickup.group.position.set(point.x, 0, point.z);
      break;
    }
    pickup.active = true;
    pickup.group.visible = true;
  };

  return {
    group,
    hearts,
    star,

    update(time, delta, car) {
      const picked: Pickup[] = [];
      if (!star.active) {
        starTimer -= delta;
        if (starTimer <= 0) place(star, car, 0.6);
      }
      for (const pickup of [...hearts, star]) {
        if (!pickup.active) continue;
        const shape = pickup.group.getObjectByName('shape');
        if (shape) {
          shape.position.y = 1.3 + Math.sin(time * 2.4 + pickup.phase) * 0.25;
          shape.rotation.y = time * 1.8 + pickup.phase;
        }
        const dx = pickup.group.position.x - car.x;
        const dz = pickup.group.position.z - car.z;
        if (dx * dx + dz * dz < PICKUP_RADIUS * PICKUP_RADIUS) {
          picked.push(pickup);
          if (pickup === star) {
            star.active = false;
            star.group.visible = false;
            starTimer = GAME.starRespawnSeconds;
          } else {
            place(pickup, car);
          }
        }
      }
      return picked;
    },

    reset(car) {
      for (const pickup of [...hearts, star]) pickup.active = false;
      for (const heart of hearts) place(heart, car);
      place(star, car, 0.6);
    },
  };
}
