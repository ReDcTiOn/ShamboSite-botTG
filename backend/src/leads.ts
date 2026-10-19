import { randomUUID } from 'node:crypto';
import { appendFile, mkdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';

export interface Lead {
  id: string;
  at: string;
  name: string;
  phone: string;
  comment: string;
}

/** Хранилище заявок: одна строка JSON на заявку (`leads.jsonl`). Для сайта-визитки этого достаточно. */
export class LeadStore {
  private readonly file: string;

  constructor(private readonly dir: string) {
    this.file = join(dir, 'leads.jsonl');
  }

  async init(): Promise<void> {
    await mkdir(this.dir, { recursive: true });
  }

  async add(input: Omit<Lead, 'id' | 'at'>): Promise<Lead> {
    const lead: Lead = { id: randomUUID(), at: new Date().toISOString(), ...input };
    await appendFile(this.file, `${JSON.stringify(lead)}\n`, 'utf8');
    return lead;
  }

  /** Последние n заявок, новые первыми. */
  async last(n: number): Promise<Lead[]> {
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
    return leads.slice(-n).reverse();
  }
}
