import assert from 'node:assert/strict';
import { test } from 'node:test';
import { formatPhoneInput, isCompletePhone } from './phone.ts';

test('маска телефона растёт вместе с вводом', () => {
  assert.equal(formatPhoneInput(''), '');
  assert.equal(formatPhoneInput('9'), '+7 (9');
  assert.equal(formatPhoneInput('900'), '+7 (900)');
  assert.equal(formatPhoneInput('9001234567'), '+7 (900) 123-45-67');
});

test('маска понимает 8 и +7 в начале и не пускает лишние цифры', () => {
  assert.equal(formatPhoneInput('89001234567'), '+7 (900) 123-45-67');
  assert.equal(formatPhoneInput('+7 900 123 45 67 99'), '+7 (900) 123-45-67');
  assert.equal(formatPhoneInput('+7'), '+7');
});

test('isCompletePhone требует все 10 цифр после +7', () => {
  assert.equal(isCompletePhone('+7 (900) 123-45-67'), true);
  assert.equal(isCompletePhone('+7 (900) 123-45'), false);
});
