import { useCallback, useEffect, useState } from 'react';

export type Theme = 'light' | 'dark';

const KEY = 'theme';

function readStored(): Theme | null {
  try {
    const value = localStorage.getItem(KEY);
    return value === 'light' || value === 'dark' ? value : null;
  } catch {
    return null;
  }
}

/**
 * Тема сайта: пока человек ничего не выбирал, следуем настройке системы.
 * Выбор сохраняется в браузере и ставится атрибутом data-theme на <html>
 * (тот же атрибут выставляет маленький скрипт в index.html до отрисовки, чтобы не было вспышки).
 */
export function useTheme() {
  const [stored, setStored] = useState<Theme | null>(readStored);
  const [systemDark, setSystemDark] = useState(() => window.matchMedia('(prefers-color-scheme: dark)').matches);

  useEffect(() => {
    const query = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => setSystemDark(query.matches);
    query.addEventListener('change', onChange);
    return () => query.removeEventListener('change', onChange);
  }, []);

  useEffect(() => {
    if (stored) document.documentElement.dataset.theme = stored;
    else delete document.documentElement.dataset.theme;
  }, [stored]);

  const theme: Theme = stored ?? (systemDark ? 'dark' : 'light');

  const toggle = useCallback(() => {
    const next: Theme = theme === 'dark' ? 'light' : 'dark';
    setStored(next);
    try {
      localStorage.setItem(KEY, next);
    } catch {
      // приватный режим: просто не запоминаем
    }
  }, [theme]);

  return { theme, toggle };
}
