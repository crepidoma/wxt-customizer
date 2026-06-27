import { spawn } from 'node:child_process';
import path from 'node:path';
import process from 'node:process';
import { devDependencies, packageManagerLockfiles, packageManagerNames, runtimeDependencies } from './config.js';
import { pathExists, readJson } from './fs.js';
import type { PackageJson, PackageManager, ShellCommand } from './types.js';

export function isPackageManager(value: string): value is PackageManager {
  return packageManagerNames.includes(value as PackageManager);
}

export async function detectPackageManager(targetDir: string, explicitPackageManager: PackageManager | undefined): Promise<PackageManager> {
  if (explicitPackageManager !== undefined) {
    return explicitPackageManager;
  }

  const packageJson = await readJson<PackageJson>(path.join(targetDir, 'package.json'));
  const packageManagerFromManifest = packageJson.packageManager?.split('@')[0];
  if (packageManagerFromManifest !== undefined && isPackageManager(packageManagerFromManifest)) {
    return packageManagerFromManifest;
  }

  for (const [lockfile, packageManager] of packageManagerLockfiles) {
    if (await pathExists(path.join(targetDir, lockfile))) {
      return packageManager;
    }
  }

  const packageManagerFromUserAgent = process.env.npm_config_user_agent?.split('/')[0];
  if (packageManagerFromUserAgent !== undefined && isPackageManager(packageManagerFromUserAgent)) {
    return packageManagerFromUserAgent;
  }

  return 'npm';
}

export async function installDependencies(targetDir: string, packageManager: PackageManager, dryRun: boolean): Promise<void> {
  await runCommand(createAddCommand(packageManager, runtimeDependencies, false), targetDir, dryRun);
  await runCommand(createAddCommand(packageManager, devDependencies, true), targetDir, dryRun);
}

function createAddCommand(packageManager: PackageManager, packages: string[], dev: boolean): ShellCommand {
  switch (packageManager) {
    case 'npm':
      return { command: 'npm', args: ['install', ...(dev ? ['--save-dev'] : []), ...packages] };
    case 'yarn':
      return { command: 'yarn', args: ['add', ...(dev ? ['--dev'] : []), ...packages] };
    case 'pnpm':
      return { command: 'pnpm', args: ['add', '--ignore-scripts', ...(dev ? ['--save-dev'] : []), ...packages] };
    case 'bun':
      return { command: 'bun', args: ['add', ...(dev ? ['--dev'] : []), ...packages] };
  }
}

function formatCommand({ command, args }: ShellCommand): string {
  return [command, ...args].join(' ');
}

async function runCommand(shellCommand: ShellCommand, cwd: string, dryRun: boolean): Promise<void> {
  console.log(`${dryRun ? '[dry-run] ' : ''}${formatCommand(shellCommand)}`);
  if (dryRun) {
    return;
  }

  await new Promise<void>((resolve, reject) => {
    const child = spawn(shellCommand.command, shellCommand.args, {
      cwd,
      stdio: 'inherit',
    });

    child.on('error', reject);
    child.on('exit', (code) => {
      if (code === 0) {
        resolve();
        return;
      }
      reject(new Error(`${formatCommand(shellCommand)} failed with exit code ${code ?? 'unknown'}.`));
    });
  });
}

