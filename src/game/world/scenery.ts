import * as THREE from 'three';
import { featuredProjects, profile } from '@/content';
import {
  candyMaterial,
  canvasTexture,
  clayMaterial,
  palette,
  RoundedBoxGeometry,
  seededRandom,
  between,
} from '@/three/core';
import { GAME } from '../config';
import type { Collider } from '../types';
import type { Track } from './track';

interface Scenery {
  group: THREE.Group;
  colliders: Collider[];
}

/** Grassy top with a scattering of tiny dots, plus a thick rounded side. */
function createGround(): THREE.Group {
  const group = new THREE.Group();
  const dots = canvasTexture(256, 256, (context) => {
    context.fillStyle = '#ffe3eb';
    context.fillRect(0, 0, 256, 256);
    const random = seededRandom(5);
    for (let i = 0; i < 70; i += 1) {
      context.fillStyle = random() < 0.5 ? 'rgba(249,168,194,0.55)' : 'rgba(255,255,255,0.8)';
      context.beginPath();
      context.arc(random() * 256, random() * 256, 1.5 + random() * 2.5, 0, Math.PI * 2);
      context.fill();
    }
  });
  dots.wrapS = dots.wrapT = THREE.RepeatWrapping;
  dots.repeat.set(16, 16);

  const top = new THREE.Mesh(
    new THREE.CircleGeometry(GAME.islandRadius, 96),
    new THREE.MeshStandardMaterial({ map: dots, roughness: 0.95 }),
  );
  top.rotation.x = -Math.PI / 2;
  top.receiveShadow = true;

  const side = new THREE.Mesh(
    new THREE.CylinderGeometry(GAME.islandRadius, GAME.islandRadius - 3, 4, 96, 1, true),
    clayMaterial(palette.pink),
  );
  side.position.y = -2.01;
  group.add(top, side);
  return group;
}

/** Keeps decorations off the road and away from each other. */
function createPlacer(track: Track, colliders: Collider[], random: () => number) {
  return (radius: number, roadClearance: number, maxRadius = GAME.driveRadius - 3) => {
    for (let attempt = 0; attempt < 60; attempt += 1) {
      const angle = random() * Math.PI * 2;
      const distance = Math.sqrt(random()) * maxRadius;
      const x = Math.cos(angle) * distance;
      const z = Math.sin(angle) * distance;
      if (track.distanceToRoad(x, z) < GAME.roadWidth / 2 + roadClearance) continue;
      if (colliders.some((c) => Math.hypot(c.x - x, c.z - z) < c.radius + radius + 1.5)) continue;
      return { x, z };
    }
    return null;
  };
}

function createTrees(
  place: ReturnType<typeof createPlacer>,
  colliders: Collider[],
  random: () => number,
) {
  const count = 38;
  const trunks = new THREE.InstancedMesh(
    new THREE.CylinderGeometry(0.22, 0.3, 1.8, 10),
    clayMaterial('#c98a7a'),
    count,
  );
  const crowns = new THREE.InstancedMesh(
    new THREE.SphereGeometry(1, 20, 16),
    candyMaterial('#ffffff'),
    count * 2,
  );
  const crownColors = [
    palette.pink,
    palette.mint,
    palette.butter,
    palette.bubblegum,
    palette.peach,
  ];
  const matrix = new THREE.Matrix4();
  const color = new THREE.Color();
  let placed = 0;

  for (let i = 0; i < count; i += 1) {
    const spot = place(1, 3);
    if (!spot) continue;
    const size = between(0.9, 1.5, random);
    matrix.makeTranslation(spot.x, 0.9, spot.z);
    trunks.setMatrixAt(placed, matrix);
    color.set(crownColors[Math.floor(random() * crownColors.length)]);
    matrix.compose(
      new THREE.Vector3(spot.x, 1.8 + size * 0.8, spot.z),
      new THREE.Quaternion(),
      new THREE.Vector3(size, size * 1.05, size),
    );
    crowns.setMatrixAt(placed * 2, matrix);
    crowns.setColorAt(placed * 2, color);
    matrix.compose(
      new THREE.Vector3(spot.x + size * 0.15, 1.8 + size * 1.7, spot.z),
      new THREE.Quaternion(),
      new THREE.Vector3(size * 0.6, size * 0.6, size * 0.6),
    );
    crowns.setMatrixAt(placed * 2 + 1, matrix);
    crowns.setColorAt(placed * 2 + 1, color);
    colliders.push({ x: spot.x, z: spot.z, radius: 0.8 });
    placed += 1;
  }
  trunks.count = placed;
  crowns.count = placed * 2;
  trunks.castShadow = crowns.castShadow = true;
  return [trunks, crowns];
}

function createHouses(
  place: ReturnType<typeof createPlacer>,
  colliders: Collider[],
  random: () => number,
) {
  const walls = [palette.cream, palette.peach, palette.butter, '#ffffff'];
  const roofs = [palette.rose, palette.bubblegum, palette.berry];
  const bodyGeometry = new RoundedBoxGeometry(3.2, 2.4, 3.2, 3, 0.25);
  const roofGeometry = new THREE.ConeGeometry(2.75, 1.7, 4).rotateY(Math.PI / 4);
  const doorGeometry = new RoundedBoxGeometry(0.8, 1.2, 0.2, 2, 0.08);
  const windowGeometry = new RoundedBoxGeometry(0.7, 0.7, 0.12, 2, 0.08);
  const doorMaterial = candyMaterial(palette.berry);
  const windowMaterial = candyMaterial('#ffffff');
  const houses: THREE.Group[] = [];

  for (let i = 0; i < 8; i += 1) {
    const spot = place(2.4, 4.5);
    if (!spot) continue;
    const house = new THREE.Group();
    const body = new THREE.Mesh(bodyGeometry, clayMaterial(walls[i % walls.length]));
    body.position.y = 1.2;
    const roof = new THREE.Mesh(roofGeometry, candyMaterial(roofs[i % roofs.length]));
    roof.position.y = 3.25;
    const door = new THREE.Mesh(doorGeometry, doorMaterial);
    door.position.set(0, 0.6, 1.62);
    const window = new THREE.Mesh(windowGeometry, windowMaterial);
    window.position.set(0.9, 1.6, 1.62);
    for (const part of [body, roof, door, window]) part.castShadow = true;
    house.add(body, roof, door, window);
    house.position.set(spot.x, 0, spot.z);
    // Face the island centre, where the road mostly is.
    house.rotation.y = Math.atan2(-spot.x, -spot.z) + between(-0.4, 0.4, random);
    houses.push(house);
    colliders.push({ x: spot.x, z: spot.z, radius: 2.3 });
  }
  return houses;
}

