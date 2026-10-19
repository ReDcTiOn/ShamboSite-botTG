import { useEffect, useRef } from 'react';

/** Тонкая полоса сверху: показывает, как далеко прокручена страница. */
export function ScrollProgress() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let ticking = false;
    const update = () => {
      const el = ref.current;
      if (el) {
        const max = document.documentElement.scrollHeight - window.innerHeight;
        el.style.setProperty('--p', max > 0 ? Math.min(window.scrollY / max, 1).toFixed(4) : '0');
      }
      ticking = false;
    };
    const onScroll = () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, []);

  return <div className="progress" ref={ref} aria-hidden="true" />;
}
