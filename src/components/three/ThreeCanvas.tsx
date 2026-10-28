import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useInView } from '@/hooks/useInView';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { useWebGLSupport } from '@/hooks/useWebGLSupport';
import { markWebGLUnavailable } from '@/lib/webgl';
import { createStage, type PointerSpace, type SceneFactory, type Stage } from '@/three/core';
import { SceneFallback } from './SceneFallback';
import styles from './ThreeCanvas.module.css';

/** How the canvas should treat touches: let the page scroll, take taps, or take drags. */
type Interaction = 'none' | 'tap' | 'drag';

interface ThreeCanvasProps {
  /** Builds the scene. Must be a stable reference (module-level factory). */
  scene: SceneFactory;
  /** Accessible description of what the visual shows. */
  label: string;
  className?: string;
  pointerSpace?: PointerSpace;
  interaction?: Interaction;
  /** Receives short status text from the scene, e.g. a counter. */
  onStatus?: (status: string) => void;
  /** Change this number to ask the scene to reset itself. */
  resetKey?: number;
  /** Rendered instead of the canvas when WebGL is unavailable. */
  fallback?: ReactNode;
  /** Hide from assistive technology when purely decorative. */
  decorative?: boolean;
}

/**
 * Mounts a Three.js scene into a canvas. The renderer is created lazily when
 * the canvas first nears the viewport, paused whenever it leaves, rendered as
 * a still frame for reduced motion, and disposed on unmount.
 */
export function ThreeCanvas({
  scene,
  label,
  className,
  pointerSpace = 'element',
  interaction = 'none',
  onStatus,
  resetKey = 0,
  fallback,
  decorative = false,
}: ThreeCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stageRef = useRef<Stage | null>(null);
  const statusRef = useRef(onStatus);
  const supported = useWebGLSupport();
  const reducedMotion = useReducedMotion();
  const nearViewport = useInView(canvasRef, { rootMargin: '250px 0px' });
  const [failed, setFailed] = useState(false);
  const [mounted, setMounted] = useState(false);

  if (nearViewport && !mounted) setMounted(true);

  useEffect(() => {
    statusRef.current = onStatus;
  }, [onStatus]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !mounted || !supported) return;
    try {
      stageRef.current = createStage(canvas, scene, {
        pointerSpace,
        reducedMotion,
        onStatus: (status) => statusRef.current?.(status),
      });
    } catch (error) {
      console.warn('3D scene unavailable, showing fallback.', error);
      markWebGLUnavailable();
      // Renderer creation is the external system failing; switching to the fallback is the sync.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFailed(true);
      return;
    }
    return () => {
      stageRef.current?.dispose();
      stageRef.current = null;
    };
  }, [mounted, supported, scene, pointerSpace, reducedMotion]);

  useEffect(() => {
    stageRef.current?.setActive(nearViewport);
  }, [nearViewport, mounted, reducedMotion]);

  const firstReset = useRef(resetKey);
  useEffect(() => {
    if (resetKey !== firstReset.current) stageRef.current?.reset();
  }, [resetKey]);

  const classes = [styles.root, className].filter(Boolean).join(' ');

  if (!supported || failed) {
    return (
      <div
        className={classes}
        role={decorative ? undefined : 'img'}
        aria-label={decorative ? undefined : label}
        aria-hidden={decorative || undefined}
      >
        {fallback ?? <SceneFallback />}
      </div>
    );
  }

  return (
    <div className={classes}>
      <canvas
        ref={canvasRef}
        className={`${styles.canvas} ${styles[interaction]}`}
        role={decorative ? undefined : 'img'}
        aria-label={decorative ? undefined : label}
        aria-hidden={decorative || undefined}
      />
    </div>
  );
}
