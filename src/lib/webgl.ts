let cached: boolean | undefined;

/** Detects WebGL support once and caches the answer for the session. */
export function isWebGLAvailable(): boolean {
  if (cached !== undefined) return cached;
  if (typeof document === 'undefined') return false;
  try {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('webgl2') ?? canvas.getContext('webgl');
    cached = Boolean(context);
    const lose = context?.getExtension('WEBGL_lose_context');
    lose?.loseContext();
  } catch {
    cached = false;
  }
  return cached;
}

/** Marks WebGL as unavailable, e.g. after renderer creation fails. */
export function markWebGLUnavailable(): void {
  cached = false;
}
