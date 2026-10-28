import { useEffect, useState, type RefObject } from 'react';

interface InViewOptions {
  rootMargin?: string;
  threshold?: number;
}

/** Tracks whether an element is inside (or near) the viewport. */
export function useInView<T extends Element>(
  ref: RefObject<T | null>,
  { rootMargin = '0px', threshold = 0 }: InViewOptions = {},
): boolean {
  // Without IntersectionObserver support, treat everything as visible.
  const [inView, setInView] = useState(() => !('IntersectionObserver' in window));

  useEffect(() => {
    const element = ref.current;
    if (!element || !('IntersectionObserver' in window)) return;
    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), {
      rootMargin,
      threshold,
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, [ref, rootMargin, threshold]);

  return inView;
}
