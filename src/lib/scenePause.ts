type Listener = (paused: boolean) => void;

let paused = false;
const listeners = new Set<Listener>();

/**
 * Pauses every decorative page scene (backdrop, toy box, paper plane),
 * e.g. while the full-screen game is open, so only one scene uses the GPU.
 */
export function setScenesPaused(next: boolean): void {
  if (next === paused) return;
  paused = next;
  listeners.forEach((listener) => listener(paused));
}

export function areScenesPaused(): boolean {
  return paused;
}

export function onScenesPausedChange(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
