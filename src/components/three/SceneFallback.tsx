import styles from './SceneFallback.module.css';

/** Static, CSS-only toy pile shown when the browser cannot render WebGL. */
export function SceneFallback() {
  return (
    <div className={styles.fallback} aria-hidden="true">
      <span className={`${styles.toy} ${styles.ball}`} />
      <span className={`${styles.toy} ${styles.cube}`} />
      <span className={`${styles.toy} ${styles.pill}`} />
      <span className={`${styles.toy} ${styles.heart}`}>&#9829;</span>
    </div>
  );
}
