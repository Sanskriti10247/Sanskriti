import * as THREE from 'three';
import { candyMaterial, clamp, damp, palette, RoundedBoxGeometry, toyGeometry } from '@/three/core';
import { CAR } from '../config';
import type { DriveIntent } from '../types';

const WHEEL_RADIUS = 0.48;

export interface Car {
  group: THREE.Group;
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  /** Direction the car points, in radians around +y. 0 faces +z. */
  heading: number;
  /** Signed speed along the heading. */
  speed: number;
  /** Seconds of boost remaining. */
  boost: number;
  /** How much the car is sliding sideways this frame. */
  slip: number;
  forward(target?: THREE.Vector3): THREE.Vector3;
  step(intent: DriveIntent, onRoad: boolean, delta: number): void;
  /** Bounce off a solid surface whose outward normal is `normal`. Returns impact strength. */
  bounce(normal: THREE.Vector3): number;
  place(position: THREE.Vector3, heading: number): void;
}

function wheel(material: THREE.Material, hubMaterial: THREE.Material) {
  const group = new THREE.Group();
  const tyre = new THREE.Mesh(
    new THREE.CylinderGeometry(WHEEL_RADIUS, WHEEL_RADIUS, 0.42, 22).rotateZ(Math.PI / 2),
    material,
  );
  const hub = new THREE.Mesh(
    new THREE.CylinderGeometry(0.22, 0.22, 0.46, 16).rotateZ(Math.PI / 2),
    hubMaterial,
  );
  tyre.castShadow = true;
  group.add(tyre, hub);
  return group;
}

/** A chunky toy car built from rounded candy pieces, facing +z. */
function buildModel() {
  const group = new THREE.Group();
  const body = new THREE.Group();
  body.position.y = 0.62;

  const shell = new THREE.Mesh(
    new RoundedBoxGeometry(2.1, 0.8, 3.7, 4, 0.32),
    candyMaterial(palette.bubblegum),
  );
  const stripe = new THREE.Mesh(
    new RoundedBoxGeometry(0.46, 0.06, 3.72, 2, 0.03),
    candyMaterial(palette.cream),
  );
  stripe.position.y = 0.39;
  const cabin = new THREE.Mesh(
    new RoundedBoxGeometry(1.75, 0.8, 1.9, 4, 0.32),
    candyMaterial(palette.cream),
  );
  cabin.position.set(0, 0.68, -0.3);
  const glass = new THREE.Mesh(
    new RoundedBoxGeometry(1.8, 0.44, 1.6, 3, 0.16),
    new THREE.MeshPhysicalMaterial({ color: '#5b4350', roughness: 0.15, clearcoat: 1 }),
  );
  glass.position.set(0, 0.74, -0.3);
  body.add(shell, stripe, cabin, glass);

  const lightMaterial = new THREE.MeshStandardMaterial({
    color: palette.butter,
    emissive: palette.butter,
    emissiveIntensity: 0.6,
  });
  const tailMaterial = candyMaterial(palette.rose);
  for (const x of [-0.68, 0.68]) {
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.17, 14, 10), lightMaterial);
    head.position.set(x, 0.04, 1.82);
    const tail = new THREE.Mesh(new RoundedBoxGeometry(0.42, 0.16, 0.1, 2, 0.05), tailMaterial);
    tail.position.set(x, 0.12, -1.86);
    body.add(head, tail);
  }

  // A little antenna with a heart on top.
  const antenna = new THREE.Mesh(
    new THREE.CylinderGeometry(0.025, 0.025, 1, 6),
    candyMaterial(palette.ink),
  );
  antenna.position.set(-0.7, 0.85, -1.4);
  const heart = new THREE.Mesh(toyGeometry('heart', 0.22), candyMaterial(palette.rose));
  heart.position.set(-0.7, 1.4, -1.4);
  body.add(antenna, heart);

  body.traverse((object) => {
    if (object instanceof THREE.Mesh) object.castShadow = true;
  });

  const tyreMaterial = candyMaterial(palette.ink);
  const hubMaterial = candyMaterial(palette.cream);
  const wheels: THREE.Group[] = [];
  const steering: THREE.Group[] = [];
  for (const [x, z] of [
    [-1.08, 1.25],
    [1.08, 1.25],
    [-1.08, -1.25],
    [1.08, -1.25],
  ]) {
    const pivot = new THREE.Group();
    pivot.position.set(x, WHEEL_RADIUS, z);
    const w = wheel(tyreMaterial, hubMaterial);
    pivot.add(w);
    group.add(pivot);
    wheels.push(w);
    if (z > 0) steering.push(pivot);
  }

  group.add(body);
  return { group, body, wheels, steering, antennaHeart: heart };
}

