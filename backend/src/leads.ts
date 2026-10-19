import { randomUUID } from 'node:crypto';
import { appendFile, mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

export interface Lead {
  id: string;
  /** Когда заявка получена (она же момент, когда дано согласие). */
  at: string;
  name: string;
  phone: string;
  comment: string;
  /** Версия текста согласия, которое видел человек (дата утверждения документа). */
  consentVersion: string;
}

/** Хранилище заявок: одна строка JSON на заявку (`leads.jsonl`). Для сайта-визитки этого достаточно. */
export class LeadStore {
  private readonly file: string;
  /** Очередь операций: запись и очистка не мешают друг другу. */
  private queue: Promise<unknown> = Promise.resolve();

  constructor(private readonly dir: string) {
    this.file = join(dir, 'leads.jsonl');
  }

  async init(): Promise<void> {
    await mkdir(this.dir, { recursive: true });
  }

  private enqueue<T>(job: () => Promise<T>): Promise<T> {
    const run = this.queue.then(job, job);
    this.queue = run.catch(() => undefined);
    return run;
  }

  add(input: Omit<Lead, 'id' | 'at'>): Promise<Lead> {
    return this.enqueue(async () => {
      const lead: Lead = { id: randomUUID(), at: new Date().toISOString(), ...input };
      await appendFile(this.file, `${JSON.stringify(lead)}\n`, 'utf8');
      return lead;
    });
  }

  private async readAll(): Promise<Lead[]> {
    let raw: string;
    try {
      raw = await readFile(this.file, 'utf8');
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code === 'ENOENT') return [];
      throw err;
    }
    const leads: Lead[] = [];
    for (const line of raw.split('\n')) {
      if (!line.trim()) continue;
      try {
        leads.push(JSON.parse(line) as Lead);
      } catch {
        // битую строку пропускаем, остальные заявки не теряем
      }
    }
    return leads;
  }

  /** Последние n заявок, новые первыми. */
  async last(n: number): Promise<Lead[]> {
    return (await this.readAll()).slice(-n).reverse();
  }

  /** Удаляет заявки старше days дней (срок хранения из политики). Возвращает, сколько удалено. */
  purgeOlderThan(days: number, now: number = Date.now()): Promise<number> {
    return this.enqueue(async () => {
      const leads = await this.readAll();
      const border = now - days * 86_400_000;
      const kept = leads.filter((lead) => Date.parse(lead.at) >= border);
      const removed = leads.length - kept.length;
      if (removed === 0) return 0;
      const tmp = `${this.file}.tmp`;
      await writeFile(tmp, kept.map((lead) => `${JSON.stringify(lead)}\n`).join(''), 'utf8');
      await rename(tmp, this.file);
      return removed;
    });
  }
}
