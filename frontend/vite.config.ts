import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// Запросы /api уходят на бэкенд (npm run dev в папке backend, порт 3000).
// В продакшене это делает Caddy (см. frontend/Caddyfile), здесь то же самое для разработки и проверки сборки.
const proxy = { '/api': 'http://localhost:3000' };

export default defineConfig({
  plugins: [react()],
  server: { port: 5173, proxy },
  preview: { port: 4173, proxy },
});
