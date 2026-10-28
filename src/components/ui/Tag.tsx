import styles from './Tag.module.css';

interface TagProps {
  children: string;
  tone?: 'outline' | 'filled';
}

/** Small rounded label for technologies (outline) and results (filled). */
export function Tag({ children, tone = 'outline' }: TagProps) {
  return <span className={`${styles.tag} ${styles[tone]}`}>{children}</span>;
}
