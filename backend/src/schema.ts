import { z } from 'zod';

/** То, что присылает форма на сайте. Поле `website` — ловушка для ботов: людям оно не видно. */
export const leadInputSchema = z.object({
  name: z.string().trim().max(60).optional().default(''),
  phone: z.string().trim().min(1).max(40),
  comment: z.string().trim().max(400).optional().default(''),
  website: z.string().max(200).optional().default(''),
});

export type LeadInput = z.infer<typeof leadInputSchema>;

/** Убирает управляющие символы и переносы строк, чтобы заявка не ломала сообщение в Telegram. */
export function cleanText(value: string): string {
  return value.replace(/[\u0000-\u001f\u007f]+/g, ' ').replace(/\s{2,}/g, ' ').trim();
}
