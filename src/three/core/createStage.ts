import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { areScenesPaused, onScenesPausedChange } from '@/lib/scenePause';
import { getScrollProgress } from '@/lib/scroll';
import { disposeObject } from './dispose';
import { clamp } from './math';
import type { FrameState, SceneFactory, ScenePointer, Stage, StageOptions } from './types';

const MAX_DELTA = 1 / 20;

/**
 * Creates a WebGL renderer for a canvas and runs a scene factory inside it.
 * Handles sizing, pointer input, pausing when hidden or off-screen,
 * WebGL context loss, reduced motion and full cleanup.
 *
 * Throws if WebGL cannot be initialised so the caller can show a fallback.
 */
export function createStage(
  canvas: HTMLCanvasElement,
  factory: SceneFactory,
  {
    pointerSpace = 'element',
    reducedMotion = false,
    maxPixelRatio = 1.75,
    environment = true,
    onStatus,
  }: StageOptions = {},
): Stage {
  const compact = window.matchMedia('(max-width: 720px)').matches;

  const renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: true,
    antialias: true,
    powerPreference: 'default',
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, compact ? 1.5 : maxPixelRatio));
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.NeutralToneMapping;

  const scene = new THREE.Scene();
  let environmentMap: THREE.Texture | null = null;
  if (environment) {
    const pmrem = new THREE.PMREMGenerator(renderer);
    const room = new RoomEnvironment();
    environmentMap = pmrem.fromScene(room, 0.04).texture;
    scene.environment = environmentMap;
    scene.environmentIntensity = 0.55;
    disposeObject(room);
    pmrem.dispose();
  }

  const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 200);
  camera.position.set(0, 0, 8);

  const controller = factory({
    scene,
    camera,
    compact,
    report: (status) => onStatus?.(status),
    setCursor: (cursor) => {
      canvas.style.cursor = cursor;
    },
  });

  const targetPointer = new THREE.Vector2();
  const frame: FrameState = {
    time: 0,
    delta: 0,
    pointer: new THREE.Vector2(),
    scroll: getScrollProgress(),
  };

  let raf = 0;
  let lastTime = 0;
  let active = false;
  let disposed = false;

  const renderFrame = (delta: number) => {
    frame.delta = delta;
    frame.time += delta;
    frame.pointer.lerp(targetPointer, delta > 0 ? 1 - Math.exp(-4 * delta) : 1);
    frame.scroll = getScrollProgress();
    controller.update(frame);
    renderer.render(scene, camera);
  };

  const loop = (now: number) => {
    raf = requestAnimationFrame(loop);
    const delta = lastTime ? Math.min((now - lastTime) / 1000, MAX_DELTA) : 1 / 60;
    lastTime = now;
    renderFrame(delta);
  };

  const canRun = () =>
    active && !disposed && !document.hidden && !reducedMotion && !areScenesPaused();

  const start = () => {
    if (raf || !canRun()) return;
    lastTime = 0;
    raf = requestAnimationFrame(loop);
  };

  const stop = () => {
    cancelAnimationFrame(raf);
    raf = 0;
  };

  const renderStill = () => {
    if (disposed) return;
    // Let the scene settle into a pleasant resting pose before the still frame.
    if (reducedMotion && frame.time === 0) {
      for (let i = 0; i < 150; i += 1) {
        frame.delta = 1 / 60;
        frame.time += 1 / 60;
        controller.update(frame);
      }
    }
    renderFrame(0);
  };

  const resize = () => {
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    if (!width || !height || disposed) return;
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    controller.resize?.(width, height);
    if (!raf) renderStill();
  };

  // ---- Pointer input -------------------------------------------------------
  const raycaster = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  let pressed = false;

  const trackSmoothedPointer = (event: PointerEvent) => {
    if (pointerSpace === 'viewport') {
      targetPointer.set(
        (event.clientX / window.innerWidth) * 2 - 1,
        -((event.clientY / window.innerHeight) * 2 - 1),
      );
      return;
    }
    const bounds = canvas.getBoundingClientRect();
    targetPointer.set(
      clamp(((event.clientX - bounds.left) / bounds.width) * 2 - 1, -1.5, 1.5),
      clamp(-(((event.clientY - bounds.top) / bounds.height) * 2 - 1), -1.5, 1.5),
    );
  };

  const dispatch = (type: ScenePointer['type'], event: PointerEvent) => {
    if (!controller.onPointer || reducedMotion || disposed) return;
    const bounds = canvas.getBoundingClientRect();
    ndc.set(
      ((event.clientX - bounds.left) / bounds.width) * 2 - 1,
      -(((event.clientY - bounds.top) / bounds.height) * 2 - 1),
    );
    raycaster.setFromCamera(ndc, camera);
    controller.onPointer({ type, ndc, raycaster, pressed, pointerType: event.pointerType });
  };

  const handleWindowPointer = (event: PointerEvent) => {
    if (!reducedMotion) trackSmoothedPointer(event);
  };

  const handleDown = (event: PointerEvent) => {
    pressed = true;
    if (controller.onPointer && event.pointerType !== 'touch') {
      canvas.setPointerCapture(event.pointerId);
    }
    dispatch('down', event);
  };

  const handleMove = (event: PointerEvent) => dispatch('move', event);

  const handleUp = (event: PointerEvent) => {
    if (!pressed) return;
    pressed = false;
    if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId);
    dispatch('up', event);
  };

  // ---- Lifecycle -----------------------------------------------------------
  const handleVisibility = () => (document.hidden ? stop() : start());

  const handleContextLost = (event: Event) => {
    event.preventDefault();
    stop();
  };

  const handleContextRestored = () => {
    resize();
    start();
  };

  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(canvas);
  window.addEventListener('pointermove', handleWindowPointer, { passive: true });
  canvas.addEventListener('pointerdown', handleDown);
  canvas.addEventListener('pointermove', handleMove);
  canvas.addEventListener('pointerup', handleUp);
  canvas.addEventListener('pointercancel', handleUp);
  document.addEventListener('visibilitychange', handleVisibility);
  canvas.addEventListener('webglcontextlost', handleContextLost);
  canvas.addEventListener('webglcontextrestored', handleContextRestored);
  const unsubscribePause = onScenesPausedChange((paused) => (paused ? stop() : start()));
  resize();
  renderStill();

  return {
    setActive(next) {
      active = next;
      if (next) start();
      else stop();
    },
    reset() {
      controller.reset?.();
      if (!raf) renderStill();
    },
    dispose() {
      disposed = true;
      stop();
      unsubscribePause();
      resizeObserver.disconnect();
      window.removeEventListener('pointermove', handleWindowPointer);
      canvas.removeEventListener('pointerdown', handleDown);
      canvas.removeEventListener('pointermove', handleMove);
      canvas.removeEventListener('pointerup', handleUp);
      canvas.removeEventListener('pointercancel', handleUp);
      document.removeEventListener('visibilitychange', handleVisibility);
      canvas.removeEventListener('webglcontextlost', handleContextLost);
      canvas.removeEventListener('webglcontextrestored', handleContextRestored);
      canvas.style.cursor = '';
      controller.dispose?.();
      disposeObject(scene);
      environmentMap?.dispose();
      renderer.dispose();
    },
  };
}
