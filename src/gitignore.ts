import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { gitignoreAdditions } from './config.js';
import { pathExists } from './fs.js';

export async function patchGitignore(targetDir: string, dryRun: boolean): Promise<{ changed: boolean; path: string }> {
  const gitignorePath = path.join(targetDir, '.gitignore');
  if (!(await pathExists(gitignorePath))) {
    return { changed: false, path: gitignorePath };
  }

  const current = await readFile(gitignorePath, 'utf8');
  const existingLines = current.split(/\r?\n/);
  const missingLines = gitignoreAdditions.filter((line) => !existingLines.includes(line));

  if (missingLines.length === 0) {
    return { changed: false, path: gitignorePath };
  }

  if (!dryRun) {
    const separator = current.length > 0 && !current.endsWith('\n') ? '\n' : '';
    await writeFile(gitignorePath, `${current}${separator}${missingLines.join('\n')}\n`, 'utf8');
  }

  return { changed: true, path: gitignorePath };
}
