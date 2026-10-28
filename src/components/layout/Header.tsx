import { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { navigation, profile } from '@/content';
import styles from './Header.module.css';

export function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const closeMenu = () => setMenuOpen(false);

  return (
    <header className={styles.header}>
      <nav className={`wrap ${styles.inner}`} aria-label="Main navigation">
        <a className={styles.brand} href="#top" onClick={closeMenu}>
          <span className={styles.mark} aria-hidden="true">
            S
          </span>
          {profile.shortName}
        </a>

        <ul id="site-menu" className={`${styles.links} ${menuOpen ? styles.open : ''}`}>
          {navigation.map((item) => (
            <li key={item.href}>
              <a href={item.href} onClick={closeMenu}>
                {item.label}
              </a>
            </li>
          ))}
          <li className={styles.menuCta}>
            <a href="#contact" onClick={closeMenu}>
              say hi
            </a>
          </li>
        </ul>

        <a className={`button button-small button-primary ${styles.cta}`} href="#contact">
          say hi
        </a>

        <button
          className={styles.menuButton}
          type="button"
          aria-label={menuOpen ? 'Close navigation' : 'Open navigation'}
          aria-expanded={menuOpen}
          aria-controls="site-menu"
          onClick={() => setMenuOpen((open) => !open)}
        >
          {menuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </nav>
    </header>
  );
}
