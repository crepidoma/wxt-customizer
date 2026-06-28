#!/usr/bin/env node
import path from "node:path";
import { input } from "@inquirer/prompts";
import { Command } from "commander";
import process$1 from "node:process";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";
import { cp, mkdir, readFile, readdir, stat, writeFile } from "node:fs/promises";
//#region src/config.ts
const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const overlayDir = path.join(rootDir, "overlay");
const gitignoreAdditions = ["!.vscode/settings.json"];
const scriptsToSet = {
	format: "biome format --write .",
	lint: "biome check .",
	"lint:fix": "biome check --write ."
};
const runtimeDependencies = [
	"@1natsu/wait-element@^4.2.0",
	"@webext-core/messaging@^3.0.2",
	"@wxt-dev/i18n@^0.2.5"
];
const devDependencies = ["@biomejs/biome@2.4.16", "@crepidoma/wxt-sized-icons@1.1.0"];
const packageManagerNames = [
	"npm",
	"yarn",
	"pnpm",
	"bun"
];
const packageManagerLockfiles = [
	["pnpm-lock.yaml", "pnpm"],
	["yarn.lock", "yarn"],
	["package-lock.json", "npm"],
	["npm-shrinkwrap.json", "npm"],
	["bun.lock", "bun"],
	["bun.lockb", "bun"]
];
//#endregion
//#region src/fs.ts
async function readJson(filePath) {
	const text = await readFile(filePath, "utf8");
	return JSON.parse(text);
}
async function writeJson(filePath, value, dryRun) {
	if (dryRun) return;
	await writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}
