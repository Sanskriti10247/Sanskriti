import * as THREE from 'three';
import { damp } from './math';

/** A round body in a simple 2D (x/y) world. */
export interface Body {
  position: THREE.Vector2;
  velocity: THREE.Vector2;
  radius: number;
  mass: number;
  /** 0..~0.35, how squashed the body currently looks after an impact. */
  squash: number;
  /** Rotation around the view axis, in radians. */
  angle: number;
  /** Angular velocity, in radians per second. */
  spin: number;
  /** Held bodies ignore gravity; their velocity is driven from outside. */
  held: boolean;
}

export interface WorldBounds {
  left: number;
  right: number;
  floor: number;
  ceiling: number;
}

export interface WorldOptions {
  gravity: number;
  bounds: WorldBounds;
  /** Bounciness, 0 = dead stop, 1 = perfectly elastic. */
  restitution?: number;
  /** Fraction of horizontal speed lost per second while touching the floor. */
  friction?: number;
}

export function createBody(x: number, y: number, radius: number): Body {
  return {
    position: new THREE.Vector2(x, y),
    velocity: new THREE.Vector2(),
    radius,
    mass: radius * radius,
    squash: 0,
    angle: 0,
    spin: 0,
    held: false,
  };
}

const normal = new THREE.Vector2();

function bump(body: Body, impact: number) {
  body.squash = Math.max(body.squash, Math.min(0.32, impact * 0.045));
}

function step(bodies: Body[], options: WorldOptions, dt: number) {
  const { gravity, bounds, restitution = 0.45, friction = 2.4 } = options;

  for (const body of bodies) {
    if (!body.held) body.velocity.y -= gravity * dt;
    body.position.addScaledVector(body.velocity, dt);
    body.angle += body.spin * dt;
    body.spin = damp(body.spin, 0, 0.8, dt);

    const { position: p, velocity: v, radius: r } = body;
    if (p.y - r < bounds.floor) {
      p.y = bounds.floor + r;
      if (v.y < 0) {
        bump(body, -v.y);
        v.y = -v.y * restitution;
        if (Math.abs(v.y) < 0.35) v.y = 0;
      }
      v.x = damp(v.x, 0, friction, dt);
      body.spin = -v.x / r;
    }
    if (p.y + r > bounds.ceiling) {
      p.y = bounds.ceiling - r;
      if (v.y > 0) v.y = -v.y * restitution;
    }
    if (p.x - r < bounds.left) {
      p.x = bounds.left + r;
      if (v.x < 0) {
        bump(body, -v.x);
        v.x = -v.x * restitution;
      }
    }
    if (p.x + r > bounds.right) {
      p.x = bounds.right - r;
      if (v.x > 0) {
        bump(body, v.x);
        v.x = -v.x * restitution;
      }
    }
  }

  for (let i = 0; i < bodies.length; i += 1) {
    for (let j = i + 1; j < bodies.length; j += 1) {
      const a = bodies[i];
      const b = bodies[j];
      normal.subVectors(b.position, a.position);
      const distance = normal.length();
      const overlap = a.radius + b.radius - distance;
      if (overlap <= 0 || distance === 0) continue;
      normal.divideScalar(distance);

      const inverseA = a.held ? 0 : 1 / a.mass;
      const inverseB = b.held ? 0 : 1 / b.mass;
      const inverseTotal = inverseA + inverseB;
      if (inverseTotal === 0) continue;

      a.position.addScaledVector(normal, (-overlap * inverseA) / inverseTotal);
      b.position.addScaledVector(normal, (overlap * inverseB) / inverseTotal);

      const approach =
        (b.velocity.x - a.velocity.x) * normal.x + (b.velocity.y - a.velocity.y) * normal.y;
      if (approach >= 0) continue;
      const impulse = (-(1 + restitution) * approach) / inverseTotal;
      a.velocity.addScaledVector(normal, -impulse * inverseA);
      b.velocity.addScaledVector(normal, impulse * inverseB);
      bump(a, -approach);
      bump(b, -approach);
      const tangent =
        (b.velocity.y - a.velocity.y) * normal.x - (b.velocity.x - a.velocity.x) * normal.y;
      a.spin += tangent * 0.4 * inverseA * a.mass;
      b.spin -= tangent * 0.4 * inverseB * b.mass;
    }
  }

  for (const body of bodies) body.squash = damp(body.squash, 0, 9, dt);
}

/** Advances the world, sub-stepping so fast throws don't tunnel through each other. */
export function stepWorld(bodies: Body[], options: WorldOptions, delta: number): void {
  const substeps = 3;
  for (let i = 0; i < substeps; i += 1) step(bodies, options, delta / substeps);
}

/** Applies the body's position, rotation and squash-and-stretch to its display object. */
export function syncBody(body: Body, outer: THREE.Object3D, inner: THREE.Object3D): void {
  outer.position.set(body.position.x, body.position.y, outer.position.z);
  const s = body.squash;
  outer.scale.set(1 + s * 0.55, 1 - s, 1 + s * 0.55);
  inner.rotation.z = body.angle;
}
