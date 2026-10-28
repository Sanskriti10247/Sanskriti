import { ArrowUp, ArrowUpRight, BookOpen, Github, Linkedin, Youtube } from 'lucide-react';
import { profile } from '@/content';
import styles from './Footer.module.css';

export function Footer() {
  const socials = [
    { label: 'GitHub', note: 'what I build', href: profile.github, icon: Github },
    {
      label: 'LinkedIn',
      note: 'let’s connect',
      href: 'https://www.linkedin.com/in/sanskriti988/',
      icon: Linkedin,
    },
    {
      label: 'Medium',
      note: 'what I write',
      href: 'https://medium.com/@Sanskriti_988',
      icon: BookOpen,
    },
    {
      label: 'YouTube',
      note: 'what I share',
      href: 'https://www.youtube.com/@Sanskriti_988',
      icon: Youtube,
    },
  ];

  return (
    <footer className={styles.footer}>
      <div className="wrap">
        <section className={styles.socialPanel} aria-labelledby="socials-heading">
          <div className={styles.socialHeading}>
            <p className="hand">a little more of me</p>
            <h2 className="display" id="socials-heading">
              Elsewhere on the <span className="highlight">internet.</span>
            </h2>
          </div>
          <nav className={styles.socials} aria-label="Social profiles">
            {socials.map(({ label, note, href, icon: Icon }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.socialLink}
              >
                <span className={styles.icon}>
                  <Icon size={23} aria-hidden="true" />
                </span>
                <span className={styles.socialText}>
                  <strong>{label}</strong>
                  <span>{note}</span>
                </span>
                <ArrowUpRight className={styles.external} size={19} aria-hidden="true" />
                <span className="visually-hidden"> (opens in a new tab)</span>
              </a>
            ))}
          </nav>
        </section>
      </div>
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
