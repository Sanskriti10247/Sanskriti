import type { Project } from './types';

export const featuredProjects: Project[] = [
  {
    id: 'visualsearch',
    title: 'VisualSearch',
    tagline: 'Search images by meaning',
    description:
      'Image search that works on meaning, not filenames. I embed a collection with CLIP and DINOv2, pull the nearest matches, then rerank them using image captions.',
    tags: ['CLIP', 'DINOv2', 'FAISS / Qdrant', 'FastAPI', 'React', 'BLIP'],
    highlights: ['64.7 Recall@1 · CLIP ViT-L/14', '83.2 Recall@1 · BLIP reranking'],
    href: 'https://github.com/Sanskriti10247/VisualSearch',
  },
  {
    id: 'visiontrack',
    title: 'VisionTrack',
    tagline: 'From detections to events',
    description:
      'Video analytics around YOLO11 and a ByteTrack implementation. It turns raw detections into track histories and events, like something crossing a line or lingering in a zone.',
    tags: ['YOLO11', 'ByteTrack', 'ONNX Runtime', 'HOTA / MOTA / IDF1'],
    highlights: ['Line crossings', 'Zones & dwell time', 'CPU / edge inference'],
    href: 'https://github.com/Sanskriti10247/VisionTrack',
  },
  {
    id: 'repolens',
    title: 'RepoLens',
    tagline: 'Know what a change touches',
    description:
      'Show it a code change and it works out what that change touches: it maps the dependencies, finds the tests with real evidence behind them, and runs them in a sandbox. Deterministic from start to finish.',
    tags: ['Python', 'Dependency graphs', 'Test selection', 'Sandboxing'],
    href: 'https://github.com/Sanskriti10247/RepoLens',
  },
  {
    id: 'agenteval',
    title: 'AgentEval',
    tagline: 'Benchmark agents fairly',
    description:
      'A place to watch and benchmark AI agents inside controlled environments, with full traces so that runs can be compared fairly.',
    tags: ['AI agents', 'Isolated evaluation', 'Traces', 'Reliability'],
    highlights: ['Latency comparison', 'Cost comparison'],
    href: 'https://github.com/Sanskriti10247/AgentEval',
  },
];

export const explorations: Project = {
  id: 'explorations',
  title: 'Applied ML explorations',
  tagline: 'Medical imaging & interpretable models',
  description:
    'Smaller experiments in medical imaging: YOLOv8 brain-tumor detection on MRI scans, and breast-cancer classification with a focus on interpretability. The XGBoost classifier reached 96.9% accuracy and 0.992 ROC-AUC.',
  tags: ['YOLOv8', 'MRI', 'XGBoost', 'Interpretability'],
  highlights: ['96.9% accuracy', '0.992 ROC-AUC'],
  href: 'https://github.com/Sanskriti10247',
  linkLabel: 'More on GitHub',
};
