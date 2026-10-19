import rateLimit from '@fastify/rate-limit';
import Fastify from 'fastify';
import type { Config } from './config.js';
import type { LeadStore } from './leads.js';
import { normalizePhone } from './phone.js';
import { cleanText, leadInputSchema } from './schema.js';
import type { Logger, Notifier } from './telegram.js';

interface Deps {
  config: Config;
  store: LeadStore;
  /** Создаёт уведомитель (бота). Получает логгер сервера, чтобы все логи были в одном формате. */
  createNotifier: (log: Logger) => Notifier;
  /** В тестах логгер выключают. */
  logger?: boolean;
}

export async function buildServer({ config, store, createNotifier, logger = true }: Deps) {
  const app = Fastify({
    logger: logger ? { level: config.LOG_LEVEL } : false,
    trustProxy: true, // перед API стоит Caddy, настоящий IP берём из X-Forwarded-For
    bodyLimit: 10 * 1024,
  });
  const notifier = createNotifier(app.log);

  await app.register(rateLimit, { global: false });

  app.get('/api/health', async () => ({ ok: true }));

  app.post(
    '/api/callback',
    {
      config: {
        rateLimit: {
          max: config.RATE_LIMIT_MAX,
          timeWindow: config.RATE_LIMIT_WINDOW,
          errorResponseBuilder: () => ({ statusCode: 429, ok: false, error: 'rate_limited' }),
        },
      },
    },
    async (req, reply) => {
      const parsed = leadInputSchema.safeParse(req.body ?? {});
      if (!parsed.success) return reply.code(400).send({ ok: false, error: 'invalid_input' });

      const { name, phone, comment, website } = parsed.data;
      if (website) {
        req.log.info('заявка отброшена: сработала ловушка для ботов');
        return { ok: true };
      }

      const normalized = normalizePhone(phone);
      if (!normalized) return reply.code(400).send({ ok: false, error: 'invalid_phone' });

      const lead = await store.add({ name: cleanText(name), phone: normalized, comment: cleanText(comment) });
      req.log.info({ leadId: lead.id }, 'новая заявка');

      // Заявка уже сохранена. Если Telegram недоступен, посетителю всё равно отвечаем «принято».
      void notifier.notifyLead(lead).catch((err) => req.log.error({ err }, 'не удалось уведомить в Telegram'));

      return { ok: true };
    },
  );

  return { app, notifier };
}
