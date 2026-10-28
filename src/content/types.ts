/** Stable identifier for a project, used for its icon, colour and test ids. */
export type ProjectId = 'visualsearch' | 'visiontrack' | 'repolens' | 'agenteval' | 'explorations';

export interface Project {
  id: ProjectId;
  title: string;
  /** One-line summary shown under the title. */
  tagline: string;
  description: string;
  tags: string[];
  /** Reported results or capabilities, shown as highlighted chips. */
  highlights?: string[];
  /** Repository or profile link. */
  href: string;
  /** Link text; defaults to "View repository". */
  linkLabel?: string;
}

export interface ExperienceEntry {
  period: string;
  role: string;
  organisation: string;
  summary?: string;
  meta?: string[];
  /** Marks the role I'm in right now. */
  current?: boolean;
}

export type SkillGroupId =
  'languages' | 'ai' | 'backend' | 'frontend' | 'data' | 'systems' | 'tools';

export interface SkillGroup {
  id: SkillGroupId;
  label: string;
  items: string[];
}

export type HobbyId = 'dancing' | 'reading' | 'coding';

export interface AboutContent {
  facts: Array<{ value: string; label: string }>;
  hobbies: Array<{ id: HobbyId; label: string }>;
  interests: string[];
  /** Words that scroll past in the ribbon under the hero. */
  ribbon: string[];
  strengths: string[];
}

export interface Recognition {
  title: string;
  detail: string;
}

export interface NavItem {
  label: string;
  href: string;
}

export interface Profile {
  name: string;
  shortName: string;
  role: string;
  email: string;
  github: string;
  githubHandle: string;
}
