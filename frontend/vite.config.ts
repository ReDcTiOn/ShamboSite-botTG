import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';

// Запросы /api уходят на бэкенд (npm run dev в папке backend, порт 3000).
// В продакшене это делает Caddy (см. frontend/Caddyfile), здесь то же самое для разработки и проверки сборки.
const proxy = { '/api': 'http://localhost:3000' };

export default defineConfig(({ mode }) => {
  // VITE_BASE нужен для демо на GitHub Pages: сайт лежит не в корне, а в /ShamboSite-botTG/ (см. frontend/.env.demo)
  const env = loadEnv(mode, process.cwd(), 'VITE_');
  return {
    base: env.VITE_BASE || '/',
    plugins: [react()],
    server: { port: 5173, proxy },
    preview: { port: 4173, proxy },
  };
});
