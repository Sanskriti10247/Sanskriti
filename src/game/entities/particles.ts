import * as THREE from 'three';

interface Particle {
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  life: number;
  maxLife: number;
  size: number;
  gravity: number;
}

export interface EmitOptions {
  color: THREE.ColorRepresentation;
  count: number;
  /** Starting speed in random directions. */
  speed?: number;
  /** Extra upward speed. */
  lift?: number;
  size?: number;
  life?: number;
  gravity?: number;
  /** Shared starting velocity, e.g. the car's, for trails. */
  inherit?: THREE.Vector3;
}

export interface Particles {
  mesh: THREE.InstancedMesh;
  emit(origin: THREE.Vector3, options: EmitOptions): void;
  update(delta: number): void;
  clear(): void;
}

/** A small pool of soft round puffs used for dust, sparkles and drift smoke. */
export function createParticles(capacity = 220): Particles {
  const mesh = new THREE.InstancedMesh(
    new THREE.SphereGeometry(1, 8, 6),
    new THREE.MeshLambertMaterial({ color: '#ffffff' }),
    capacity,
  );
  mesh.frustumCulled = false;
  const pool: Particle[] = Array.from({ length: capacity }, () => ({
    position: new THREE.Vector3(),
    velocity: new THREE.Vector3(),
    life: 0,
    maxLife: 1,
    size: 0,
    gravity: 0,
  }));
  const hidden = new THREE.Matrix4().makeScale(0, 0, 0);
  const matrix = new THREE.Matrix4();
  const quaternion = new THREE.Quaternion();
  const scale = new THREE.Vector3();
  const color = new THREE.Color();
  let cursor = 0;

  for (let i = 0; i < capacity; i += 1) {
    mesh.setMatrixAt(i, hidden);
    mesh.setColorAt(i, color.set('#ffffff'));
  }

  return {
    mesh,
    emit(
      origin,
      { color: tint, count, speed = 3, lift = 2, size = 0.25, life = 0.8, gravity = 6, inherit },
    ) {
      color.set(tint);
      for (let n = 0; n < count; n += 1) {
        const index = cursor;
        cursor = (cursor + 1) % capacity;
        const p = pool[index];
        p.position.copy(origin);
        p.velocity
          .set(Math.random() - 0.5, Math.random() * 0.6, Math.random() - 0.5)
          .normalize()
          .multiplyScalar(speed * (0.4 + Math.random() * 0.6));
        p.velocity.y += lift;
        if (inherit) p.velocity.addScaledVector(inherit, 0.3);
        p.life = p.maxLife = life * (0.7 + Math.random() * 0.6);
        p.size = size * (0.6 + Math.random() * 0.8);
        p.gravity = gravity;
        mesh.setColorAt(index, color);
      }
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    },
    update(delta) {
      pool.forEach((p, index) => {
        if (p.life <= 0) return;
        p.life -= delta;
        if (p.life <= 0) {
          mesh.setMatrixAt(index, hidden);
          return;
        }
        p.velocity.y -= p.gravity * delta;
        p.velocity.multiplyScalar(Math.exp(-1.8 * delta));
        p.position.addScaledVector(p.velocity, delta);
        if (p.position.y < 0.1) {
          p.position.y = 0.1;
          p.velocity.y *= -0.3;
        }
        const t = p.life / p.maxLife;
        scale.setScalar(p.size * Math.sin(t * Math.PI) * 1.4 + 0.001);
        matrix.compose(p.position, quaternion, scale);
        mesh.setMatrixAt(index, matrix);
      });
      mesh.instanceMatrix.needsUpdate = true;
    },
    clear() {
      pool.forEach((p, index) => {
        p.life = 0;
        mesh.setMatrixAt(index, hidden);
      });
      mesh.instanceMatrix.needsUpdate = true;
    },
  };
}
