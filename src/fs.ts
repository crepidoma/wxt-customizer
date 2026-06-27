import { readFile, readdir, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import type { JsonObject } from './types.js';

export async function readJson<T extends JsonObject>(filePath: string): Promise<T> {
  const text = await readFile(filePath, 'utf8');
  return JSON.parse(text) as T;
}

export async function writeJson(filePath: string, value: JsonObject, dryRun: boolean): Promise<void> {
  if (dryRun) {
    return;
  }

  await writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

export async function pathExists(filePath: string): Promise<boolean> {
  try {
    await stat(filePath);
    return true;
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT') {
      return false;
    }
    throw error;
  }
}

export async function* walkFiles(dir: string): AsyncGenerator<string> {
  const entries = await readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      yield* walkFiles(fullPath);
      continue;
    }
    if (entry.isFile()) {
      yield fullPath;
    }
  }
}
