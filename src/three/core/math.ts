/** Clamp a value into [min, max]. */
export const clamp = (value: number, min = 0, max = 1) => Math.min(Math.max(value, min), max);

/** Hermite smoothstep between two edges. */
export function smoothstep(edge0: number, edge1: number, value: number): number {
  const t = clamp((value - edge0) / (edge1 - edge0));
  return t * t * (3 - 2 * t);
}

/** Frame-rate independent exponential smoothing toward a target. */
export const damp = (current: number, target: number, lambda: number, delta: number) =>
  current + (target - current) * (1 - Math.exp(-lambda * delta));

/** Ease in-out cubic, 0..1. */
export const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

/** Small deterministic PRNG (mulberry32) so layouts look the same on every visit. */
export function seededRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Approximately normal random value (mean 0, sd 1) from a uniform source. */
export function gaussian(random: () => number): number {
  const u = Math.max(random(), 1e-6);
  const v = random();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

/** Ease out with a little overshoot, 0..1. Nice for things popping into place. */
export function easeOutBack(t: number): number {
  const c = 1.70158;
  const x = clamp(t) - 1;
  return 1 + (c + 1) * x * x * x + c * x * x;
}

/** Height and width of the camera's view at a given distance from it. */
export function visibleSize(
  fovDegrees: number,
  aspect: number,
  distance: number,
): { width: number; height: number } {
  const height = 2 * distance * Math.tan((fovDegrees * Math.PI) / 360);
  return { width: height * aspect, height };
}

/** Fisher–Yates shuffle into a new array. */
export function shuffle<T>(items: readonly T[], random: () => number = Math.random): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/** Random number in [min, max). */
export const between = (min: number, max: number, random: () => number = Math.random) =>
  min + (max - min) * random();
