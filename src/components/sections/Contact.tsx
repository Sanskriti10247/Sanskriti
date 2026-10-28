import { useState } from 'react';
import { ArrowUpRight, Github, Mail } from 'lucide-react';
import { ThreeCanvas } from '@/components/three/ThreeCanvas';
import { profile } from '@/content';
import { paperPlaneScene } from '@/three/scenes';
import styles from './Contact.module.css';

export function Contact() {
  const [planes, setPlanes] = useState('');

  return (
    <section className="section" id="contact" aria-labelledby="contact-heading">
      <div className={`wrap card ${styles.panel}`} data-reveal>
        <div className={styles.copy}>
          <p className="hand">don&rsquo;t be shy</p>
          <h2 id="contact-heading" className={`display ${styles.title}`}>
            Say <span className="highlight">hi!</span>
          </h2>
          <p className={styles.text}>
            Whether it&rsquo;s computer vision, a tricky search problem, or a project you think
            I&rsquo;d enjoy, my inbox is open.
          </p>
          <div className={styles.links}>
            <a
              className="button button-primary"
              href={`mailto:${profile.email}`}
              data-testid="link-email"
            >
              <Mail size={16} aria-hidden="true" /> {profile.email}
            </a>
            <a
              className="button"
              href={profile.github}
              target="_blank"
              rel="noreferrer"
              data-testid="link-github"
            >
              <Github size={16} aria-hidden="true" /> @{profile.githubHandle}
              <ArrowUpRight size={14} aria-hidden="true" />
            </a>
          </div>
        </div>
        <div className={styles.visual}>
          <ThreeCanvas
            scene={paperPlaneScene}
            label="A folded paper plane. Tap anywhere around it to throw it."
            interaction="tap"
            onStatus={setPlanes}
          />
          <p className={`hand ${styles.hint}`} aria-hidden="true">
            tap to throw a paper plane
          </p>
          <span className={styles.count} aria-live="polite">
            {planes}
          </span>
        </div>
      </div>
    </section>
  );
}
