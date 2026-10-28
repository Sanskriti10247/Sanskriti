import { Brain, CodeXml, Cpu, Database, LayoutTemplate, Server, Wrench } from 'lucide-react';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { skillGroups, type SkillGroupId } from '@/content';
import styles from './Toolkit.module.css';

const icons: Record<SkillGroupId, typeof Brain> = {
  languages: CodeXml,
  ai: Brain,
  backend: Server,
  frontend: LayoutTemplate,
  data: Database,
  systems: Cpu,
  tools: Wrench,
};

export function Toolkit() {
  return (
    <section className="section" id="toolkit" aria-labelledby="toolkit-heading">
      <div className="wrap">
        <SectionHeading
          id="toolkit-heading"
          note="what's in my bag"
          title="Toolkit"
          intro="Everything I work with, from the languages I think in to the tools that keep my code honest."
        />
        <div className={styles.grid}>
          {skillGroups.map((group, index) => {
            const Icon = icons[group.id];
            return (
              <div
                className={`card ${styles.group} ${styles[group.id]}`}
                key={group.id}
                data-reveal
                data-reveal-delay={(index % 3) + 1}
                data-testid={`card-skills-${group.id}`}
              >
                <div className={styles.head}>
                  <span className={styles.icon} aria-hidden="true">
                    <Icon size={20} strokeWidth={2.2} />
                  </span>
                  <h3 className={styles.label}>{group.label}</h3>
                  <span className={styles.count} aria-label={`${group.items.length} skills`}>
                    {group.items.length}
                  </span>
                </div>
                <ul className={styles.chips}>
                  {group.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
