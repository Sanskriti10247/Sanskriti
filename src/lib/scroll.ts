/**
 * A tiny shared scroll store. One passive listener feeds every consumer
 * (React hooks and Three.js stages) so the page never stacks scroll handlers.
 */
type Listener = () => void;

const listeners = new Set<Listener>();
let progress = 0;
let attached = false;
let frame = 0;

function measure(): number {
  const doc = document.documentElement;
  const max = doc.scrollHeight - window.innerHeight;
  return max > 0 ? Math.min(Math.max(window.scrollY / max, 0), 1) : 0;
}

function schedule() {
  if (frame) return;
  frame = requestAnimationFrame(() => {
    frame = 0;
    const next = measure();
    if (next === progress) return;
    progress = next;
    listeners.forEach((listener) => listener());
  });
}

function ensureAttached() {
  if (attached || typeof window === 'undefined') return;
  attached = true;
  progress = measure();
  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', schedule);
}

/** Current page scroll progress from 0 (top) to 1 (bottom). */
export function getScrollProgress(): number {
  ensureAttached();
  return progress;
}

export function subscribeToScroll(listener: Listener): () => void {
  ensureAttached();
  listeners.add(listener);
  return () => listeners.delete(listener);
}
