import { AREA, BRAND, PHONE_DISPLAY, TEL_HREF } from '../config';
import { ThemeToggle } from './ThemeToggle';

const NAV = [
  { href: '#services', label: 'Что откачиваем' },
  { href: '#how', label: 'Как работаем' },
  { href: '#faq', label: 'Вопросы' },
];

function Logo() {
  return (
    <svg className="logo__mark" viewBox="0 0 42 42" aria-hidden="true">
      <rect className="logo__bg" width="42" height="42" rx="11" />
      <path className="logo__drop" d="M21 7c5.500 6.500 9 10.800 9 15.200a9 9 0 0 1-18 0C12 17.800 15.500 13.500 21 7z" />
      <path
        className="logo__shine"
        d="M16.800 22.500a4.200 4.200 0 0 1 2.600-3.900c.5-.2.900.4.500.8a3.200 3.200 0 0 0-1.700 3.100c.1.600-.8.800-1.400 0z"
      />
      <path className="logo__wave" d="M8 34q3.250-3 6.500 0t6.500 0t6.500 0t6.500 0" />
    </svg>
  );
}

export function Header() {
  return (
    <header className="top">
      <div className="wrap top__in">
        <a className="logo" href="#" aria-label={`${BRAND}, на главную`}>
          <Logo />
          <span className="logo__text">
            {BRAND}
            <small>{AREA}</small>
          </span>
        </a>
        <nav className="nav" aria-label="Разделы">
          {NAV.map((item) => (
            <a key={item.href} href={item.href}>
              {item.label}
            </a>
          ))}
        </nav>
        <a className="top__tel" href={TEL_HREF}>
          {PHONE_DISPLAY}
        </a>
        <ThemeToggle />
      </div>
    </header>
  );
}
