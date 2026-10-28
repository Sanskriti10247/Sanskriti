import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { clamp, damp, disposeObject, palette } from '@/three/core';
import { CAR, GAME } from './config';
import { createBoostPads } from './entities/boostPads';
import { createCar } from './entities/car';
import { createCollectibles } from './entities/collectibles';
import { createCones } from './entities/cones';
import { createParticles } from './entities/particles';
import { createInput } from './input';
import { drawMinimap } from './minimap';
import type { DriveGame, DriveIntent, GamePhase, HudState } from './types';
import { createScenery } from './world/scenery';
import { createTrack } from './world/track';

const SKY = '#fff1f5';
const IDLE: DriveIntent = { throttle: 0, steer: 0, drift: false };

function readBest(): number {
  try {
    return Number(window.localStorage.getItem(GAME.bestScoreKey)) || 0;
  } catch {
    return 0;
  }
}

function saveBest(score: number) {
  try {
    window.localStorage.setItem(GAME.bestScoreKey, String(score));
  } catch {
    // Storage can be unavailable (private mode); the best score just won't persist.
  }
}

/**
 * Pink Drive: a little island with a looping road. Drive the toy car around and
 * collect as many hearts as you can before the timer runs out. Throws if WebGL
 * can't be created, so the caller can show a fallback.
 */
