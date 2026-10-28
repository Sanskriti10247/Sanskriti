import { ArrowUpRight, Gauge, GitBranch, Microscope, ScanEye, ScanSearch } from 'lucide-react';
import { Tag } from '@/components/ui/Tag';
import type { Project, ProjectId } from '@/content';
import styles from './ProjectCard.module.css';

const icons: Record<ProjectId, typeof ScanSearch> = {
  visualsearch: ScanSearch,
  visiontrack: ScanEye,
  repolens: GitBranch,
  agenteval: Gauge,
  explorations: Microscope,
};

interface ProjectCardProps {
  project: Project;
  /** Span the full grid width. */
  wide?: boolean;
  delay?: number;
}

export function ProjectCard({ project, wide = false, delay }: ProjectCardProps) {
  const Icon = icons[project.id];

  return (
    <article
      className={`card ${styles.card} ${styles[project.id]} ${wide ? styles.wide : ''}`}
      data-reveal
      data-reveal-delay={delay}
      data-testid={`card-project-${project.id}`}
    >
      <header className={styles.top}>
        <span className={styles.icon} aria-hidden="true">
          <Icon size={26} strokeWidth={2.2} />
        </span>
        <div>
          <h3 className={`display ${styles.title}`}>{project.title}</h3>
          <p className={styles.tagline}>{project.tagline}</p>
        </div>
      </header>

      <div className={styles.body}>
        <p className={styles.description}>{project.description}</p>

        {project.highlights ? (
          <ul className={styles.list} aria-label="Highlights">
            {project.highlights.map((item) => (
              <li key={item}>
                <Tag tone="filled">{item}</Tag>
              </li>
            ))}
          </ul>
        ) : null}

        <ul className={styles.list} aria-label="Built with">
          {project.tags.map((tag) => (
            <li key={tag}>
              <Tag>{tag}</Tag>
            </li>
          ))}
        </ul>

        <a
          className={styles.link}
          href={project.href}
          target="_blank"
          rel="noreferrer"
          data-testid={`link-project-${project.id}`}
        >
          {project.linkLabel ?? 'see the code'}
          <span className="visually-hidden"> for {project.title}</span>
          <ArrowUpRight size={16} aria-hidden="true" />
        </a>
      </div>
    </article>
  );
}