function billboardTexture(title: string, subtitle: string) {
  return canvasTexture(640, 320, (context, w, h) => {
    context.fillStyle = '#fffaf7';
    context.beginPath();
    context.roundRect(0, 0, w, h, 40);
    context.fill();
    context.lineWidth = 14;
    context.strokeStyle = palette.rose;
    context.beginPath();
    context.roundRect(14, 14, w - 28, h - 28, 30);
    context.stroke();
    context.fillStyle = palette.ink;
    context.textAlign = 'center';
    context.font = '800 72px "Bricolage Grotesque", system-ui, sans-serif';
    context.fillText(title, w / 2, h / 2 + 6);
    context.fillStyle = palette.rose;
    context.font = '600 34px "Figtree", system-ui, sans-serif';
    context.fillText(subtitle, w / 2, h / 2 + 64);
  });
}

/** Roadside boards that show off the projects as you drive past. */
function createBillboards(track: Track, colliders: Collider[]) {
  const boards = [
    { title: `hi, I'm ${profile.shortName}`, subtitle: 'welcome to my island' },
    ...featuredProjects.map((project) => ({
      title: project.title,
      subtitle: project.tagline.toLowerCase(),
    })),
  ];
  const postGeometry = new THREE.CylinderGeometry(0.14, 0.14, 3, 10);
  const postMaterial = clayMaterial(palette.cream);
  const frameGeometry = new RoundedBoxGeometry(4.6, 2.5, 0.3, 3, 0.12);
  const frameMaterial = candyMaterial(palette.pink);

  return boards.map((board, index) => {
    const u = 0.04 + index / boards.length;
    const { point, side, tangent } = track.sample(u, 0);
    const offset = GAME.roadWidth / 2 + 3.2;
    const position = point.clone().addScaledVector(side, offset);
    const group = new THREE.Group();
    const frame = new THREE.Mesh(frameGeometry, frameMaterial);
    frame.position.y = 3.6;
    const face = new THREE.Mesh(
      new THREE.PlaneGeometry(4.3, 2.15),
      new THREE.MeshStandardMaterial({
        map: billboardTexture(board.title, board.subtitle),
        roughness: 0.7,
      }),
    );
    face.position.set(0, 3.6, 0.16);
    group.add(frame, face);
    for (const x of [-1.5, 1.5]) {
      const post = new THREE.Mesh(postGeometry, postMaterial);
      post.position.set(x, 1.5, 0);
      post.castShadow = true;
      group.add(post);
    }
    frame.castShadow = true;
    group.position.copy(position);
    // Angle the board toward oncoming traffic.
    const facing = side.clone().multiplyScalar(-1).addScaledVector(tangent, -0.9);
    group.rotation.y = Math.atan2(facing.x, facing.z);
    colliders.push({ x: position.x, z: position.z, radius: 1.9 });
    return group;
  });
}

/** A ring of round bushes marking the island's edge. */
function createHedge(random: () => number) {
  const count = 84;
  const bushes = new THREE.InstancedMesh(
    new THREE.SphereGeometry(1, 16, 12),
    candyMaterial('#ffffff'),
    count,
  );
  const colors = [palette.mint, palette.pink, palette.butter, palette.blush];
  const matrix = new THREE.Matrix4();
  const color = new THREE.Color();
  for (let i = 0; i < count; i += 1) {
    const angle = (i / count) * Math.PI * 2 + between(-0.02, 0.02, random);
    const radius = GAME.islandRadius - between(1.2, 2.2, random);
    const size = between(1, 1.7, random);
    matrix.compose(
      new THREE.Vector3(Math.cos(angle) * radius, size * 0.55, Math.sin(angle) * radius),
      new THREE.Quaternion(),
      new THREE.Vector3(size, size * 0.85, size),
    );
    bushes.setMatrixAt(i, matrix);
    bushes.setColorAt(i, color.set(colors[i % colors.length]));
  }
  bushes.castShadow = true;
  return bushes;
}

/** Ground, road-side decorations and everything solid the car can bump into. */
export function createScenery(track: Track): Scenery {
  const random = seededRandom(42);
  const colliders: Collider[] = [];
  const group = new THREE.Group();
  group.add(createGround(), track.mesh);

  const billboards = createBillboards(track, colliders);
  const place = createPlacer(track, colliders, random);
  // Keep the starting straight clear.
  const start = track.sample(0).point;
  const startArea: Collider = { x: start.x, z: start.z, radius: 6 };
  colliders.push(startArea);
  const houses = createHouses(place, colliders, random);
  const trees = createTrees(place, colliders, random);
  colliders.splice(colliders.indexOf(startArea), 1);

  group.add(...billboards, ...houses, ...trees, createHedge(random));
  return { group, colliders };
}
