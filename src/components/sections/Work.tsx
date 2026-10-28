import { explorations, featuredProjects } from '@/content';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { ProjectCard } from './ProjectCard';
import styles from './Work.module.css';

export function Work() {
  return (
    <section className={`section ${styles.section}`} id="work" aria-labelledby="work-heading">
      <div className="wrap">
        <SectionHeading
          id="work-heading"
          note="things I've made"
          title="Selected work"
          intro="A few projects I'm proud of. Each one links to its code on GitHub, where the READMEs go into the details."
        />
        <div className={styles.grid}>
          {featuredProjects.map((project, index) => (
            <ProjectCard key={project.id} project={project} delay={(index % 2) + 1} />
          ))}
          <ProjectCard project={explorations} wide />
        </div>
      </div>
    </section>
  );
}
