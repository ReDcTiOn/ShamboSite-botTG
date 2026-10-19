/** Только цифры из строки. */
export const phoneDigits = (raw: string): string => raw.replace(/\D/g, '');

/** Маска ввода: пока человек печатает, превращает цифры в «+7 (900) 123-45-67». */
export function formatPhoneInput(raw: string): string {
  let d = phoneDigits(raw);
  if (!d) return '';
  if (d.startsWith('8') || d.startsWith('7')) d = d.slice(1);
  d = d.slice(0, 10);
  let out = '+7';
  if (d.length > 0) out += ` (${d.slice(0, 3)}`;
  if (d.length >= 3) out += ')';
  if (d.length > 3) out += ` ${d.slice(3, 6)}`;
  if (d.length > 6) out += `-${d.slice(6, 8)}`;
  if (d.length > 8) out += `-${d.slice(8, 10)}`;
  return out;
}

/** Номер введён полностью: +7 и десять цифр. */
export const isCompletePhone = (formatted: string): boolean => phoneDigits(formatted).length === 11;
