#!/usr/bin/env bash
# Публикует демо-версию сайта (без бэкенда) на GitHub Pages: собирает frontend в режиме demo
# и отправляет результат в ветку gh-pages. Адрес: https://<логин>.github.io/<репозиторий>/
#
# Запуск из любой папки проекта:   bash scripts/deploy-pages.sh
# Свой текст коммита:              DEPLOY_MESSAGE="Обновил демо" bash scripts/deploy-pages.sh
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
REMOTE_URL="$(git -C "$ROOT" remote get-url origin)"
MESSAGE="${DEPLOY_MESSAGE:-Публикация демо-версии сайта}"

echo "==> Сборка демо-версии"
cd "$ROOT/frontend"
npm ci --no-audit --no-fund
npm run build:demo

echo "==> Подготовка ветки gh-pages"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT
cp -r dist/. "$TMP/"
touch "$TMP/.nojekyll" # чтобы GitHub не обрабатывал файлы как Jekyll-сайт

cd "$TMP"
git init -q -b gh-pages
git config user.name "$(git -C "$ROOT" config user.name || echo deploy)"
git config user.email "$(git -C "$ROOT" config user.email || echo deploy@example.com)"
git add -A
git commit -q -m "$MESSAGE"

echo "==> Отправка в gh-pages (ветка перезаписывается целиком, это нормально для сборки)"
git push -f "$REMOTE_URL" gh-pages
echo "Готово. Через минуту-две сайт обновится на GitHub Pages."
