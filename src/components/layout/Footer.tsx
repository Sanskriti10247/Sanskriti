import { ArrowUp } from 'lucide-react';
import { profile } from '@/content';
import styles from './Footer.module.css';

export function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={`wrap ${styles.inner}`}>
        <span>
          &copy; {new Date().getFullYear()} {profile.name}
        </span>
        <span className="hand">thanks for scrolling all the way down</span>
        <a href="#top" className={styles.backTop}>
          back to top <ArrowUp size={14} aria-hidden="true" />
        </a>
      </div>
    </footer>
  );
}
