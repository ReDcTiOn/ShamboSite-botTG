import { useEffect, useRef, useState, type RefObject } from 'react';

const SHOWS = 3; // сколько раз показываем сцену, потом останавливаемся
const CYCLE = 24000; // длительность одного показа, мс (как в CSS: 24s)
const STOP_AT = 22800; // остановка на 95% показа: машина уехала, люк закрыт, во дворе чисто

/**
 * Управляет анимацией сцены в первом экране:
 *  - играет, только пока сцену видно (экономит батарею);
 *  - сама останавливается после трёх показов на «чистом» кадре;
 *  - кнопка «Пауза / Возобновить»;
 *  - на узких экранах показывает центральную часть двора (меняет viewBox).
 * Сама сцена лежит в SVG (assets/scene.svg), анимации заданы в CSS (styles/global.css).
 */
export function useSceneController(frameRef: RefObject<HTMLElement | null>) {
  const [paused, setPaused] = useState(false);
  const toggleRef = useRef<() => void>(() => {});

  useEffect(() => {
    const scene = frameRef.current?.querySelector<SVGSVGElement>('.scene-svg');
    if (!scene) return;

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Узкий экран: показываем центральную часть двора, а не всю ширину мира.
    const narrow = window.matchMedia('(max-width: 700px)');
    const applyView = () => {
      scene.setAttribute('viewBox', narrow.matches ? '100 50 425 240' : '-500 50 1680 240');
      scene.setAttribute('preserveAspectRatio', narrow.matches ? 'xMidYMax meet' : 'xMidYMax slice');
    };
    applyView();
    narrow.addEventListener('change', applyView);

    let isPaused = false;
    let limit = (SHOWS - 1) * CYCLE + STOP_AT;

    const animations = () => scene.getAnimations({ subtree: true });
    const mainClock = () => animations().find((a) => (a as CSSAnimation).animationName === 'sc-props');

    const pause = () => {
      isPaused = true;
      animations().forEach((a) => a.pause());
      setPaused(true);
    };
    const resume = () => {
      isPaused = false;
      scene.classList.add('go');
      animations().forEach((a) => a.play());
      const t = Number(mainClock()?.currentTime ?? 0);
      // следующая остановка: через три показа от текущего места, на «чистом» кадре
      limit = (Math.floor((t - STOP_AT) / CYCLE) + SHOWS) * CYCLE + STOP_AT;
      setPaused(false);
    };
    toggleRef.current = () => (isPaused ? resume() : pause());

    const timer = reducedMotion
      ? undefined
      : window.setInterval(() => {
          if (isPaused || !scene.classList.contains('go')) return;
          const clock = mainClock();
          if (clock && Number(clock.currentTime) >= limit) pause();
        }, 250);

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (isPaused || !entry) return; // на паузе сцена остаётся как есть
        scene.classList.toggle('go', entry.isIntersecting);
        if (entry.isIntersecting) limit = (SHOWS - 1) * CYCLE + STOP_AT; // заново три показа
      },
      { threshold: 0.05 },
    );
    observer.observe(scene);

    return () => {
      observer.disconnect();
      narrow.removeEventListener('change', applyView);
      if (timer) window.clearInterval(timer);
    };
  }, [frameRef]);

  return { paused, toggle: () => toggleRef.current() };
}
