// Предрендер: после обычной сборки вставляет в dist/index.html готовую разметку страницы.
// Зачем: поисковые роботы (особенно Яндекс) надёжнее индексируют текст, который есть в HTML сразу,
// а не появляется после выполнения JavaScript. В браузере React всё равно перерисует страницу (см. src/main.tsx).
//
// Запускается автоматически из `npm run build` и `npm run build:demo`.
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { build } from 'vite';

const root = process.cwd();
const mode = process.argv.includes('--mode') ? process.argv[process.argv.indexOf('--mode') + 1] : 'production';
const outDir = await mkdtemp(join(tmpdir(), 'shambo-ssr-'));

try {
  // Собираем серверную точку входа во временную папку (dist не трогаем)
  await build({
    root,
    mode,
    logLevel: 'warn',
    configFile: resolve(root, 'vite.config.ts'),
    plugins: [{ name: 'skip-extra-output', apply: 'build', generateBundle(_, bundle) { for (const [k, v] of Object.entries(bundle)) if (v.type === 'asset' && !/\.(js|mjs)$/.test(k)) delete bundle[k]; } }],
    build: { ssr: 'src/entry-server.tsx', outDir, emptyOutDir: true, minify: false, rollupOptions: { output: { format: 'esm', entryFileNames: 'entry-server.mjs' } } },
    ssr: { noExternal: true },
  });

  const { render } = await import(pathToFileURL(join(outDir, 'entry-server.mjs')).href);
  const html = render();

  const file = resolve(root, 'dist/index.html');
  const page = await readFile(file, 'utf8');
  if (!page.includes('<div id="root"></div>')) throw new Error('В dist/index.html не найден <div id="root"></div>: предрендер не вставлен.');
  await writeFile(file, page.replace('<div id="root"></div>', `<div id="root">${html}</div>`));
  console.log(`Предрендер: в dist/index.html вставлено ${(html.length / 1024).toFixed(1)} КБ разметки`);
} finally {
  await rm(outDir, { recursive: true, force: true });
}
