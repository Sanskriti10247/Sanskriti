import type { DriveIntent, TouchControl } from './types';

const KEYS = {
  up: ['ArrowUp', 'KeyW'],
  down: ['ArrowDown', 'KeyS'],
  left: ['ArrowLeft', 'KeyA'],
  right: ['ArrowRight', 'KeyD'],
  drift: ['Space', 'ShiftLeft', 'ShiftRight'],
};
const ALL_KEYS = new Set(Object.values(KEYS).flat());

export interface DriveInput {
  read(): DriveIntent;
  setTouch(control: TouchControl, pressed: boolean): void;
  clear(): void;
  dispose(): void;
}

/** Merges keyboard (arrows / WASD / space) and on-screen touch buttons into one intent. */
export function createInput(onRestart: () => void): DriveInput {
  const keys = new Set<string>();
  const touch = new Set<TouchControl>();

  const handleDown = (event: KeyboardEvent) => {
    if (event.code === 'KeyR') {
      onRestart();
      return;
    }
    if (!ALL_KEYS.has(event.code)) return;
    event.preventDefault();
    keys.add(event.code);
  };
  const handleUp = (event: KeyboardEvent) => keys.delete(event.code);
  const handleBlur = () => keys.clear();

  window.addEventListener('keydown', handleDown);
  window.addEventListener('keyup', handleUp);
  window.addEventListener('blur', handleBlur);

  const held = (codes: string[]) => codes.some((code) => keys.has(code));

  return {
    read() {
      const up = held(KEYS.up) || touch.has('gas');
      const down = held(KEYS.down) || touch.has('brake');
      const left = held(KEYS.left) || touch.has('left');
      const right = held(KEYS.right) || touch.has('right');
      return {
        throttle: Number(up) - Number(down),
        steer: Number(left) - Number(right),
        drift: held(KEYS.drift) || touch.has('drift'),
      };
    },
    setTouch(control, pressed) {
      if (pressed) touch.add(control);
      else touch.delete(control);
    },
    clear() {
      keys.clear();
      touch.clear();
    },
    dispose() {
      window.removeEventListener('keydown', handleDown);
      window.removeEventListener('keyup', handleUp);
      window.removeEventListener('blur', handleBlur);
    },
  };
}
