import { Bot } from 'grammy';
import type { Lead, LeadStore } from './leads.js';
import { formatPhone } from './phone.js';

/** Минимум, что нужно от логгера. Подходит и логгер Fastify (pino), и console. */
export interface Logger {
  info: (...args: any[]) => void;
  warn: (...args: any[]) => void;
  error: (...args: any[]) => void;
}

export interface Notifier {
  notifyLead(lead: Lead): Promise<void>;
  start(): Promise<void>;
  stop(): Promise<void>;
}

export const escapeHtml = (s: string): string => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export function formatLead(lead: Lead): string {
  const when = new Intl.DateTimeFormat('ru-RU', {
    dateStyle: 'short',
    timeStyle: 'short',
    timeZone: 'Asia/Vladivostok',
  }).format(new Date(lead.at));
  return [
    '<b>Заявка на звонок</b>',
    `Телефон: <b>${escapeHtml(formatPhone(lead.phone))}</b>`,
    `Имя: ${lead.name ? escapeHtml(lead.name) : '-'}`,
    `Комментарий: ${lead.comment ? escapeHtml(lead.comment) : '-'}`,
    `<i>${when} (Хабаровск)</i>`,
  ].join('\n');
}

/** Уведомитель-заглушка: когда бот не настроен, заявки просто сохраняются. */
export const noopNotifier: Notifier = {
  async notifyLead() {},
  async start() {},
  async stop() {},
};

interface Options {
  token: string | undefined;
  chatIds: string[];
  store: LeadStore;
  log: Logger;
}

/** Telegram-бот: присылает заявки в указанные чаты и отвечает на команды /start, /id, /last. */
export function createNotifier({ token, chatIds, store, log }: Options): Notifier {
  if (!token) {
    log.warn('TELEGRAM_BOT_TOKEN не задан: заявки только сохраняются в файл, в Telegram не отправляются');
    return noopNotifier;
  }

  const bot = new Bot(token);
  const isAdmin = (chatId: number) => chatIds.includes(String(chatId));

  const idText = (chatId: number) =>
    [
      `Ваш chat id: <code>${chatId}</code>`,
      '',
      'Впишите его в файл .env в строку TELEGRAM_CHAT_IDS и перезапустите сервер (docker compose up -d).',
      'Тогда заявки с сайта будут приходить сюда.',
    ].join('\n');

  bot.command('start', (ctx) =>
    ctx.reply(`Это бот сайта «Откачка шамбо».\n\n${idText(ctx.chat.id)}`, { parse_mode: 'HTML' }),
  );
  bot.command('id', (ctx) => ctx.reply(idText(ctx.chat.id), { parse_mode: 'HTML' }));
  bot.command('help', (ctx) =>
    ctx.reply('/id: показать chat id\n/last [число]: последние заявки (только для администраторов)'),
  );
  bot.command('last', async (ctx) => {
    if (!isAdmin(ctx.chat.id)) return ctx.reply('Нет доступа. Ваш chat id нужно добавить в TELEGRAM_CHAT_IDS.');
    const n = Math.min(Math.max(Number.parseInt(ctx.match, 10) || 5, 1), 20);
    const leads = await store.last(n);
    if (leads.length === 0) return ctx.reply('Заявок пока нет.');
    return ctx.reply(leads.map(formatLead).join('\n\n'), { parse_mode: 'HTML' });
  });
  bot.catch((err) => log.error({ err: err.error }, 'ошибка в обработчике бота'));

  let enabled = false;

  return {
    async start() {
      try {
        await bot.init();
      } catch (err) {
        log.error({ err }, 'Не удалось подключиться к Telegram: проверьте TELEGRAM_BOT_TOKEN. Заявки будут только сохраняться');
        return;
      }
      enabled = true;
      log.info(`Telegram-бот @${bot.botInfo.username} запущен`);
      if (chatIds.length === 0) log.warn('TELEGRAM_CHAT_IDS пуст: напишите боту /start, чтобы узнать chat id');
      void bot.start({ drop_pending_updates: true }).catch((err) => log.error({ err }, 'опрос Telegram остановлен с ошибкой'));
    },
    async stop() {
      if (enabled) await bot.stop();
    },
    async notifyLead(lead) {
      if (!enabled || chatIds.length === 0) return;
      const text = formatLead(lead);
      const results = await Promise.allSettled(
        chatIds.map((id) =>
          bot.api.sendMessage(id, text, { parse_mode: 'HTML', link_preview_options: { is_disabled: true } }),
        ),
      );
      results.forEach((r, i) => {
        if (r.status === 'rejected') log.error({ err: r.reason, chatId: chatIds[i] }, 'не удалось отправить заявку в Telegram');
      });
    },
  };
}
