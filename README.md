# Откачка шамбо: сайт-визитка с заявками в Telegram

Сайт для услуги «Откачка шамбо, септиков и выгребных ям» (Хабаровск и Хабаровский район).
Посетитель читает информацию, звонит или оставляет номер. Заявка сохраняется на сервере и сразу приходит в Telegram.

```
Браузер ──► Caddy (контейнер web) ──► сайт (React, готовые файлы)
                    │
                    └── /api/* ──► Fastify (контейнер api) ──► leads.jsonl (том на диске)
                                          │
                                          └──► Telegram-бот (grammY) ──► ваш чат
```

| Часть | Что внутри |
|---|---|
| `frontend/` | Сайт: React 18, TypeScript, Vite. Анимированная сцена (SVG + CSS), светлая и тёмная тема, форма обратного звонка |
| `backend/` | API: Node.js 22, Fastify, zod. Принимает заявки, защита от спама (лимит по IP и «ловушка» для ботов), Telegram-бот на grammY |
| `docker-compose.yml` | Запуск двух контейнеров: `api` и `web` (Caddy сам получает HTTPS-сертификат) |
| `.env.example` | Шаблон настроек: домен, токен бота, chat id |

---

## Быстрый запуск на VPS (Ubuntu 22.04 / 24.04)

Понадобятся: VPS с Ubuntu, доступ по SSH, токен Telegram-бота. Домен желателен (нужен для HTTPS), но для проверки хватит IP-адреса.

### 1. Подключитесь и обновите систему

```bash
ssh root@IP_ВАШЕГО_СЕРВЕРА
apt update && apt upgrade -y
```

Лучше работать не под root. Создайте пользователя и дайте ему sudo (пропустите, если уже есть):

```bash
adduser deploy
usermod -aG sudo deploy
su - deploy
```

### 2. Установите Docker и Git

Официальный способ из документации Docker:

```bash
sudo apt update
sudo apt install -y ca-certificates curl git
sudo install -m 0755 -d /etc/apt/keyrings
sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
sudo chmod a+r /etc/apt/keyrings/docker.asc
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "${UBUNTU_CODENAME:-$VERSION_CODENAME}") stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
```

Чтобы запускать docker без sudo, добавьте себя в группу и **перезайдите по SSH**:

```bash
sudo usermod -aG docker $USER
exit
```

После повторного входа проверьте:

```bash
docker --version
docker compose version
```

### 3. Откройте порты

Сначала разрешите SSH, иначе потеряете доступ к серверу:

```bash
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 443/udp
sudo ufw enable
sudo ufw status
```

Порт API (3000) наружу не открывается: он доступен только внутри Docker и только сайту.

### 4. Создайте Telegram-бота

