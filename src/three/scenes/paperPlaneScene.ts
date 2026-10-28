import * as THREE from 'three';
import {
  addSoftLights,
  between,
  clamp,
  damp,
  easeOutBack,
  palette,
  type SceneFactory,
} from '../core';

interface Flight {
  plane: THREE.Group;
  trail: THREE.Line;
  points: THREE.Vector3[];
  curve: THREE.CubicBezierCurve3;
  t: number;
  active: boolean;
}

const TRAIL_LENGTH = 40;
const FLIGHT_TIME = 2.3;

function planeGeometry(): THREE.BufferGeometry {
  const nose = [0, 0, 0.9];
  const left = [-0.62, 0.06, -0.5];
  const right = [0.62, 0.06, -0.5];
  const tail = [0, 0.02, -0.5];
  const keel = [0, -0.24, -0.46];
  const vertices = [
    ...nose,
    ...left,
    ...tail,
    ...nose,
    ...tail,
    ...right,
    ...nose,
    ...keel,
    ...tail,
    ...nose,
    ...tail,
    ...keel,
  ];
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geometry.computeVertexNormals();
  return geometry;
}

/**
 * Contact moment: a folded paper plane hovers in the middle. Tap anywhere and
 * it flies off toward that spot, loops away into the distance, and a fresh
 * one folds itself back in.
 */
export const paperPlaneScene: SceneFactory = ({ scene, camera, report }) => {
  camera.position.set(0, 0, 8);
  addSoftLights(scene, 1.1);

  const geometry = planeGeometry();
  const edges = new THREE.EdgesGeometry(geometry, 1);
  const paper = new THREE.MeshStandardMaterial({
    color: palette.cream,
    roughness: 0.75,
    side: THREE.DoubleSide,
    flatShading: true,
  });
  const edgeMaterial = new THREE.LineBasicMaterial({ color: palette.rose });

  const makePlane = () => {
    const group = new THREE.Group();
    group.add(new THREE.Mesh(geometry, paper), new THREE.LineSegments(edges, edgeMaterial));
    return group;
  };

  const idle = makePlane();
  idle.scale.setScalar(1.15);
  scene.add(idle);
  let refold = 1;

  const trailMaterial = new THREE.LineDashedMaterial({
    color: palette.bubblegum,
    dashSize: 0.14,
    gapSize: 0.11,
    transparent: true,
  });
  const flights: Flight[] = Array.from({ length: 4 }, () => {
    const plane = makePlane();
    plane.visible = false;
    const points = Array.from({ length: TRAIL_LENGTH }, () => new THREE.Vector3());
    const trail = new THREE.Line(new THREE.BufferGeometry().setFromPoints(points), trailMaterial);
    trail.visible = false;
    trail.frustumCulled = false;
    scene.add(plane, trail);
    return {
      plane,
      trail,
      points,
      curve: new THREE.CubicBezierCurve3(),
      t: 0,
      active: false,
    };
  });

  let thrown = 0;
  const publish = () => report(thrown === 0 ? 'no planes thrown yet' : `planes thrown ${thrown}`);
  publish();

  const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
  const hit = new THREE.Vector3();
  const tangent = new THREE.Vector3();
  const lookTarget = new THREE.Vector3();

  const launch = (target: THREE.Vector3) => {
    const flight = flights.find((f) => !f.active);
    if (!flight || refold < 0.6) return;
    const start = idle.position.clone();
    const side = target.x >= 0 ? 1 : -1;
    flight.curve.v0.copy(start);
    flight.curve.v1.set(start.x - side * 1.2, start.y - 1.2, 2.2);
    flight.curve.v2.set(target.x + side * 0.8, target.y + 1.6, 0.6);
    flight.curve.v3.set(target.x * 2.4 + side * 2, target.y + between(3.5, 5), -9);
    flight.t = 0;
    flight.active = true;
    flight.plane.visible = true;
    flight.trail.visible = true;
    flight.points.forEach((p) => p.copy(start));
    refold = 0;
    thrown += 1;
    publish();
  };

  return {
    onPointer({ type, raycaster }) {
      if (type !== 'down') return;
      if (raycaster.ray.intersectPlane(plane, hit)) launch(hit);
    },

    update({ time, delta, pointer }) {
      refold = Math.min(1, refold + delta * 1.3);
      idle.position.set(Math.sin(time * 0.8) * 0.25, Math.sin(time * 1.6) * 0.18, 0);
      idle.scale.setScalar(1.15 * easeOutBack(refold));
      const aimX = clamp(pointer.x, -1, 1);
      const aimY = clamp(pointer.y, -1, 1);
      idle.rotation.set(
        -0.35 - aimY * 0.3 + Math.sin(time * 1.6) * 0.06,
        0.6 + aimX * 0.6,
        damp(idle.rotation.z, -aimX * 0.35 + Math.sin(time) * 0.1, 4, delta),
      );

      for (const flight of flights) {
        if (!flight.active) continue;
        flight.t += delta / FLIGHT_TIME;
        const t = Math.min(1, flight.t);
        const eased = t * (2 - t) * 0.6 + t * 0.4;
        flight.curve.getPoint(eased, flight.plane.position);
        flight.curve.getTangent(Math.min(eased, 0.999), tangent);
        lookTarget.copy(flight.plane.position).add(tangent);
        flight.plane.lookAt(lookTarget);
        flight.plane.rotateZ(Math.sin(t * Math.PI * 2) * 0.6);

        flight.points.pop();
        flight.points.unshift(flight.plane.position.clone());
        flight.trail.geometry.setFromPoints(flight.points);
        flight.trail.computeLineDistances();

        if (t >= 1) {
          flight.active = false;
          flight.plane.visible = false;
          flight.trail.visible = false;
        }
      }
    },

    reset() {
      thrown = 0;
      publish();
    },

    dispose() {
      geometry.dispose();
      edges.dispose();
      paper.dispose();
      edgeMaterial.dispose();
      trailMaterial.dispose();
    },
  };
};
