import { SectionHeading } from '@/components/ui/SectionHeading';
import { experience } from '@/content';
import styles from './Experience.module.css';

export function Experience() {
  return (
    <section className="section" id="journey" aria-labelledby="journey-heading">
      <div className="wrap">
        <SectionHeading
          id="journey-heading"
          note="where I've been"
          title="The journey so far"
          intro="From the classroom to internships: learning the fundamentals, shipping real interfaces and testing AI products."
        />
        <ol className={styles.timeline}>
          {experience.map((entry, index) => (
            <li
              className={`${styles.entry} ${entry.current ? styles.current : ''}`}
              key={entry.role}
              data-reveal
              data-reveal-delay={index + 1}
            >
              <span className={styles.dot} aria-hidden="true" />
              <div className={`card ${styles.card}`}>
                <div className={styles.when}>
                  <span className={styles.period}>{entry.period}</span>
                  {entry.current ? <span className={`hand ${styles.now}`}>right now!</span> : null}
                </div>
                <h3 className={`display ${styles.role}`}>{entry.role}</h3>
                <p className={styles.organisation}>{entry.organisation}</p>
                {entry.summary ? <p className={styles.summary}>{entry.summary}</p> : null}
                {entry.meta ? (
                  <ul className={styles.meta}>
                    {entry.meta.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                ) : null}
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
