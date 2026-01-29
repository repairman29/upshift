import chalk from "chalk";
import ora from "ora";
import { existsSync, mkdirSync, readFileSync, copyFileSync, readdirSync } from "fs";
import path from "path";
import { runCommand } from "./exec.js";

export type UpgradeOptions = {
  cwd: string;
  packageName: string;
  toVersion?: string;
  dryRun: boolean;
};

export async function runUpgrade(options: UpgradeOptions): Promise<void> {
  const spinner = ora(`Upgrading ${options.packageName}...`).start();
  try {
    const packageManager = detectPackageManager(options.cwd);
    if (packageManager !== "npm") {
      throw new Error("Only npm is supported for upgrade in this MVP.");
    }

    const target = options.toVersion ?? "latest";
    const backupDir = createBackup(options.cwd);

    if (options.dryRun) {
      spinner.succeed("Dry run complete");
      process.stdout.write(
        [
          `Package manager: ${packageManager}`,
          `Command: npm install ${options.packageName}@${target}`,
          `Backup dir: ${backupDir}`,
          "Tests: npm test (if configured)",
        ].join("\n") + "\n"
      );
      return;
    }

    await runCommand(
      "npm",
      ["install", `${options.packageName}@${target}`],
      options.cwd
    );

    process.stdout.write(
      chalk.yellow(
        "Migration step not implemented yet. This MVP only upgrades the dependency.\n"
      )
    );

    const testScript = getTestScript(options.cwd);
    if (testScript) {
      process.stdout.write(chalk.gray("Running tests...\n"));
      await runCommand("npm", ["test"], options.cwd);
      process.stdout.write(chalk.green("Tests passed.\n"));
    } else {
      process.stdout.write(
        chalk.gray("No test script configured. Skipping tests.\n")
      );
    }

    spinner.succeed("Upgrade complete");
  } catch (error) {
    spinner.fail("Upgrade failed");
    tryRollback(options.cwd);
    throw error;
  }
}

function detectPackageManager(cwd: string): "npm" | "yarn" | "pnpm" {
  const pnpmLock = path.join(cwd, "pnpm-lock.yaml");
  const yarnLock = path.join(cwd, "yarn.lock");
  const npmLock = path.join(cwd, "package-lock.json");
  const pkgJson = path.join(cwd, "package.json");

  if (existsSync(pnpmLock)) return "pnpm";
  if (existsSync(yarnLock)) return "yarn";
  if (existsSync(npmLock)) return "npm";
  if (existsSync(pkgJson)) return "npm";

  throw new Error(
    "No package.json or lockfile found. Run in a project directory."
  );
}

function createBackup(cwd: string): string {
  const backupRoot = path.join(cwd, ".upshift", "backups");
  mkdirSync(backupRoot, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const backupDir = path.join(backupRoot, stamp);
  mkdirSync(backupDir, { recursive: true });

  const files = ["package.json", "package-lock.json"];
  for (const file of files) {
    const src = path.join(cwd, file);
    if (existsSync(src)) {
      copyFileSync(src, path.join(backupDir, file));
    }
  }

  return backupDir;
}

function getTestScript(cwd: string): string | null {
  const packageJsonPath = path.join(cwd, "package.json");
  if (!existsSync(packageJsonPath)) return null;
  const raw = readFileSync(packageJsonPath, "utf8");
  const pkg = JSON.parse(raw) as { scripts?: Record<string, string> };
  return pkg.scripts?.test ?? null;
}

function tryRollback(cwd: string): void {
  const backupRoot = path.join(cwd, ".upshift", "backups");
  if (!existsSync(backupRoot)) return;

  process.stdout.write(chalk.red("Attempting rollback...\n"));
  const entries = readdirSafe(backupRoot).sort().reverse();
  const latest = entries[0];
  if (!latest) return;

  const backupDir = path.join(backupRoot, latest);
  const files = ["package.json", "package-lock.json"];
  for (const file of files) {
    const src = path.join(backupDir, file);
    if (existsSync(src)) {
      copyFileSync(src, path.join(cwd, file));
    }
  }

  runCommand("npm", ["install"], cwd).catch(() => {
    process.stdout.write(
      chalk.red("Rollback npm install failed. Please reinstall manually.\n")
    );
  });
}

function readdirSafe(dir: string): string[] {
  try {
    return readdirSync(dir);
  } catch {
    return [];
  }
}
