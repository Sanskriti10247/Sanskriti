import { SectionHeading } from '@/components/ui/SectionHeading';
import { recognition } from '@/content';
import styles from './Recognition.module.css';

export function Recognition() {
  return (
    <section className="section" id="wins" aria-labelledby="wins-heading">
      <div className="wrap">
        <SectionHeading id="wins-heading" note="a few happy moments" title="Little wins" />
        <ul className={styles.grid}>
          {recognition.map((item, index) => (
            <li className={styles.badge} key={item.title} data-reveal data-reveal-delay={index + 1}>
              <span className={styles.ribbon} aria-hidden="true" />
              <h3 className={`display ${styles.title}`}>{item.title}</h3>
              <p className={styles.detail}>{item.detail}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
