import { createElement, useEffect, useRef, useState, type CSSProperties, type HTMLAttributes, type ReactNode } from 'react';

type Props = HTMLAttributes<HTMLElement> & {
  /** HTML-тег обёртки. */
  as?: 'div' | 'li' | 'article' | 'details' | 'h2' | 'section';
  /** Задержка появления, мс (для «лесенки» у соседних блоков). */
  delay?: number;
  children: ReactNode;
};

/** Плавно показывает блок, когда он попадает в экран. Без IntersectionObserver блок виден сразу. */
export function Reveal({ as = 'div', delay = 0, className, style, children, ...rest }: Props) {
  const ref = useRef<HTMLElement>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (!('IntersectionObserver' in window)) {
      setShown(true);
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setShown(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15, rootMargin: '0px 0px -5% 0px' },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return createElement(
    as,
    {
      ...rest,
      ref,
      className: [className, shown ? 'in' : ''].filter(Boolean).join(' ') || undefined,
      style: { ...style, '--d': `${delay}ms` } as CSSProperties,
      'data-reveal': '',
    },
    children,
  );
}