1. В Telegram откройте [@BotFather](https://t.me/BotFather) и отправьте `/newbot`.
2. Придумайте имя и логин (логин заканчивается на `bot`).
3. BotFather пришлёт **токен** вида `123456789:AA...`. Он секретный, никому не показывайте и не выкладывайте на GitHub.

### 5. Скачайте проект и заполните настройки

```bash
git clone https://github.com/ReDcTiOn/ShamboSite-botTG.git
cd ShamboSite-botTG
cp .env.example .env
nano .env
```

Заполните в `.env`:

```env
DOMAIN=:80                       # пока по IP; домен впишем позже (шаг 8)
TELEGRAM_BOT_TOKEN=123456789:AA...   # токен от BotFather
TELEGRAM_CHAT_IDS=               # пока пусто, заполним на шаге 7
```

Сохранить в nano: `Ctrl+O`, `Enter`, выйти: `Ctrl+X`.

> Если в репозитории основная ветка называется не так, как нужно, добавьте имя ветки при клонировании: `git clone -b ИМЯ_ВЕТКИ https://github.com/ReDcTiOn/ShamboSite-botTG.git`.

### 6. Запустите

```bash
docker compose up -d --build
```

Первая сборка занимает несколько минут. Проверьте, что оба контейнера работают:

```bash
docker compose ps
docker compose logs -f api      # выход: Ctrl+C
```

В логах `api` должно быть «Telegram-бот @имя_бота запущен». Откройте в браузере `http://IP_СЕРВЕРА`: сайт должен загрузиться.

### 7. Подключите чат для заявок

Бот присылает заявки только в чаты из списка `TELEGRAM_CHAT_IDS`. Чтобы узнать свой chat id:

1. Откройте своего бота в Telegram и отправьте `/start`. Бот ответит: «Ваш chat id: 123456789».
2. Вписать несколько получателей можно через запятую: `TELEGRAM_CHAT_IDS=123456789,987654321`.
3. Для группы: добавьте бота в группу и отправьте там `/id`. У групп chat id начинается с минуса (`-100...`).

Впишите id в `.env` и примените:

```bash
nano .env
docker compose up -d
```

Проверка: на сайте заполните форму (телефон и галочка согласия), отправьте. В Telegram придёт сообщение «Заявка на звонок». Команда `/last` покажет последние заявки (только для чатов из списка).

### 8. Подключите домен и HTTPS

1. У регистратора домена создайте **A-запись**: `example.ru` → IP сервера (и при желании `www`).
2. Подождите, пока запись обновится (от нескольких минут до пары часов).
3. В `.env` замените `DOMAIN=:80` на `DOMAIN=example.ru` и примените:

```bash
docker compose up -d
```

Caddy сам получит бесплатный сертификат Let's Encrypt и будет его продлевать. Нужно, чтобы порты 80 и 443 были открыты (шаг 3), а домен указывал на сервер. Если сайт `www.example.ru` тоже нужен, пишите оба адреса через запятую: `DOMAIN=example.ru, www.example.ru`.

---

## Повседневная работа

| Что сделать | Команда (из папки проекта) |
|---|---|
| Обновить сайт после изменений в репозитории | `git pull && docker compose up -d --build` |
| Посмотреть логи | `docker compose logs -f api` или `docker compose logs -f web` |
| Перезапустить | `docker compose restart` |
| Остановить | `docker compose down` (заявки и сертификаты сохраняются) |
| Скачать все заявки файлом | `docker compose cp api:/data/leads.jsonl ./leads-backup.jsonl` |
| Освободить место от старых образов | `docker image prune -f` |

Заявки хранятся в Docker-томе `leads` (файл `leads.jsonl`, одна заявка на строку). Том переживает обновления и пересборку. Делайте резервную копию файла время от времени.

Полностью удалить данные (осторожно, заявки пропадут): `docker compose down -v`.

---

## Где что менять на сайте

| Что | Где |
|---|---|
| Тексты (заголовок, услуги, шаги, вопросы) | `frontend/src/content.ts` |
| Телефон, название, зона работы | `frontend/src/config.ts` |
| Телефон в «Информации для поисковиков» (описание, JSON-LD) | `frontend/index.html` |
| Цифры телефона на цистерне и сама сцена | `frontend/src/assets/scene.svg` (текст `20-60-06`) |
| Цвета, шрифты, отступы, анимации | `frontend/src/styles/global.css` |
| Настройки лимита заявок, порт, логи | `.env` |

После изменений на сервере: `git pull && docker compose up -d --build`.

---

## Локальная разработка

Нужен Node.js 20 или новее.

```bash
# 1. Бэкенд (порт 3000)
cd backend
npm install
npm run dev            # без токена бота заявки просто сохраняются в backend/data/leads.jsonl

# 2. Фронтенд (порт 5173), в другом терминале
cd frontend
npm install
npm run dev            # откройте http://localhost:5173, запросы /api уходят на бэкенд
```

Чтобы проверять и Telegram, задайте переменные перед запуском бэкенда:

```bash
# Linux / macOS
TELEGRAM_BOT_TOKEN=123:AA... TELEGRAM_CHAT_IDS=123456789 npm run dev

# Windows PowerShell
$env:TELEGRAM_BOT_TOKEN="123:AA..."; $env:TELEGRAM_CHAT_IDS="123456789"; npm run dev
```

Проверки:

```bash
cd backend  && npm run typecheck && npm test
cd frontend && npm run typecheck && npm test && npm run build   # npm test во фронтенде требует Node 22.6 или новее
```

---

## API

| Метод | Адрес | Что делает |
|---|---|---|
| `GET` | `/api/health` | Проверка живости, ответ `{"ok":true}` |
| `POST` | `/api/callback` | Принимает заявку |

Тело заявки (JSON): `{ "name": "Иван", "phone": "+7 (900) 123-45-67", "comment": "яма 5 кубов", "website": "" }`.
Поле `website` служит ловушкой для ботов, у людей оно пустое. Ответы: `200 {"ok":true}`, `400` (`invalid_phone`, `invalid_input`), `429` (`rate_limited`, слишком много заявок с одного IP).

Команды бота: `/start` и `/id` (показать chat id), `/last [число]` (последние заявки, только для чатов из `TELEGRAM_CHAT_IDS`), `/help`.

---

## Если что-то не работает

| Проблема | Что проверить |
|---|---|
| Сайт не открывается по IP | `docker compose ps` (оба контейнера `Up`), `sudo ufw status` (порт 80 открыт), у провайдера VPS открыт ли порт 80 |
| Порт 80 занят | `sudo ss -ltnp \| grep ':80 '` и остановите мешающий сервис (например, `sudo systemctl stop nginx apache2`) |
| Нет HTTPS на домене | A-запись указывает на IP сервера, порты 80 и 443 открыты, в `.env` `DOMAIN=домен` без `https://`. Смотрите `docker compose logs web` |
| Заявки не приходят в Telegram | `docker compose logs api`. Есть ли строка «Telegram-бот ... запущен», верен ли токен, вписан ли chat id в `TELEGRAM_CHAT_IDS`, писали ли вы боту `/start` |
| На сайте «Не удалось отправить» | `docker compose logs api`, контейнер `api` должен быть `Up (healthy)` |
| «Слишком много заявок» | Сработал лимит (по умолчанию 5 заявок в час с одного IP). Измените `RATE_LIMIT_MAX` и `RATE_LIMIT_WINDOW` в `.env`, затем `docker compose up -d` |
| Изменил `.env`, но ничего не поменялось | Выполните `docker compose up -d`: контейнеры пересоздадутся с новыми настройками |

---

## Безопасность и данные

- Файл `.env` с токеном бота не попадает в Git (он в `.gitignore`). Если токен случайно опубликован, перевыпустите его у @BotFather командой `/revoke`.
- Заявки содержат персональные данные (имя, телефон). Храните резервные копии в безопасном месте и не выкладывайте их.
- На сайте стоит галочка согласия на обработку данных. Для публикации в России нужна ещё страница с политикой обработки персональных данных и ссылка на неё рядом с галочкой: этот текст нужно подготовить отдельно.
- API не опубликован наружу, достучаться до него можно только через сайт (Caddy). Запросы с формы ограничены по частоте.
