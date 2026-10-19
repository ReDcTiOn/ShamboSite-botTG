# syntax=docker/dockerfile:1

# --- сборка сайта (React + Vite) ---
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

# --- отдача сайта: Caddy раздаёт статику, проксирует /api на бэкенд и сам получает HTTPS-сертификат ---
FROM caddy:2-alpine
COPY Caddyfile /etc/caddy/Caddyfile
COPY --from=build /app/dist /srv
EXPOSE 80 443 443/udp
