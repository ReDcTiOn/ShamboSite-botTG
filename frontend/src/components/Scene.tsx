import { useRef } from 'react';
import sceneMarkup from '../assets/scene.svg?raw';
import { useSceneController } from '../hooks/useSceneController';

/**
 * Фоновая сцена первого экрана: машина приезжает, откачивает яму и уезжает.
 * Разметка SVG лежит в assets/scene.svg и вставляется как есть, анимации описаны в styles/global.css.
 */
export function Scene() {
  const frameRef = useRef<HTMLDivElement>(null);
  const { paused, toggle } = useSceneController(frameRef);

  return (
    <div className="hero__scene">
      <div className="scene-frame" ref={frameRef} dangerouslySetInnerHTML={{ __html: sceneMarkup }} />
      <button
        className="scene-ctl"
        type="button"
        onClick={toggle}
        data-state={paused ? 'paused' : 'playing'}
        aria-pressed={paused}
        aria-label={paused ? 'Возобновить анимацию' : 'Поставить анимацию на паузу'}
      >
        <svg className="ico-pause" width="14" height="14" viewBox="0 0 20 20" aria-hidden="true">
          <path fill="currentColor" d="M4 3h4v14H4zM12 3h4v14h-4z" />
        </svg>
        <svg className="ico-play" width="14" height="14" viewBox="0 0 20 20" aria-hidden="true">
          <path fill="currentColor" d="M5 3l12 7-12 7z" />
        </svg>
        <span className="scene-ctl__text">{paused ? 'Возобновить' : 'Пауза'}</span>
      </button>
    </div>
  );
}