export function createDriveGame(
  canvas: HTMLCanvasElement,
  minimap: HTMLCanvasElement | null,
  onHud: (state: HudState) => void,
): DriveGame {
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    powerPreference: 'high-performance',
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(SKY);
  scene.fog = new THREE.Fog(SKY, 60, 150);
  const pmrem = new THREE.PMREMGenerator(renderer);
  const environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  pmrem.dispose();
  scene.environment = environment;
  scene.environmentIntensity = 0.45;

  const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 400);
  camera.position.set(0, 30, 50);

  scene.add(new THREE.HemisphereLight('#ffffff', palette.blush, 1.3));
  const sun = new THREE.DirectionalLight('#fff4ec', 2.1);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, {
    left: -34,
    right: 34,
    top: 34,
    bottom: -34,
    near: 1,
    far: 120,
  });
  sun.shadow.bias = -0.0004;
  sun.shadow.normalBias = 0.03;
  scene.add(sun, sun.target);

  // World
  const track = createTrack();
  const { group: scenery, colliders } = createScenery(track);
  const car = createCar();
  const pickups = createCollectibles(track, colliders);
  const cones = createCones(track);
  const pads = createBoostPads(track);
  const particles = createParticles();
  scene.add(scenery, car.group, pickups.group, cones.group, pads.group, particles.mesh);

  const startSample = track.sample(0);
  const startHeading = Math.atan2(startSample.tangent.x, startSample.tangent.z);

  // State
  let phase: GamePhase = 'intro';
  let score = 0;
  let best = readBest();
  let newBest = false;
  let timeLeft: number = GAME.roundSeconds;
  let countdown: number = GAME.countdownSeconds;
  let shake = 0;
  let emitTimer = 0;
  let frame = 0;
  let elapsed = 0;
  let lastHud = '';

  const cameraTarget = new THREE.Vector3();
  const lookTarget = new THREE.Vector3();
  const lookCurrent = new THREE.Vector3();
  const forward = new THREE.Vector3();
  const side = new THREE.Vector3();
  const normal = new THREE.Vector3();
  const emitPoint = new THREE.Vector3();

  const resetRound = () => {
    score = 0;
    newBest = false;
    timeLeft = GAME.roundSeconds;
    countdown = GAME.countdownSeconds;
    car.place(startSample.point, startHeading);
    cones.reset();
    particles.clear();
    pickups.reset(car.position);
  };
  resetRound();

  const input = createInput(() => {
    if (phase === 'playing' || phase === 'over') {
      resetRound();
      phase = 'countdown';
    }
  });

  const publishHud = () => {
    const state: HudState = {
      phase,
      score,
      best,
      timeLeft: Math.max(0, Math.ceil(timeLeft)),
      countdown: Math.ceil(countdown),
      boosting: car.boost > 0,
      newBest,
    };
    const key = JSON.stringify(state);
    if (key !== lastHud) {
      lastHud = key;
      onHud(state);
    }
  };

  const resize = () => {
    const parent = canvas.parentElement ?? canvas;
    const width = Math.max(1, parent.clientWidth);
    const height = Math.max(1, parent.clientHeight);
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  };
  resize();
  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(canvas.parentElement ?? canvas);

  const solveCollisions = () => {
    for (const collider of colliders) {
      const dx = car.position.x - collider.x;
      const dz = car.position.z - collider.z;
      const minimum = collider.radius + CAR.radius;
      const distanceSq = dx * dx + dz * dz;
      if (distanceSq >= minimum * minimum) continue;
      const distance = Math.sqrt(distanceSq) || 0.001;
      normal.set(dx / distance, 0, dz / distance);
      car.position.addScaledVector(normal, minimum - distance);
      const impact = car.bounce(normal);
      if (impact > 3) {
        shake = Math.min(1, impact / 18);
        emitPoint.copy(car.position).addScaledVector(normal, -CAR.radius).setY(0.6);
        particles.emit(emitPoint, { color: palette.cream, count: 10, speed: 4, lift: 2 });
      }
    }
    const fromCentre = Math.hypot(car.position.x, car.position.z);
    if (fromCentre > GAME.driveRadius) {
      normal.set(-car.position.x / fromCentre, 0, -car.position.z / fromCentre);
      car.position.addScaledVector(normal, fromCentre - GAME.driveRadius);
      const impact = car.bounce(normal);
      if (impact > 3) shake = Math.min(1, impact / 18);
    }
  };

  const emitEffects = (onRoad: boolean, delta: number) => {
    emitTimer -= delta;
    if (emitTimer > 0) return;
    emitTimer = 0.04;
    car.forward(forward);
    side.set(forward.z, 0, -forward.x);
    const moving = Math.abs(car.speed) > 5;
    const rear = (offset: number) =>
      emitPoint
        .copy(car.position)
        .addScaledVector(forward, -1.6)
        .addScaledVector(side, offset)
        .setY(0.3);
    if (car.slip > 3.5 && moving) {
      for (const offset of [-1, 1]) {
        particles.emit(rear(offset), {
          color: '#ffffff',
          count: 1,
          speed: 0.6,
          lift: 1,
          size: 0.45,
          life: 0.9,
          gravity: -0.5,
        });
      }
    }
    if (!onRoad && moving && Math.random() < 0.6) {
      particles.emit(rear(Math.random() - 0.5), {
        color: palette.pink,
        count: 1,
        speed: 1.2,
        lift: 1.5,
        size: 0.3,
        life: 0.6,
      });
    }
    if (car.boost > 0) {
      particles.emit(rear(0), {
        color: Math.random() < 0.5 ? palette.mint : palette.butter,
        count: 2,
        speed: 1.5,
        lift: 0.8,
        size: 0.22,
        life: 0.5,
        gravity: 1,
      });
    }
  };

  const updateCamera = (delta: number, time: number) => {
    if (phase === 'intro') {
      const angle = time * 0.12 + 0.8;
      cameraTarget.set(Math.cos(angle) * 52, 30, Math.sin(angle) * 52);
      lookTarget.set(0, 0, 0);
      camera.position.lerp(cameraTarget, 1 - Math.exp(-2 * delta));
    } else {
      car.forward(forward);
      const speed = Math.abs(car.speed);
      cameraTarget
        .copy(car.position)
        .addScaledVector(forward, -(9.5 + speed * 0.08))
        .setY(4.4 + speed * 0.03);
      lookTarget.copy(car.position).addScaledVector(forward, 4).setY(1.2);
      camera.position.lerp(cameraTarget, 1 - Math.exp(-4.5 * delta));
    }
    lookCurrent.lerp(lookTarget, 1 - Math.exp(-6 * delta));
    if (shake > 0) {
      camera.position.x += (Math.random() - 0.5) * shake * 0.6;
      camera.position.y += (Math.random() - 0.5) * shake * 0.6;
      shake = Math.max(0, shake - delta * 3);
    }
    camera.lookAt(lookCurrent);
    const fov = 55 + clamp(Math.abs(car.speed) / CAR.roadMaxSpeed) * 7 + (car.boost > 0 ? 6 : 0);
    if (Math.abs(camera.fov - fov) > 0.05) {
      camera.fov = damp(camera.fov, fov, 4, delta);
      camera.updateProjectionMatrix();
    }
    sun.position
      .copy(phase === 'intro' ? lookCurrent : car.position)
      .add(new THREE.Vector3(18, 32, 12));
    sun.target.position.copy(phase === 'intro' ? lookCurrent : car.position);
  };

  const finishRound = () => {
    phase = 'over';
    if (score > best) {
      best = score;
      newBest = true;
      saveBest(score);
    }
  };

  const timer = new THREE.Timer();
  let raf = 0;

  const tick = (now: number) => {
    raf = requestAnimationFrame(tick);
    timer.update(now);
    const delta = Math.min(timer.getDelta(), 1 / 30);
    elapsed += delta;
    frame += 1;

    if (phase === 'countdown') {
      countdown -= delta;
      if (countdown <= 0) {
        countdown = 0;
        phase = 'playing';
      }
    } else if (phase === 'playing') {
      timeLeft -= delta;
      if (timeLeft <= 0) {
        timeLeft = 0;
        finishRound();
      }
    }

    const onRoad = track.distanceToRoad(car.position.x, car.position.z) < GAME.roadWidth / 2 + 0.5;
    const intent = phase === 'playing' ? input.read() : IDLE;
    if (phase !== 'intro') {
      car.step(intent, onRoad, delta);
      solveCollisions();
      if (pads.update(delta, car.position) && phase === 'playing') car.boost = CAR.boostSeconds;
      const hits = cones.update(delta, car.position, car.velocity);
      if (hits > 0) {
        emitPoint.copy(car.position).setY(0.8);
        particles.emit(emitPoint, { color: palette.peach, count: 8 * hits, speed: 5, lift: 4 });
        shake = Math.max(shake, 0.25);
      }
      emitEffects(onRoad, delta);
    }

    const picked = pickups.update(elapsed, delta, car.position);
    if (phase === 'playing') {
      for (const pickup of picked) {
        score += pickup.value;
        emitPoint.copy(pickup.group.position).setY(1.4);
        const isStar = pickup.value > 1;
        particles.emit(emitPoint, {
          color: isStar ? palette.butter : palette.rose,
          count: isStar ? 26 : 16,
          speed: 6,
          lift: 5,
          size: 0.22,
          life: 0.9,
        });
        particles.emit(emitPoint, { color: palette.pink, count: 8, speed: 3, lift: 6, size: 0.18 });
      }
    }

    particles.update(delta);
    updateCamera(delta, elapsed);
    renderer.render(scene, camera);
    if (minimap && frame % 3 === 0) drawMinimap(minimap, track, pickups, car);
    publishHud();
  };
  raf = requestAnimationFrame(tick);

  return {
    start() {
      if (phase !== 'intro') return;
      resetRound();
      phase = 'countdown';
    },
    restart() {
      resetRound();
      phase = 'countdown';
    },
    setTouch(control, pressed) {
      input.setTouch(control, pressed);
    },
    dispose() {
      cancelAnimationFrame(raf);
      timer.dispose();
      resizeObserver.disconnect();
      input.dispose();
      disposeObject(scene);
      environment.dispose();
      renderer.dispose();
    },
  };
}
