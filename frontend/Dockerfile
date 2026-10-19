# syntax=docker/dockerfile:1

# --- сборка сайта (React + Vite) ---
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
# Адрес сайта и коды подтверждения для поисковиков попадают в sitemap.xml, canonical и метатеги (см. .env.example)
ARG SITE_URL=
ARG YANDEX_VERIFICATION=
ARG GOOGLE_VERIFICATION=
ENV SITE_URL=$SITE_URL YANDEX_VERIFICATION=$YANDEX_VERIFICATION GOOGLE_VERIFICATION=$GOOGLE_VERIFICATION
RUN npm run build

# --- отдача сайта: Caddy раздаёт статику, проксирует /api на бэкенд и сам получает HTTPS-сертификат ---
FROM caddy:2-alpine
COPY Caddyfile /etc/caddy/Caddyfile
COPY --from=build /app/dist /srv
EXPOSE 80 443 443/udp
