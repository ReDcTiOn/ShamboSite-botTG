import assert from 'node:assert/strict';
import { test } from 'node:test';
import { formatPhone, normalizePhone } from '../src/phone.js';

test('normalizePhone приводит разные записи к +7XXXXXXXXXX', () => {
  assert.equal(normalizePhone('+7 (900) 123-45-67'), '+79001234567');
  assert.equal(normalizePhone('8 900 123 45 67'), '+79001234567');
  assert.equal(normalizePhone('9001234567'), '+79001234567');
  assert.equal(normalizePhone('+7 (4212) 20-60-06'), '+74212206006');
});

test('normalizePhone отклоняет мусор и неполные номера', () => {
  assert.equal(normalizePhone(''), null);
  assert.equal(normalizePhone('12345'), null);
  assert.equal(normalizePhone('+1 202 555 0100'), null);
  assert.equal(normalizePhone('abc'), null);
});

test('formatPhone делает читаемый вид', () => {
  assert.equal(formatPhone('+79001234567'), '+7 (900) 123-45-67');
});
