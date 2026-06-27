export type PackageManager = 'npm' | 'yarn' | 'pnpm' | 'bun';

export type JsonObject = Record<string, unknown>;

export type PackageJson = JsonObject & {
  name?: string;
  packageManager?: string;
  scripts?: Record<string, string>;
};

export type CliOptions = {
  dir: string;
  name?: string;
  dryRun: boolean;
  overwrite: boolean;
  install: boolean;
  pm?: PackageManager;
};

export type OverlayResult = {
  copied: string[];
  skipped: string[];
};

export type ShellCommand = {
  command: string;
  args: string[];
};
