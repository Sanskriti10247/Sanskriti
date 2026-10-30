import { lazy, Suspense, useCallback, useState } from 'react';
import { ArrowDown, FileText, Github, RotateCcw } from 'lucide-react';
import { ThreeCanvas } from '@/components/three/ThreeCanvas';
import { Doodle } from '@/components/ui/Doodle';
import { profile } from '@/content';
import { toyBoxScene } from '@/three/scenes';
import styles from './Hero.module.css';

// The game (and its 3D world) only downloads when someone opens it.
const DriveGameOverlay = lazy(() => import('@/components/game/DriveGameOverlay'));

export function Hero() {
  const [gameOpen, setGameOpen] = useState(false);
  const [tosses, setTosses] = useState('');
  const [tidyKey, setTidyKey] = useState(0);
  const closeGame = useCallback(() => setGameOpen(false), []);

  return (
    <>
      <section className={`wrap ${styles.hero}`} aria-labelledby="hero-heading">
        <div className={styles.copy}>
          <Doodle kind="sparkle" float className={styles.sparkleBig} />
          <Doodle kind="sparkle" float className={styles.sparkleSmall} />
          <p className={`hand ${styles.hello}`}>hey there, welcome to</p>
          <h1 id="hero-heading" className={styles.heading}>
            <button
              type="button"
              className={`display ${styles.title}`}
              onClick={() => setGameOpen(true)}
              aria-haspopup="dialog"
              data-testid="button-open-game"
            >
              <span className={styles.name}>
                <span className="highlight">{profile.shortName}&rsquo;s</span>
              </span>
              <span className={styles.portfolio}>portfolio</span>
              <span className="visually-hidden"> (opens a small driving game)</span>
            </button>
          </h1>
          <p className={`hand ${styles.secret}`} aria-hidden="true">
            <svg viewBox="0 0 60 40" className={styles.arrow}>
              <path d="M56 34 C 40 34, 18 30, 8 8" />
              <path d="M3 16 L 8 7 L 16 13" />
            </svg>
            psst&hellip; click my name, there&rsquo;s a car in there
          </p>

          <p className={styles.lede}>
            I&rsquo;m a computer science student who builds with AI and ML: teaching computers to{' '}
            <em>see</em>, making sense of language, and checking how well models really do. Off the
            keyboard, you&rsquo;ll find me dancing, reading, or lost in animation and digital art.
          </p>

          <div className={styles.actions}>
            <a className="button button-primary" href="#work">
              see my work <ArrowDown size={16} aria-hidden="true" />
            </a>
            <a className="button" href={profile.github} target="_blank" rel="noreferrer">
              <Github size={16} aria-hidden="true" /> GitHub
            </a>
            <a
              className="button"
              href={`${import.meta.env.BASE_URL}Sanskriti_SDE_Resume.pdf`}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Here's my resume (PDF, opens in a new tab)"
            >
              <FileText size={16} aria-hidden="true" /> Here&rsquo;s my resume
            </a>
          </div>

          <ul className={styles.facts}>
            <li>QA intern @ Evaratus</li>
            <li>CS at Scaler &times; BITS Pilani</li>
            <li>40+ GitHub projects</li>
            <li>CGPA 9.05</li>
          </ul>
        </div>

        <div className={`card ${styles.toybox}`}>
          <span className="tape" aria-hidden="true" />
          <Doodle kind="heart" float className={styles.heart} />
          <Doodle kind="swirl" className={styles.swirl} />
          <ThreeCanvas
            scene={toyBoxScene}
            label="A pile of soft candy-coloured toys. Drag them around and throw them."
            interaction="drag"
            onStatus={setTosses}
            resetKey={tidyKey}
          />
          <p className={`hand ${styles.note}`} aria-hidden="true">
            go on, throw them around!
          </p>
          <div className={styles.toyBar}>
            <span className={styles.status} aria-live="polite">
              {tosses}
            </span>
            <button
              type="button"
              className="button button-small"
              onClick={() => setTidyKey((key) => key + 1)}
              data-testid="button-tidy-toys"
            >
              <RotateCcw size={13} aria-hidden="true" /> tidy up
            </button>
          </div>
        </div>
      </section>

      {gameOpen ? (
        <Suspense fallback={<div className={styles.gameLoading} />}>
          <DriveGameOverlay onClose={closeGame} />
        </Suspense>
      ) : null}
    </>
  );
}
