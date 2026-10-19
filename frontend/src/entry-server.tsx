import { renderToString } from 'react-dom/server';
import App from './App';

/** Используется только при сборке (scripts/prerender.mjs): отдаёт готовый HTML страницы, чтобы поисковики видели текст сразу. */
export function render() {
  return renderToString(<App />);
}
