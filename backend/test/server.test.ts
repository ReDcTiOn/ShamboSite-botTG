import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { after, before, test } from 'node:test';
import { loadConfig } from '../src/config.js';
import { LeadStore, type Lead } from '../src/leads.js';
import { buildServer } from '../src/server.js';
import { escapeHtml, formatLead, type Notifier } from '../src/telegram.js';

let dir: string;
const sent: Lead[] = [];
const fakeNotifier: Notifier = {
  async notifyLead(lead) {
    sent.push(lead);
  },
  async start() {},
  async stop() {},
};

before(async () => {
  dir = await mkdtemp(join(tmpdir(), 'shambo-test-'));
});
after(async () => {
  await rm(dir, { recursive: true, force: true });
});

async function makeApp(overrides: Record<string, string> = {}) {
  const config = loadConfig({ DATA_DIR: dir, RATE_LIMIT_MAX: '100', ...overrides });
  const store = new LeadStore(dir);
  await store.init();
  const { app } = await buildServer({ config, store, createNotifier: () => fakeNotifier, logger: false });
  return { app, store };
}

test('GET /api/health отвечает ok', async () => {
  const { app } = await makeApp();
  const res = await app.inject({ method: 'GET', url: '/api/health' });
  assert.equal(res.statusCode, 200);
  assert.deepEqual(res.json(), { ok: true });
  await app.close();
});

test('POST /api/callback сохраняет заявку и отправляет уведомление', async () => {
  const { app, store } = await makeApp();
  sent.length = 0;
  const res = await app.inject({
    method: 'POST',
    url: '/api/callback',
    payload: { name: '  Иван ', phone: '+7 (900) 123-45-67', comment: 'яма\nна 5 кубов', website: '', consent: true, consentVersion: '2026-01-01' },
  });
  assert.equal(res.statusCode, 200);
  assert.deepEqual(res.json(), { ok: true });

  const saved = await store.last(10);
  assert.equal(saved.length, 1);
  assert.equal(saved[0]?.name, 'Иван');
  assert.equal(saved[0]?.phone, '+79001234567');
  assert.equal(saved[0]?.comment, 'яма на 5 кубов');
  assert.equal(saved[0]?.consentVersion, '2026-01-01');
  await new Promise((r) => setImmediate(r));
  assert.equal(sent.length, 1);
  await app.close();
});

test('неверный телефон даёт 400 и ничего не сохраняет', async () => {
  const { app } = await makeApp();
  const res = await app.inject({ method: 'POST', url: '/api/callback', payload: { phone: '123', consent: true } });
  assert.equal(res.statusCode, 400);
  assert.equal(res.json().error, 'invalid_phone');
  await app.close();
});

test('ловушка для ботов: отвечаем ok, но не сохраняем', async () => {
  const { app, store } = await makeApp();
  const before = (await store.last(100)).length;
  sent.length = 0;
  const res = await app.inject({
    method: 'POST',
    url: '/api/callback',
    payload: { phone: '+79001234567', website: 'http://spam.example', consent: true },
  });
  assert.equal(res.statusCode, 200);
  assert.equal((await store.last(100)).length, before);
  assert.equal(sent.length, 0);
  await app.close();
});

test('слишком длинный комментарий отклоняется', async () => {
  const { app } = await makeApp();
  const res = await app.inject({
    method: 'POST',
    url: '/api/callback',
    payload: { phone: '+79001234567', comment: 'а'.repeat(401), consent: true },
  });
  assert.equal(res.statusCode, 400);
  await app.close();
});

test('ограничение частоты: после лимита приходит 429', async () => {
  const { app } = await makeApp({ RATE_LIMIT_MAX: '2' });
  const post = () => app.inject({ method: 'POST', url: '/api/callback', payload: { phone: '+79001234567', consent: true } });
  assert.equal((await post()).statusCode, 200);
  assert.equal((await post()).statusCode, 200);
  const third = await post();
  assert.equal(third.statusCode, 429);
  assert.equal(third.json().error, 'rate_limited');
  await app.close();
});

test('текст для Telegram экранирует HTML', () => {
  assert.equal(escapeHtml('<b>&</b>'), '&lt;b&gt;&amp;&lt;/b&gt;');
  const text = formatLead({ id: '1', at: '2026-01-01T00:00:00.000Z', name: '<i>x</i>', phone: '+79001234567', comment: '' });
  assert.ok(text.includes('&lt;i&gt;x&lt;/i&gt;'));
  assert.ok(text.includes('+7 (900) 123-45-67'));
});

test('loadConfig: пустые значения заменяются значениями по умолчанию, неверные chat id отклоняются', () => {
  const config = loadConfig({ PORT: '', TELEGRAM_CHAT_IDS: '123, -100456' });
  assert.equal(config.PORT, 3000);
  assert.equal(config.LEADS_RETENTION_DAYS, 365);
  assert.deepEqual(config.TELEGRAM_CHAT_IDS, ['123', '-100456']);
  assert.throws(() => loadConfig({ TELEGRAM_CHAT_IDS: 'abc' }), /chat id/);
});

test('без согласия заявка не принимается и не сохраняется', async () => {
  const { app, store } = await makeApp();
  const before = (await store.last(100)).length;
  sent.length = 0;
  const res = await app.inject({ method: 'POST', url: '/api/callback', payload: { phone: '+79001234567' } });
  assert.equal(res.statusCode, 400);
  assert.equal(res.json().error, 'consent_required');
  const res2 = await app.inject({ method: 'POST', url: '/api/callback', payload: { phone: '+79001234567', consent: false } });
  assert.equal(res2.statusCode, 400);
  assert.equal((await store.last(100)).length, before);
  assert.equal(sent.length, 0);
  await app.close();
});

test('срок хранения: старые заявки удаляются, свежие остаются', async () => {
  const folder = await mkdtemp(join(tmpdir(), 'shambo-purge-'));
  const store = new LeadStore(folder);
  await store.init();
  await store.add({ name: 'Первая', phone: '+79000000001', comment: '', consentVersion: 'v1' });
  await store.add({ name: 'Вторая', phone: '+79000000002', comment: '', consentVersion: 'v1' });
  const inFuture = Date.now() + 10 * 86_400_000; // через 10 дней обе заявки «старше 5 дней»
  assert.equal(await store.purgeOlderThan(5, inFuture), 2);
  assert.equal((await store.last(10)).length, 0);
  await store.add({ name: 'Новая', phone: '+79000000003', comment: '', consentVersion: 'v1' });
  assert.equal(await store.purgeOlderThan(5), 0);
  assert.equal((await store.last(10)).length, 1);
  await rm(folder, { recursive: true, force: true });
});
