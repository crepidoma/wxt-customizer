import path from 'node:path';
import { scriptsToSet } from './config.js';
import { readJson, writeJson } from './fs.js';
import type { PackageJson } from './types.js';

export async function updatePackageJson(targetDir: string, packageName: string, dryRun: boolean): Promise<string> {
  const packagePath = path.join(targetDir, 'package.json');
  const packageJson = await readJson<PackageJson>(packagePath);

  await writeJson(
    packagePath,
    {
      ...packageJson,
      name: packageName,
      scripts: {
        ...packageJson.scripts,
        ...scriptsToSet,
      },
    },
    dryRun,
  );

  return packagePath;
}
