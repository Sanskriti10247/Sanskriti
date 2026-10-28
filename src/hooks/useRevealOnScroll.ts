import { useEffect } from 'react';

const SELECTOR = '[data-reveal]';

/**
 * Adds `data-visible` to every `[data-reveal]` element the first time it
 * scrolls into view. Styling for the transition lives in the base stylesheet.
 */
export function useRevealOnScroll(): void {
  useEffect(() => {
    const targets = document.querySelectorAll<HTMLElement>(SELECTOR);
    if (!('IntersectionObserver' in window)) {
      targets.forEach((target) => target.setAttribute('data-visible', ''));
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.setAttribute('data-visible', '');
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' },
    );
    targets.forEach((target) => observer.observe(target));
    return () => observer.disconnect();
  }, []);
}
