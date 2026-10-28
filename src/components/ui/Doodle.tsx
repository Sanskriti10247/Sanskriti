import styles from './Doodle.module.css';

export type DoodleKind = 'sparkle' | 'heart' | 'squiggle' | 'swirl';

const paths: Record<DoodleKind, { viewBox: string; d: string; stroke?: boolean }> = {
  sparkle: {
    viewBox: '0 0 24 24',
    d: 'M12 1.5c.9 6.6 3 8.7 10.5 10.5C15 13.8 12.9 15.9 12 22.5 11.1 15.9 9 13.8 1.5 12 9 10.2 11.1 8.1 12 1.5Z',
  },
  heart: {
    viewBox: '0 0 24 24',
    d: 'M12 21C5.2 15.6 2 12 2 8.2A4.9 4.9 0 0 1 12 6a4.9 4.9 0 0 1 10 2.2C22 12 18.8 15.6 12 21Z',
  },
  squiggle: {
    viewBox: '0 0 64 14',
    d: 'M2 9c5-7 9-7 13 0s9 7 13 0 9-7 13 0 9 7 13 0 6-6 8-4',
    stroke: true,
  },
  swirl: {
    viewBox: '0 0 40 40',
    d: 'M20 21c0-2 2.6-2.6 3.6-.8 1.6 2.8-1.6 6-5 5.2-4.6-1-5.6-7-2.2-10.4 4.4-4.4 12-2.6 13.8 3.4 2 7-4 13.6-11.2 13',
    stroke: true,
  },
};

interface DoodleProps {
  kind: DoodleKind;
  className?: string;
  /** Gently bob up and down. */
  float?: boolean;
}

/** Small hand-drawn mark used to decorate headings and cards. Always decorative. */
export function Doodle({ kind, className = '', float = false }: DoodleProps) {
  const { viewBox, d, stroke } = paths[kind];
  return (
    <svg
      viewBox={viewBox}
      className={`${styles.doodle} ${stroke ? styles.stroke : styles.fill} ${float ? styles.float : ''} ${className}`}
      aria-hidden="true"
      focusable="false"
    >
      <path d={d} />
    </svg>
  );
}
