import { AREA, BRAND, PHONE_DISPLAY, TEL_HREF } from '../config';

const BASE = import.meta.env.BASE_URL;

export function Footer() {
  return (
    <footer className="foot">
      <div className="wrap foot__in">
        <span>
          {BRAND}. {AREA}
        </span>
        <a href={TEL_HREF}>{PHONE_DISPLAY}</a>
      </div>
      <div className="wrap foot__legal">
        {__OPERATOR_LINE__ && <p>{__OPERATOR_LINE__}</p>}
        <nav aria-label="Документы">
          <a href={`${BASE}privacy/`}>Политика обработки персональных данных</a>
          <a href={`${BASE}consent/`}>Согласие на обработку данных</a>
        </nav>
      </div>
    </footer>
  );
}
