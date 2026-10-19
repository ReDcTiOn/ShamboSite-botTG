import { loadConfig } from './config.js';
import { LeadStore } from './leads.js';
import { buildServer } from './server.js';
import { createNotifier } from './telegram.js';

async function main() {
  const config = loadConfig();
  const store = new LeadStore(config.DATA_DIR);
  await store.init();

  const purge = async () => {
    const removed = await store.purgeOlderThan(config.LEADS_RETENTION_DAYS);
    if (removed > 0) console.log(`Удалено заявок старше ${config.LEADS_RETENTION_DAYS} дн.: ${removed}`);
  };
  await purge();
  setInterval(() => void purge().catch((err) => console.error('Не удалось очистить старые заявки:', err)), 86_400_000).unref();

  const { app, notifier } = await buildServer({
    config,
    store,
    createNotifier: (log) => createNotifier({ token: config.TELEGRAM_BOT_TOKEN, chatIds: config.TELEGRAM_CHAT_IDS, store, log }),
  });

  await notifier.start();
  await app.listen({ port: config.PORT, host: config.HOST });

  const shutdown = async (signal: string) => {
    app.log.info(`получен ${signal}, останавливаемся`);
    await app.close();
    await notifier.stop();
    process.exit(0);
  };
  process.on('SIGTERM', () => void shutdown('SIGTERM'));
  process.on('SIGINT', () => void shutdown('SIGINT'));
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
