import { AREA, BRAND, PHONE_DISPLAY, TEL_HREF } from '../config';

export function Footer() {
  return (
    <footer className="foot">
      <div className="wrap foot__in">
        <span>
          {BRAND}. {AREA}
        </span>
        <a href={TEL_HREF}>{PHONE_DISPLAY}</a>
      </div>
    </footer>
  );
}
