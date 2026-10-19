import { z } from 'zod';

/** Пустая строка в .env (например, `PORT=`) считается «не задано». */
const blankToUndefined = (v: unknown) => (typeof v === 'string' && v.trim() === '' ? undefined : v);
const opt = <T extends z.ZodType>(schema: T) => z.preprocess(blankToUndefined, schema.optional());

const chatId = z.string().regex(/^-?\d+$/, 'chat id должен быть числом, например 123456789 или -1001234567890');

const schema = z.object({
  PORT: opt(z.coerce.number().int().min(1).max(65535)).transform((v) => v ?? 3000),
  HOST: opt(z.string()).transform((v) => v ?? '0.0.0.0'),
  DATA_DIR: opt(z.string()).transform((v) => v ?? './data'),
  LOG_LEVEL: opt(z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent'])).transform((v) => v ?? 'info'),
  RATE_LIMIT_MAX: opt(z.coerce.number().int().min(1)).transform((v) => v ?? 5),
  /** Сколько дней хранить заявки (должно совпадать с политикой на сайте, frontend/legal/operator.json). */
  LEADS_RETENTION_DAYS: opt(z.coerce.number().int().min(1)).transform((v) => v ?? 365),
  RATE_LIMIT_WINDOW: opt(z.string()).transform((v) => v ?? '1 hour'),
  TELEGRAM_BOT_TOKEN: opt(z.string().trim()),
  TELEGRAM_CHAT_IDS: opt(z.string())
    .transform((v) => (v ?? '').split(',').map((s) => s.trim()).filter(Boolean))
    .pipe(z.array(chatId)),
});

export type Config = z.infer<typeof schema>;

export function loadConfig(env: Record<string, string | undefined> = process.env): Config {
  const result = schema.safeParse(env);
  if (!result.success) {
    const problems = result.error.issues.map((i) => `  ${i.path.join('.') || '(env)'}: ${i.message}`).join('\n');
    throw new Error(`Неверные настройки окружения:\n${problems}`);
  }
  return result.data;
}
