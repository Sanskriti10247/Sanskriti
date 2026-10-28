import { useState } from 'react';
import { isWebGLAvailable } from '@/lib/webgl';

/** Returns whether this browser can create a WebGL context. */
export function useWebGLSupport(): boolean {
  const [supported] = useState(isWebGLAvailable);
  return supported;
}
