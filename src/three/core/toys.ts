import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { palette } from './palette';

/** Glossy, slightly soft "candy" material used for toys. */
export function candyMaterial(color: THREE.ColorRepresentation): THREE.MeshPhysicalMaterial {
  return new THREE.MeshPhysicalMaterial({
    color,
    roughness: 0.38,
    clearcoat: 0.7,
    clearcoatRoughness: 0.28,
    sheen: 0.4,
    sheenColor: new THREE.Color('#ffffff'),
  });
}

/** Matte, clay-like material for boards and props. */
export function clayMaterial(color: THREE.ColorRepresentation): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({ color, roughness: 0.85, metalness: 0 });
}

function centred(geometry: THREE.BufferGeometry): THREE.BufferGeometry {
  geometry.computeBoundingBox();
  const box = geometry.boundingBox ?? new THREE.Box3();
  const centre = box.getCenter(new THREE.Vector3());
  geometry.translate(-centre.x, -centre.y, -centre.z);
  return geometry;
}

function heartShape(): THREE.Shape {
  const s = new THREE.Shape();
  s.moveTo(0, -0.9);
  s.bezierCurveTo(-0.15, -0.72, -1, -0.25, -1, 0.25);
  s.bezierCurveTo(-1, 0.72, -0.5, 0.95, 0, 0.55);
  s.bezierCurveTo(0.5, 0.95, 1, 0.72, 1, 0.25);
  s.bezierCurveTo(1, -0.25, 0.15, -0.72, 0, -0.9);
  return s;
}

function starShape(points = 5, outer = 1, inner = 0.5): THREE.Shape {
  const s = new THREE.Shape();
  for (let i = 0; i <= points * 2; i += 1) {
    const radius = i % 2 === 0 ? outer : inner;
    const angle = (i / (points * 2)) * Math.PI * 2 + Math.PI / 2;
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;
    if (i === 0) s.moveTo(x, y);
    else s.lineTo(x, y);
  }
  return s;
}

export type ToyKind = 'ball' | 'cube' | 'donut' | 'pill' | 'heart' | 'star';

export const toyKinds: ToyKind[] = ['ball', 'cube', 'donut', 'pill', 'heart', 'star'];

/** Builds a toy geometry that roughly fills a sphere of the given radius. */
export function toyGeometry(kind: ToyKind, radius: number): THREE.BufferGeometry {
  switch (kind) {
    case 'ball':
      return new THREE.SphereGeometry(radius, 32, 24);
    case 'cube':
      return new RoundedBoxGeometry(radius * 1.35, radius * 1.35, radius * 1.35, 4, radius * 0.32);
    case 'donut':
      return new THREE.TorusGeometry(radius * 0.66, radius * 0.34, 18, 40);
    case 'pill':
      return new THREE.CapsuleGeometry(radius * 0.52, radius * 0.9, 8, 20).rotateZ(Math.PI / 2);
    case 'heart': {
      const geometry = new THREE.ExtrudeGeometry(heartShape(), {
        depth: 0.5,
        bevelEnabled: true,
        bevelThickness: 0.28,
        bevelSize: 0.22,
        bevelSegments: 6,
        curveSegments: 24,
      });
      return centred(geometry).scale(radius * 0.78, radius * 0.78, radius * 0.78);
    }
    case 'star': {
      const geometry = new THREE.ExtrudeGeometry(starShape(), {
        depth: 0.35,
        bevelEnabled: true,
        bevelThickness: 0.22,
        bevelSize: 0.16,
        bevelSegments: 5,
      });
      return centred(geometry).scale(radius * 0.92, radius * 0.92, radius * 0.92);
    }
  }
}

/**
 * A little bean character: a candy capsule body with two eyes and blush
 * cheeks, facing +z. Used as walkers and racing agents.
 */
export function createBean(color: THREE.ColorRepresentation, height = 0.62): THREE.Group {
  const group = new THREE.Group();
  const radius = height * 0.36;
  const body = new THREE.Mesh(
    new THREE.CapsuleGeometry(radius, height - radius * 2, 8, 20),
    candyMaterial(color),
  );
  body.position.y = height / 2;
  group.add(body);

  const eyeMaterial = new THREE.MeshStandardMaterial({ color: palette.ink, roughness: 0.3 });
  const cheekMaterial = new THREE.MeshStandardMaterial({ color: palette.rose, roughness: 0.9 });
  const eyeGeometry = new THREE.SphereGeometry(radius * 0.13, 12, 10);
  const cheekGeometry = new THREE.SphereGeometry(radius * 0.13, 12, 8).scale(1.5, 0.75, 0.4);
  for (const side of [-1, 1]) {
    const eye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    eye.position.set(side * radius * 0.38, height * 0.66, radius * 0.92);
    const cheek = new THREE.Mesh(cheekGeometry, cheekMaterial);
    cheek.position.set(side * radius * 0.62, height * 0.55, radius * 0.8);
    group.add(eye, cheek);
  }
  return group;
}

/** A rounded, flat board to stand game pieces on. */
export function createBoard(
  width: number,
  depth: number,
  color: THREE.ColorRepresentation = palette.blush,
): THREE.Mesh {
  const board = new THREE.Mesh(
    new RoundedBoxGeometry(width, 0.16, depth, 4, 0.08),
    clayMaterial(color),
  );
  board.position.y = -0.08;
  return board;
}

export { RoundedBoxGeometry };
