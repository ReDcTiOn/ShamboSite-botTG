import { TEL_HREF } from '../config';

/** Плавающая кнопка «Позвонить» на телефоне: всегда под рукой. */
export function CallFab() {
  return (
    <a className="fab" href={TEL_HREF} aria-label="Позвонить">
      Позвонить
    </a>
  );
}
