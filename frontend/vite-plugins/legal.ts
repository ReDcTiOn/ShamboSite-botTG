import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { marked } from 'marked';
import type { Plugin } from 'vite';

/**
 * Юридические страницы сайта (политика и согласие). Тексты лежат в frontend/legal/*.md,
 * данные оператора в frontend/legal/operator.json. При сборке из них получаются страницы
 * /privacy/ и /consent/ обычным HTML (без JavaScript), чтобы их мог открыть любой и прочитал любой поисковик.
 */
export const LEGAL_PAGES = [
  { path: 'privacy', file: 'privacy-policy.md', title: 'Политика в отношении обработки персональных данных' },
  { path: 'consent', file: 'consent.md', title: 'Согласие на обработку персональных данных' },
] as const;

type Values = Record<string, string | number>;

const legalDir = () => resolve(process.cwd(), 'legal');

export function loadOperator(): Values {
  const data = JSON.parse(readFileSync(resolve(legalDir(), 'operator.json'), 'utf8')) as Values;
  delete data._comment;
  return data;
}

/** Поля, в которых остались [квадратные скобки] шаблона: данные оператора ещё не заполнены. */
export function unfilledFields(operator: Values): string[] {
  return Object.entries(operator)
    .filter(([, value]) => typeof value === 'string' && /\[[^\]]+\]/.test(value))
    .map(([key]) => key);
}

const escapeHtml = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function fill(md: string, values: Values): string {
  return md.replace(/\{\{(\w+)\}\}/g, (_, key: string) => {
    if (!(key in values)) throw new Error(`В шаблоне документа есть {{${key}}}, но такого поля нет в legal/operator.json`);
    return escapeHtml(String(values[key]));
  });
}

interface PageOptions {
  base: string;
  siteUrl: string;
  demo: boolean;
}

export function renderLegalPage(page: (typeof LEGAL_PAGES)[number], { base, siteUrl, demo }: PageOptions): string {
  const operator = loadOperator();
  const missing = unfilledFields(operator);
  const values: Values = { ...operator, privacyUrl: `${base}privacy/`, consentUrl: `${base}consent/` };
  const body = marked.parse(fill(readFileSync(resolve(legalDir(), page.file), 'utf8'), values), { async: false }) as string;
  const siteName = String(operator.siteName ?? '');
  // Пока данные оператора не заполнены, документ нельзя считать действующим, и отдавать его в поиск не нужно
  const noindex = demo || missing.length > 0;
  const robots = `<meta name="robots" content="${noindex ? 'noindex, nofollow' : 'index, follow'}">`;
  const canonical = siteUrl && !noindex ? `<link rel="canonical" href="${siteUrl}${base}${page.path}/">` : '';
  const warning = missing.length
    ? `<p class="legal-warning"><strong>Это шаблон.</strong> Владелец сайта ещё не заполнил данные оператора (${missing.join(', ')}). Документ нельзя считать действующим.</p>`
    : '';
  const other = LEGAL_PAGES.filter((p) => p.path !== page.path)
    .map((p) => `<a href="${base}${p.path}/">${p.title}</a>`)
    .join(' · ');

  return `<!doctype html>
<html lang="ru">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="color-scheme" content="light dark">
  <title>${page.title}: ${siteName}</title>
  ${robots}
  ${canonical}
  <link rel="icon" type="image/svg+xml" href="${base}favicon.svg">
  <script>try{var t=localStorage.getItem('theme');if(t==='light'||t==='dark')document.documentElement.dataset.theme=t}catch(e){}</script>
  <link rel="stylesheet" href="${base}legal.css">
</head>
<body>
  <header class="legal-top"><a href="${base}">← ${siteName}</a></header>
  <main class="legal">
    ${warning}
    ${body}
    <p class="legal-more">${other}</p>
  </main>
</body>
</html>
`;
}

export function legalPages(options: PageOptions): Plugin {
  return {
    name: 'shambo-legal-pages',
    buildStart() {
      const missing = unfilledFields(loadOperator());
      if (missing.length) {
        this.warn(`Данные оператора не заполнены (frontend/legal/operator.json): ${missing.join(', ')}. Политика и согласие остаются шаблонами.`);
      }
    },
    generateBundle() {
      for (const page of LEGAL_PAGES) {
        this.emitFile({ type: 'asset', fileName: `${page.path}/index.html`, source: renderLegalPage(page, options) });
      }
    },
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const page = LEGAL_PAGES.find((p) => (req.url ?? '').split('?')[0]?.replace(/\/$/, '') === `/${p.path}`);
        if (!page) return next();
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.end(renderLegalPage(page, { ...options, base: '/' }));
      });
    },
  };
}
