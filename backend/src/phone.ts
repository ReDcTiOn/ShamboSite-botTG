/** Приводит российский номер к виду +7XXXXXXXXXX. Возвращает null, если номер не похож на российский. */
export function normalizePhone(raw: string): string | null {
  const digits = raw.replace(/\D/g, '');
  if (digits.length === 11 && (digits.startsWith('7') || digits.startsWith('8'))) return `+7${digits.slice(1)}`;
  if (digits.length === 10) return `+7${digits}`;
  return null;
}

/** +79001234567 -> +7 (900) 123-45-67 */
export function formatPhone(e164: string): string {
  const d = e164.replace(/\D/g, '').slice(-10);
  return `+7 (${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6, 8)}-${d.slice(8, 10)}`;
}
