import { Doodle } from '@/components/ui/Doodle';
import { about } from '@/content';
import styles from './Ribbon.module.css';

/** A tilted strip of washi-style tape with the things I love scrolling across it. */
export function Ribbon() {
  const words = about.ribbon;

  return (
    <div className={styles.ribbon}>
      <p className="visually-hidden">Things I love: {words.join(', ')}.</p>
      <div className={styles.track} aria-hidden="true">
        {/* Two identical copies make the loop seamless. */}
        {[0, 1].map((copy) => (
          <ul className={styles.list} key={copy}>
            {words.map((word) => (
              <li key={word}>
                {word}
                <Doodle kind="sparkle" className={styles.sparkle} />
              </li>
            ))}
          </ul>
        ))}
      </div>
    </div>
  );
}
