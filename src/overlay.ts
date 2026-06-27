import { cp, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { overlayDir } from './config.js';
import { pathExists, walkFiles } from './fs.js';
import type { CliOptions, OverlayResult } from './types.js';

export async function copyOverlay(targetDir: string, options: Pick<CliOptions, 'dryRun' | 'overwrite'>): Promise<OverlayResult> {
  const copied: string[] = [];
  const skipped: string[] = [];

  for await (const sourcePath of walkFiles(overlayDir)) {
    const relativePath = path.relative(overlayDir, sourcePath);
    const destinationPath = path.join(targetDir, relativePath);
    const exists = await pathExists(destinationPath);

    if (exists && !options.overwrite) {
      skipped.push(relativePath);
      continue;
    }

    if (!options.dryRun) {
      await mkdir(path.dirname(destinationPath), { recursive: true });
      await cp(sourcePath, destinationPath, { force: options.overwrite });
    }

    copied.push(relativePath);
  }

  return { copied, skipped };
}