async function pathExists(filePath) {
	try {
		await stat(filePath);
		return true;
	} catch (error) {
		if (error && typeof error === "object" && "code" in error && error.code === "ENOENT") return false;
		throw error;
	}
}
async function* walkFiles(dir) {
	const entries = await readdir(dir, { withFileTypes: true });
	for (const entry of entries) {
		const fullPath = path.join(dir, entry.name);
		if (entry.isDirectory()) {
			yield* walkFiles(fullPath);
			continue;
		}
		if (entry.isFile()) yield fullPath;
	}
}
//#endregion
//#region src/package-manager.ts
function isPackageManager(value) {
	return packageManagerNames.includes(value);
}
async function detectPackageManager(targetDir, explicitPackageManager) {
	if (explicitPackageManager !== void 0) return explicitPackageManager;
	const packageManagerFromManifest = (await readJson(path.join(targetDir, "package.json"))).packageManager?.split("@")[0];
	if (packageManagerFromManifest !== void 0 && isPackageManager(packageManagerFromManifest)) return packageManagerFromManifest;
	for (const [lockfile, packageManager] of packageManagerLockfiles) if (await pathExists(path.join(targetDir, lockfile))) return packageManager;
	const packageManagerFromUserAgent = process$1.env.npm_config_user_agent?.split("/")[0];
	if (packageManagerFromUserAgent !== void 0 && isPackageManager(packageManagerFromUserAgent)) return packageManagerFromUserAgent;
	return "npm";
}
async function installDependencies(targetDir, packageManager, dryRun) {
	logSection(dryRun, "Installing runtime dependencies");
	await runCommand(createAddCommand(packageManager, runtimeDependencies, false), targetDir, dryRun);
	logSectionEnd(dryRun, "Finished runtime dependency installation");
	logSection(dryRun, "Installing dev dependencies");
	await runCommand(createAddCommand(packageManager, devDependencies, true), targetDir, dryRun);
	logSectionEnd(dryRun, "Finished dev dependency installation");
}
async function runWxtPrepare(targetDir, packageManager, dryRun) {
	logSection(dryRun, "Running wxt prepare");
	await runCommand(createPrepareCommand(packageManager), targetDir, dryRun);
	logSectionEnd(dryRun, "Finished wxt prepare");
}
function createAddCommand(packageManager, packages, dev) {
	switch (packageManager) {
		case "npm": return {
			command: "npm",
			args: [
				"install",
				"--ignore-scripts",
				...dev ? ["--save-dev"] : [],
				...packages
			]
		};
		case "yarn": return {
			command: "yarn",
			args: [
				"add",
				"--ignore-scripts",
				...dev ? ["--dev"] : [],
				...packages
			]
		};
		case "pnpm": return {
			command: "pnpm",
			args: [
				"add",
				"--ignore-scripts",
				...dev ? ["--save-dev"] : [],
				...packages
			]
		};
		case "bun": return {
			command: "bun",
			args: [
				"add",
				"--ignore-scripts",
				...dev ? ["--dev"] : [],
				...packages
			]
		};
	}
}
function createPrepareCommand(packageManager) {
	switch (packageManager) {
		case "npm": return {
			command: "npm",
			args: [
				"exec",
				"--",
				"wxt",
				"prepare"
			]
		};
		case "yarn": return {
			command: "yarn",
			args: [
				"exec",
				"wxt",
				"prepare"
			]
		};
		case "pnpm": return {
			command: "pnpm",
			args: [
				"exec",
				"wxt",
				"prepare"
			]
		};
		case "bun": return {
			command: "bun",
			args: [
				"x",
				"wxt",
				"prepare"
			]
		};
	}
}
function formatCommand({ command, args }) {
	return [command, ...args].join(" ");
}
function logSection(dryRun, message) {
	console.log(`${prefix$1(dryRun)}--- ${message} ---`);
}
function logSectionEnd(dryRun, message) {
	console.log(`${prefix$1(dryRun)}--- ${message} ---\n`);
}
function prefix$1(dryRun) {
	return dryRun ? "[dry-run] " : "";
}
async function runCommand(shellCommand, cwd, dryRun) {
	console.log(`${prefix$1(dryRun)}${formatCommand(shellCommand)}`);
	if (dryRun) return;
	await new Promise((resolve, reject) => {
		const child = spawn(shellCommand.command, shellCommand.args, {
			cwd,
			stdio: "inherit"
		});
		child.on("error", reject);
		child.on("exit", (code) => {
			if (code === 0) {
				resolve();
				return;
			}
			reject(/* @__PURE__ */ new Error(`${formatCommand(shellCommand)} failed with exit code ${code ?? "unknown"}.`));
		});
	});
}
//#endregion
//#region src/cli.ts
function createProgram() {
	return new Command().name("wxt-customizer").description("Apply personal customizations after creating a WXT React project.").option("--name <name>", "package.json name. If omitted, prompt with the current directory name as the default.").option("--dir <path>", "target WXT project directory", process$1.cwd()).option("--pm <pm>", "package manager to use: npm, yarn, pnpm, or bun").option("--dry-run", "print planned changes without writing files or installing dependencies", false).option("--no-overwrite", "keep existing overlay files unchanged").option("--no-install", "skip dependency installation commands").showHelpAfterError();
}
function parseOptions(argv = process$1.argv) {
	const program = createProgram();
	program.parse(argv);
	return normalizeOptions(program.opts());
}
function normalizeOptions(rawOptions) {
	const pm = normalizePackageManager(rawOptions.pm);
	return {
		dir: path.resolve(rawOptions.dir),
		name: rawOptions.name,
		dryRun: rawOptions.dryRun,
		overwrite: rawOptions.overwrite,
		install: rawOptions.install,
		pm
	};
}
function normalizePackageManager(value) {
	if (value === void 0) return;
	if (isPackageManager(value)) return value;
	throw new Error(`Unsupported package manager: ${value}. Expected one of: ${packageManagerNames.join(", ")}`);
}
async function resolvePackageName(targetDir, explicitName) {
	if (explicitName !== void 0) return explicitName;
	const defaultName = path.basename(targetDir);
	if (!process$1.stdin.isTTY || !process$1.stdout.isTTY) return defaultName;
	return input({
		message: "Package name",
		default: defaultName,
		required: true
	});
}
//#endregion
//#region src/gitignore.ts
async function patchGitignore(targetDir, dryRun) {
	const gitignorePath = path.join(targetDir, ".gitignore");
	if (!await pathExists(gitignorePath)) return {
		changed: false,
		path: gitignorePath
	};
	const current = await readFile(gitignorePath, "utf8");
	const existingLines = current.split(/\r?\n/);
	const missingLines = gitignoreAdditions.filter((line) => !existingLines.includes(line));
	if (missingLines.length === 0) return {
		changed: false,
		path: gitignorePath
	};
	if (!dryRun) await writeFile(gitignorePath, `${current}${current.length > 0 && !current.endsWith("\n") ? "\n" : ""}${missingLines.join("\n")}\n`, "utf8");
	return {
		changed: true,
		path: gitignorePath
	};
}
//#endregion
//#region src/overlay.ts
async function copyOverlay(targetDir, options) {
	const copied = [];
	const skipped = [];
	for await (const sourcePath of walkFiles(overlayDir)) {
		const relativePath = path.relative(overlayDir, sourcePath);
		const destinationPath = path.join(targetDir, relativePath);
		if (await pathExists(destinationPath) && !options.overwrite) {
			skipped.push(relativePath);
			continue;
		}
		if (!options.dryRun) {
			await mkdir(path.dirname(destinationPath), { recursive: true });
			await cp(sourcePath, destinationPath, { force: options.overwrite });
		}
		copied.push(relativePath);
	}
	return {
		copied,
		skipped
	};
}
//#endregion
//#region src/package-json.ts
async function updatePackageJson(targetDir, packageName, dryRun) {
	const packagePath = path.join(targetDir, "package.json");
	const packageJson = await readJson(packagePath);
	await writeJson(packagePath, {
		...packageJson,
		name: packageName,
		scripts: {
			...packageJson.scripts,
			...scriptsToSet
		}
	}, dryRun);
	return packagePath;
}
//#endregion
//#region src/main.ts
async function main() {
	const options = parseOptions();
	if (!await pathExists(path.join(options.dir, "package.json"))) throw new Error(`package.json was not found in ${options.dir}. Run this from a WXT project root or pass --dir.`);
	const packageName = await resolvePackageName(options.dir, options.name);
	const packageManager = await detectPackageManager(options.dir, options.pm);
	const updatedPackagePath = await updatePackageJson(options.dir, packageName, options.dryRun);
	const gitignoreResult = await patchGitignore(options.dir, options.dryRun);
	const overlayResult = await copyOverlay(options.dir, options);
	reportFileChanges(options.dir, options.dryRun, updatedPackagePath, gitignoreResult, overlayResult);
	if (options.install) await installDependencies(options.dir, packageManager, options.dryRun);
	else console.log(`${prefix(options.dryRun)}Skipped dependency installation`);
	await runWxtPrepare(options.dir, packageManager, options.dryRun);
	console.log(`${prefix(options.dryRun)}=== WXT customizer finished ===`);
}
function reportFileChanges(targetDir, dryRun, updatedPackagePath, gitignoreResult, overlayResult) {
	console.log(`${prefix(dryRun)}Updated ${path.relative(targetDir, updatedPackagePath)}`);
	if (gitignoreResult.changed) console.log(`${prefix(dryRun)}Updated ${path.relative(targetDir, gitignoreResult.path)}`);
	for (const file of overlayResult.copied) console.log(`${prefix(dryRun)}Copied ${file}`);
	for (const file of overlayResult.skipped) console.log(`${prefix(dryRun)}Skipped ${file}`);
	console.log();
}
function prefix(dryRun) {
	return dryRun ? "[dry-run] " : "";
}
//#endregion
//#region src/index.ts
main().catch((error) => {
	console.error(error instanceof Error ? error.message : String(error));
	process.exit(1);
});
//#endregion
export {};
