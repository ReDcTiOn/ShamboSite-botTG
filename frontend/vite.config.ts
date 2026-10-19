import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';
import { legalPages, loadOperator, unfilledFields } from './vite-plugins/legal';
import { seoPlugin } from './vite-plugins/seo';

// Запросы /api уходят на бэкенд (npm run dev в папке backend, порт 3000).
// В продакшене это делает Caddy (см. frontend/Caddyfile), здесь то же самое для разработки и проверки сборки.
const proxy = { '/api': 'http://localhost:3000' };

export default defineConfig(({ mode }) => {
  // VITE_BASE нужен для демо на GitHub Pages: сайт лежит не в корне, а в /ShamboSite-botTG/ (см. frontend/.env.demo)
  // SITE_URL и коды подтверждения для поисковиков можно задать в .env или переменными окружения (в Docker это build-аргументы)
  const env = { ...loadEnv(mode, process.cwd(), ['VITE_', 'SITE_', 'YANDEX_', 'GOOGLE_']), ...process.env };
  const base = env.VITE_BASE || '/';
  const demo = env.VITE_DEMO === 'true';
  const siteUrl = (env.SITE_URL ?? '').trim().replace(/\/+$/, '');

  const operator = loadOperator();
  const filled = unfilledFields(operator).length === 0;
  // Строка с реквизитами в подвале показывается, только когда данные оператора заполнены (иначе там были бы [заглушки])
  const operatorLine = filled ? `${operator.operatorName}, ИНН ${operator.inn}, ${operator.registryLabel} ${operator.registryNumber}` : '';

  return {
    base,
    plugins: [
      react(),
      legalPages({ base, siteUrl, demo }),
      seoPlugin({ base, siteUrl, demo, yandexVerification: env.YANDEX_VERIFICATION, googleVerification: env.GOOGLE_VERIFICATION }),
    ],
    define: {
      __OPERATOR_LINE__: JSON.stringify(operatorLine),
      __CONSENT_VERSION__: JSON.stringify(String(operator.documentVersion)),
    },
    server: { port: 5173, proxy },
    preview: { port: 4173, proxy },
  };
});
