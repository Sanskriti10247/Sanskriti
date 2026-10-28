import { BookOpen, Laptop, Music2 } from 'lucide-react';
import { Doodle } from '@/components/ui/Doodle';
import { about, type HobbyId } from '@/content';
import styles from './About.module.css';

const hobbyIcons: Record<HobbyId, typeof BookOpen> = {
  dancing: Music2,
  reading: BookOpen,
  coding: Laptop,
};

export function About() {
  return (
    <section className="section" id="about" aria-labelledby="about-heading">
      <div className="wrap">
        <div className={styles.layout}>
          <div className={styles.copy} data-reveal>
            <p className="hand">a bit about me</p>
            <h2 id="about-heading" className={`display ${styles.title}`}>
              I like the moment an idea has to <span className="highlight">actually work.</span>
            </h2>
            <p>
              Hi, I&rsquo;m Sanskriti! I study computer science at Scaler School of Technology, in
              collaboration with BITS Pilani. Most of what I build sits somewhere in AI and machine
              learning: computer vision, NLP and evaluating how well language models really do,
              backed by solid software engineering.
            </p>
            <p>
              I&rsquo;ve worked on AI-powered projects, contributed to open source and done software
              development internships. Along the way I&rsquo;ve learned to love the careful parts
              too: debugging, research, technical writing, and reading complex information closely
              until it makes sense.
            </p>
            <ul className={styles.strengths} aria-label="Strengths">
              {about.strengths.map((strength) => (
                <li key={strength}>{strength}</li>
              ))}
            </ul>
          </div>

          <aside className={`card ${styles.facts}`} data-reveal data-reveal-delay="1">
            <span className="tape" aria-hidden="true" />
            <p className={`hand ${styles.cardTitle}`}>quick facts</p>
            <dl className={styles.factList}>
              {about.facts.map((fact) => (
                <div key={fact.label}>
                  <dd className="display">{fact.value}</dd>
                  <dt>{fact.label}</dt>
                </div>
              ))}
            </dl>
            <p className={`hand ${styles.motto}`}>
              &ldquo;make the interesting thing work, then make it trustworthy.&rdquo;
            </p>
          </aside>
        </div>

        <div className={styles.extras}>
          <div className={`card ${styles.hobbies}`} data-reveal>
            <Doodle kind="heart" float className={styles.cornerHeart} />
            <p className={`hand ${styles.cardTitle}`}>off the clock</p>
            <ul className={styles.hobbyList}>
              {about.hobbies.map(({ id, label }) => {
                const Icon = hobbyIcons[id];
                return (
                  <li key={id} className={styles[id]}>
                    <span className={styles.hobbyIcon} aria-hidden="true">
                      <Icon size={22} strokeWidth={2.2} />
                    </span>
                    {label}
                  </li>
                );
              })}
            </ul>
          </div>

          <div className={`card ${styles.interests}`} data-reveal data-reveal-delay="1">
            <Doodle kind="sparkle" float className={styles.cornerSparkle} />
            <p className={`hand ${styles.cardTitle}`}>things I&rsquo;m curious about</p>
            <ul className={styles.interestList}>
              {about.interests.map((interest) => (
                <li key={interest}>{interest}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
