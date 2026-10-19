import { Fragment, type CSSProperties } from 'react';
import { PHONE_DISPLAY, TEL_HREF } from '../config';
import { HERO } from '../content';
import { Scene } from './Scene';

export function Hero() {
  // Заголовок появляется по словам; неразрывный пробел внутри слова-пары ( ) не разрезаем.
  const words = HERO.title.split(' ');

  return (
    <section className="hero">
      <div className="wrap hero__in">
        <div className="hero__text">
          <h1 className="words" aria-label={HERO.title}>
            {words.map((word, i) => (
              <Fragment key={i}>
                <span className="word" style={{ '--i': i } as CSSProperties} aria-hidden="true">
                  {word}
                </span>{' '}
              </Fragment>
            ))}
          </h1>
          <p className="lead">{HERO.lead}</p>
          <div className="hero__cta">
            <a className="btn btn--primary" href={TEL_HREF}>
              Позвонить
            </a>
            <a className="btn btn--ghost" href="#callback">
              Заказать звонок
            </a>
          </div>
        </div>

        <aside className="hero__call" aria-label="Телефон для заказа">
          <p className="hero__label">{HERO.panelLabel}</p>
          <a className="hero__num" href={TEL_HREF}>
            {PHONE_DISPLAY}
          </a>
          <p className="hero__hint">{HERO.panelHint}</p>
        </aside>
      </div>

      <Scene />
    </section>
  );
}
