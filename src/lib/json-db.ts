import { promises as fs } from 'fs';
import path from 'path';
import { BaseRecord, CollectionFile } from './types';
import { deepClone, generateId, now } from './utils';

const DATA_DIR = path.resolve(process.cwd(), 'data');

export class JsonDBError extends Error {
  constructor(message: string, public code: string, public statusCode = 500) {
    super(message);
    this.name = 'JsonDBError';
  }
}

export async function readCollection<T extends BaseRecord>(collection: string): Promise<CollectionFile<T>> {
  const filePath = path.join(DATA_DIR, `${collection}.json`);
  const raw = await fs.readFile(filePath, 'utf8');
  return JSON.parse(raw) as CollectionFile<T>;
}

export async function writeCollection<T extends BaseRecord>(
  collection: string,
  data: CollectionFile<T>,
): Promise<void> {
  const filePath = path.join(DATA_DIR, `${collection}.json`);
  await fs.mkdir(DATA_DIR, { recursive: true });

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupPath = path.join(DATA_DIR, '_backups', `${collection}_${timestamp}.bak.json`);

  await fs.mkdir(path.join(DATA_DIR, '_backups'), { recursive: true });
  try {
    await fs.copyFile(filePath, backupPath);
  } catch {
    // Ignorar si no existe respaldo previo
  }

  await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8');
}

export async function getAll<T extends BaseRecord>(collection: string): Promise<T[]> {
  const data = await readCollection<T>(collection);
  return data.records;
}

export async function getById<T extends BaseRecord>(collection: string, id: string): Promise<T | null> {
  const data = await readCollection<T>(collection);
  return data.records.find((record) => record.id === id) ?? null;
}

export async function create<T extends BaseRecord>(collection: string, input: Omit<T, 'id' | 'createdAt' | 'updatedAt'>): Promise<T> {
  const data = await readCollection<T>(collection);
  const record = {
    ...deepClone(input),
    id: generateId(collection),
    createdAt: now(),
    updatedAt: now(),
  } as T;

  data.records.push(record);
  data._meta.lastModified = now();

  await writeCollection(collection, data);
  return record;
}

export async function update<T extends BaseRecord>(
  collection: string,
  id: string,
  partial: Partial<Omit<T, 'id' | 'createdAt' | 'updatedAt'>>,
): Promise<T> {
  const data = await readCollection<T>(collection);
  const target = data.records.find((record) => record.id === id);

  if (!target) {
    throw new JsonDBError(`Registro con id ${id} no encontrado`, 'NOT_FOUND', 404);
  }

  Object.assign(target, partial, { updatedAt: now() });
  data._meta.lastModified = now();

  await writeCollection(collection, data);
  return target;
}

export async function remove<T extends BaseRecord>(collection: string, id: string): Promise<boolean> {
  const data = await readCollection<T>(collection);
  const initialLength = data.records.length;
  data.records = data.records.filter((record) => record.id !== id);

  if (data.records.length === initialLength) {
    throw new JsonDBError(`Registro con id ${id} no encontrado`, 'NOT_FOUND', 404);
  }

  data._meta.lastModified = now();
  await writeCollection(collection, data);

  return true;
}
