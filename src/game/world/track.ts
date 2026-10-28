import * as THREE from 'three';
import { palette } from '@/three/core';
import { GAME } from '../config';
import type { TrackSample } from '../types';

const SAMPLE_COUNT = 420;

/** Hand-placed control points for a looping, slightly wobbly road around the island. */
const CONTROL_POINTS: Array<[number, number]> = [
  [0, -28],
  [17, -23],
  [29, -9],
  [26, 9],
  [12, 17],
  [5, 29],
  [-12, 27],
  [-22, 14],
  [-30, 0],
  [-25, -16],
  [-13, -26],
];

export interface Track {
  samples: TrackSample[];
  /** Road, centre line and kerbs as one group. */
  mesh: THREE.Group;
  /** Distance from a ground point to the road's centre line. */
  distanceToRoad(x: number, z: number): number;
  /** Point along the loop (u in 0..1), shifted sideways by `offset`. */
  sample(u: number, offset?: number): TrackSample;
}

type SegmentColor = (index: number) => THREE.ColorRepresentation | null;

/** Builds a flat strip along the loop between two side offsets; null colours skip a segment. */
function ribbon(samples: TrackSample[], from: number, to: number, y: number, color: SegmentColor) {
  const positions: number[] = [];
  const colors: number[] = [];
  const c = new THREE.Color();
  const corner = (sample: TrackSample, offset: number) =>
    sample.point.clone().addScaledVector(sample.side, offset).setY(y);

  samples.forEach((sample, index) => {
    const segmentColor = color(index);
    if (segmentColor === null) return;
    const next = samples[(index + 1) % samples.length];
    const a = corner(sample, from);
    const b = corner(sample, to);
    const d = corner(next, from);
    const e = corner(next, to);
    for (const v of [a, d, b, b, d, e]) positions.push(v.x, v.y, v.z);
    c.set(segmentColor);
    for (let k = 0; k < 6; k += 1) colors.push(c.r, c.g, c.b);
  });

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  geometry.computeVertexNormals();
  return geometry;
}

export function createTrack(): Track {
  const curve = new THREE.CatmullRomCurve3(
    CONTROL_POINTS.map(([x, z]) => new THREE.Vector3(x, 0, z)),
    true,
    'centripetal',
  );

  const sampleAt = (u: number, offset = 0): TrackSample => {
    const wrapped = ((u % 1) + 1) % 1;
    const tangent = curve.getTangentAt(wrapped).setY(0).normalize();
    const side = new THREE.Vector3(tangent.z, 0, -tangent.x);
    const point = curve.getPointAt(wrapped).addScaledVector(side, offset);
    return { point, tangent, side };
  };

  const samples = Array.from({ length: SAMPLE_COUNT }, (_, i) => sampleAt(i / SAMPLE_COUNT));
  const half = GAME.roadWidth / 2;
  const material = new THREE.MeshStandardMaterial({
    vertexColors: true,
    roughness: 0.85,
    side: THREE.DoubleSide,
  });

  const road = new THREE.Mesh(
    ribbon(samples, -half, half, 0.02, () => '#fffaf7'),
    material,
  );
  const centre = new THREE.Mesh(
    ribbon(samples, -0.14, 0.14, 0.035, (i) => (i % 6 < 3 ? palette.pink : null)),
    material,
  );
  const kerbColor: SegmentColor = (i) => (Math.floor(i / 2) % 2 === 0 ? palette.rose : '#ffffff');
  const kerbLeft = new THREE.Mesh(ribbon(samples, half, half + 0.6, 0.04, kerbColor), material);
  const kerbRight = new THREE.Mesh(ribbon(samples, -half - 0.6, -half, 0.04, kerbColor), material);

  const mesh = new THREE.Group();
  for (const part of [road, centre, kerbLeft, kerbRight]) {
    part.receiveShadow = true;
    mesh.add(part);
  }

  return {
    samples,
    mesh,
    sample: sampleAt,
    distanceToRoad(x, z) {
      let best = Infinity;
      for (const { point } of samples) {
        const d = (point.x - x) ** 2 + (point.z - z) ** 2;
        if (d < best) best = d;
      }
      return Math.sqrt(best);
    },
  };
}
