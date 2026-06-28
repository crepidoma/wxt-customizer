# wxt-customizer

Personal post-init customizer for WXT React projects.

[日本語版](./README.ja.md)

## Usage

Create the WXT project first, then apply this customizer from the project directory.

```sh
pnpm dlx wxt@latest init my-extension --template react --pm pnpm
cd my-extension
pnpm dlx github:crepidoma/wxt-customizer
```

The CLI asks for `package.json#name`; the current directory name is used as the default.

## What It Changes

- Prompts for and updates `package.json#name`.
- Adds formatter/linter scripts to `package.json`.
- Detects npm, yarn, pnpm, or bun from `packageManager`, lockfiles, or the npm user agent; falls back to npm.
- Installs runtime and dev dependencies with the detected package manager's `add` command.
- Runs `wxt prepare` after dependency installation as the final command.
- Adds the `.vscode/settings.json` exception to WXT's generated `.gitignore`.
- Copies the files in `overlay/` into the target WXT project.
- Adds small `@webext-core/messaging`, `vault.debug`, and `@1natsu/wait-element` examples under `entrypoints/` and `utils/`.
- Keeps WXT-generated resources as the base, then applies only this repository's customizations.
- Builds the TypeScript CLI to `bin/index.mjs` with tsdown; runtime CLI libraries stay as package dependencies.

## Options

- `--name <name>`: Set `package.json#name` without prompting.
- `--dir <path>`: Target directory. Defaults to the current directory.
- `--pm <pm>`: Force `npm`, `yarn`, `pnpm`, or `bun`.
- `--dry-run`: Print planned changes without writing files or installing dependencies.
- `--no-overwrite`: Do not overwrite existing overlay files.
- `--no-install`: Skip dependency installation commands.

