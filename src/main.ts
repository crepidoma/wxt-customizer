import path from 'node:path';
import { parseOptions, resolvePackageName } from './cli.js';
import { pathExists } from './fs.js';
import { patchGitignore } from './gitignore.js';
import { copyOverlay } from './overlay.js';
import { detectPackageManager, installDependencies, runWxtPrepare } from './package-manager.js';
import { updatePackageJson } from './package-json.js';

export async function main(): Promise<void> {
  const options = parseOptions();
  const packagePath = path.join(options.dir, 'package.json');

  if (!(await pathExists(packagePath))) {
    throw new Error(`package.json was not found in ${options.dir}. Run this from a WXT project root or pass --dir.`);
  }

  const packageName = await resolvePackageName(options.dir, options.name);
  const packageManager = await detectPackageManager(options.dir, options.pm);

  const updatedPackagePath = await updatePackageJson(options.dir, packageName, options.dryRun);
  const gitignoreResult = await patchGitignore(options.dir, options.dryRun);
  const overlayResult = await copyOverlay(options.dir, options);

  reportFileChanges(options.dir, options.dryRun, updatedPackagePath, gitignoreResult, overlayResult);

  if (options.install) {
    await installDependencies(options.dir, packageManager, options.dryRun);
  } else {
    console.log(`${prefix(options.dryRun)}Skipped dependency installation`);
  }

  await runWxtPrepare(options.dir, packageManager, options.dryRun);
  console.log(`${prefix(options.dryRun)}=== WXT customizer finished ===`);
}

function reportFileChanges(
  targetDir: string,
  dryRun: boolean,
  updatedPackagePath: string,
  gitignoreResult: { changed: boolean; path: string },
  overlayResult: { copied: string[]; skipped: string[] },
): void {
  console.log(`${prefix(dryRun)}Updated ${path.relative(targetDir, updatedPackagePath)}`);

  if (gitignoreResult.changed) {
    console.log(`${prefix(dryRun)}Updated ${path.relative(targetDir, gitignoreResult.path)}`);
  }

  for (const file of overlayResult.copied) {
    console.log(`${prefix(dryRun)}Copied ${file}`);
  }

  for (const file of overlayResult.skipped) {
    console.log(`${prefix(dryRun)}Skipped ${file}`);
  }

  console.log();
}

function prefix(dryRun: boolean): string {
  return dryRun ? '[dry-run] ' : '';
}
