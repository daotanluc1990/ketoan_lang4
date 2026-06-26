import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import type { DataRow, DataStore } from './store-interface';

const DATA_DIR = process.env.VERCEL
  ? path.join(os.tmpdir(), 'com-tam-lang-data')
  : path.join(process.cwd(), '.data');

async function ensureDir() {
  await fs.mkdir(DATA_DIR, { recursive: true });
}

function filePath(sheetName: string) {
  return path.join(DATA_DIR, `${sheetName}.json`);
}

export const localJsonStore: DataStore = {
  async read(sheetName: string): Promise<DataRow[]> {
    try {
      await ensureDir();
      const raw = await fs.readFile(filePath(sheetName), 'utf-8');
      return JSON.parse(raw) as DataRow[];
    } catch {
      return [];
    }
  },
  async readMany(sheetNames: string[]) {
    const entries = await Promise.all(sheetNames.map(async (sheetName) => [sheetName, await this.read(sheetName)] as const));
    return Object.fromEntries(entries) as Record<string, DataRow[]>;
  },
  async append(sheetName: string, rows: DataRow[]) {
    const current = await this.read(sheetName);
    await this.replace(sheetName, [...current, ...rows]);
  },
  async replace(sheetName: string, rows: DataRow[]) {
    await ensureDir();
    await fs.writeFile(filePath(sheetName), JSON.stringify(rows, null, 2), 'utf-8');
  }
};
