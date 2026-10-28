import type { ReactNode } from 'react';
import { Doodle } from './Doodle';
import styles from './SectionHeading.module.css';

interface SectionHeadingProps {
  id: string;
  /** Short handwritten note above the title. */
  note: string;
  title: ReactNode;
  intro?: ReactNode;
}

/** Handwritten note + large title + optional intro, shared by every section. */
export function SectionHeading({ id, note, title, intro }: SectionHeadingProps) {
  return (
    <div className={styles.head} data-reveal>
      <p className={`hand ${styles.note}`}>
        {note}
        <Doodle kind="squiggle" className={styles.squiggle} />
      </p>
      <h2 id={id} className={`display ${styles.title}`}>
        {title}
      </h2>
      {intro ? <p className={styles.intro}>{intro}</p> : null}
    </div>
  );
}