export function createCar(): Car {
  const { group, body, wheels, steering, antennaHeart } = buildModel();
  const desired = new THREE.Vector3();
  const forwardVector = new THREE.Vector3();
  let steerVisual = 0;
  let lastSpeed = 0;

  const car: Car = {
    group,
    position: group.position,
    velocity: new THREE.Vector3(),
    heading: 0,
    speed: 0,
    boost: 0,
    slip: 0,

    forward(target = forwardVector) {
      return target.set(Math.sin(car.heading), 0, Math.cos(car.heading));
    },

    step(intent, onRoad, delta) {
      car.boost = Math.max(0, car.boost - delta);
      const boosting = car.boost > 0;
      const topSpeed =
        (onRoad ? CAR.roadMaxSpeed : CAR.offroadMaxSpeed) * (boosting ? CAR.boostMultiplier : 1);
      const throttle = boosting ? Math.max(intent.throttle, 0.6) : intent.throttle;

      if (throttle > 0) {
        car.speed +=
          (car.speed < 0 ? CAR.braking : CAR.acceleration * (boosting ? 1.6 : 1)) *
          throttle *
          delta;
      } else if (throttle < 0) {
        car.speed -= (car.speed > 0.5 ? CAR.braking : CAR.acceleration * 0.6) * -throttle * delta;
      } else {
        car.speed = damp(car.speed, 0, onRoad ? 0.7 : 1.6, delta);
      }
      if (intent.drift) car.speed = damp(car.speed, 0, 0.5, delta);
      if (car.speed > topSpeed) car.speed = damp(car.speed, topSpeed, 3, delta);
      car.speed = Math.max(car.speed, -CAR.reverseMax);

      const speedFactor = clamp(Math.abs(car.speed) / 6);
      const turn =
        (intent.steer *
          CAR.steerRate *
          speedFactor *
          Math.sign(car.speed || 1) *
          (intent.drift ? 1.4 : 1)) /
        (1 + Math.abs(car.speed) / 45);
      car.heading += turn * delta;

      desired.copy(car.forward()).multiplyScalar(car.speed);
      const grip = intent.drift ? CAR.driftGrip : onRoad ? CAR.roadGrip : CAR.offroadGrip;
      car.velocity.lerp(desired, 1 - Math.exp(-grip * delta));
      car.slip = car.velocity.distanceTo(desired);
      car.position.addScaledVector(car.velocity, delta);

      // Visuals: steering, wheel spin, body roll and pitch.
      steerVisual = damp(steerVisual, intent.steer * 0.45, 12, delta);
      for (const pivot of steering) pivot.rotation.y = steerVisual;
      for (const w of wheels) w.rotation.x += (car.speed * delta) / WHEEL_RADIUS;
      const acceleration = (car.speed - lastSpeed) / Math.max(delta, 1e-3);
      lastSpeed = car.speed;
      body.rotation.z = damp(
        body.rotation.z,
        -intent.steer * clamp(Math.abs(car.speed) / 22) * 0.09,
        6,
        delta,
      );
      body.rotation.x = damp(body.rotation.x, clamp(-acceleration * 0.004, -0.06, 0.06), 6, delta);
      antennaHeart.rotation.y += delta * 3;
      antennaHeart.rotation.z = damp(antennaHeart.rotation.z, -turn * 0.2, 4, delta);
      group.rotation.y = car.heading;
    },

    bounce(normal) {
      const into = car.velocity.dot(normal);
      if (into >= 0) return 0;
      car.velocity.addScaledVector(normal, -into * 1.5);
      car.speed *= 0.35;
      return Math.abs(into);
    },

    place(position, heading) {
      car.position.copy(position);
      car.heading = heading;
      car.speed = 0;
      car.boost = 0;
      car.velocity.set(0, 0, 0);
      group.rotation.y = heading;
      body.rotation.set(0, 0, 0);
    },
  };
  return car;
}
