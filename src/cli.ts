import { input } from '@inquirer/prompts';
import { Command } from 'commander';
import path from 'node:path';
import process from 'node:process';
import { packageManagerNames } from './config.js';
import type { CliOptions, PackageManager } from './types.js';
import { isPackageManager } from './package-manager.js';

type RawOptions = {
  dir: string;
  name?: string;
  pm?: string;
  dryRun: boolean;
  overwrite: boolean;
  install: boolean;
};

export function createProgram(): Command {
  return new Command()
    .name('wxt-customizer')
    .description('Apply personal customizations after creating a WXT React project.')
    .option('--name <name>', 'package.json name. If omitted, prompt with the current directory name as the default.')
    .option('--dir <path>', 'target WXT project directory', process.cwd())
    .option('--pm <pm>', 'package manager to use: npm, yarn, pnpm, or bun')
    .option('--dry-run', 'print planned changes without writing files or installing dependencies', false)
    .option('--no-overwrite', 'keep existing overlay files unchanged')
    .option('--no-install', 'skip dependency installation commands')
    .showHelpAfterError();
}

export function parseOptions(argv = process.argv): CliOptions {
  const program = createProgram();
  program.parse(argv);
  return normalizeOptions(program.opts<RawOptions>());
}

function normalizeOptions(rawOptions: RawOptions): CliOptions {
  const pm = normalizePackageManager(rawOptions.pm);

  return {
    dir: path.resolve(rawOptions.dir),
    name: rawOptions.name,
    dryRun: rawOptions.dryRun,
    overwrite: rawOptions.overwrite,
    install: rawOptions.install,
    pm,
  };
}

function normalizePackageManager(value: string | undefined): PackageManager | undefined {
  if (value === undefined) {
    return undefined;
  }
  if (isPackageManager(value)) {
    return value;
  }

  throw new Error(`Unsupported package manager: ${value}. Expected one of: ${packageManagerNames.join(', ')}`);
}

export async function resolvePackageName(targetDir: string, explicitName: string | undefined): Promise<string> {
  if (explicitName !== undefined) {
    return explicitName;
  }

  const defaultName = path.basename(targetDir);
  if (!process.stdin.isTTY || !process.stdout.isTTY) {
    return defaultName;
  }

  return input({
    message: 'Package name',
    default: defaultName,
    required: true,
  });
}
