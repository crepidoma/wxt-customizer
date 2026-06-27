import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { PackageManager } from './types.js';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

export const overlayDir = path.join(rootDir, 'overlay');

export const gitignoreAdditions = ['!.vscode/settings.json'];

export const scriptsToSet = {
  format: 'biome format --write .',
  lint: 'biome check .',
  'lint:fix': 'biome check --write .',
} satisfies Record<string, string>;

export const runtimeDependencies = ['@1natsu/wait-element@^4.2.0', '@webext-core/messaging@^3.0.2', '@wxt-dev/i18n@^0.2.5'];

export const devDependencies = ['@biomejs/biome@2.4.16', '@crepidoma/wxt-sized-icons@1.1.0'];

export const packageManagerNames = ['npm', 'yarn', 'pnpm', 'bun'] as const satisfies readonly PackageManager[];

export const packageManagerLockfiles = [
  ['pnpm-lock.yaml', 'pnpm'],
  ['yarn.lock', 'yarn'],
  ['package-lock.json', 'npm'],
  ['npm-shrinkwrap.json', 'npm'],
  ['bun.lock', 'bun'],
  ['bun.lockb', 'bun'],
] as const satisfies readonly (readonly [string, PackageManager])[];
