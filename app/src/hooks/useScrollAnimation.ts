import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export function useScrollAnimation<T extends HTMLElement>(options?: {
  selector?: string;
  stagger?: number;
  y?: number;
  duration?: number;
  delay?: number;
}) {
  const containerRef = useRef<T>(null);
  const selector = options?.selector ?? '.scroll-animate';
  const stagger = options?.stagger ?? 0.08;
  const y = options?.y ?? 30;
  const duration = options?.duration ?? 0.6;
  const delay = options?.delay ?? 0;

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const elements = container.querySelectorAll(selector);
    if (elements.length === 0) return;

    gsap.set(Array.from(elements), { y, opacity: 0 });

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: container,
        start: 'top 85%',
        once: true,
      },
    });

    tl.to(Array.from(elements), {
      y: 0,
      opacity: 1,
      duration,
      delay,
      stagger,
      ease: 'power2.out',
    });

    return () => {
      if (tl.scrollTrigger) tl.scrollTrigger.kill();
      tl.kill();
    };
  }, [selector, stagger, y, duration, delay]);

  return containerRef;
}

export default useScrollAnimation;
