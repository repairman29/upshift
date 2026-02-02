import chalk from "chalk";
import ora from "ora";
import { existsSync, mkdirSync, readFileSync, copyFileSync, readdirSync } from "fs";
import path from "path";
import semver from "semver";
import { runCommand } from "./exec.js";
import { loadConfig } from "./config.js";

export type UpgradeOptions = {
  cwd: string;
  packageName: string;
  toVersion?: string;
  dryRun: boolean;
  yes?: boolean;
};

export async function runUpgrade(options: UpgradeOptions): Promise<void> {
  const spinner = ora(`Upgrading ${options.packageName}...`).start();
  try {
    const packageManager = detectPackageManager(options.cwd);
    if (packageManager !== "npm") {
      throw new Error("Only npm is supported for upgrade in this MVP.");
    }

    const target = options.toVersion ?? "latest";
    const config = loadConfig(options.cwd);
    const approval = config.approval ?? { mode: "prompt" as const, requireFor: ["major"] };
    const requireApprovalForMajor = (approval.requireFor ?? ["major"]).includes("major");
    const approvalMode = approval.mode ?? "prompt";

    if (!options.dryRun && !options.yes && !config.autoConfirm && approvalMode === "prompt" && requireApprovalForMajor) {
      const currentVersion = getCurrentVersion(options.cwd, options.packageName);
      const targetVersion = target === "latest" ? await getLatestVersion(options.packageName, options.cwd) : target;
      const isMajor = currentVersion && targetVersion && isMajorBump(currentVersion, targetVersion);
      if (isMajor) {
        if (process.stdin.isTTY) {
          spinner.stop();
          const approved = await promptApproval(options.packageName, currentVersion, targetVersion);
          if (!approved) {
            process.stdout.write(chalk.gray("Upgrade skipped.\n"));
            return;
          }
          spinner.start(`Upgrading ${options.packageName}...`);
        } else {
          spinner.fail("Major upgrade requires approval (non-interactive). Use -y to apply anyway, or set approval.mode: none in .upshiftrc.json");
          process.exit(1);
        }
      }
    }

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

function getCurrentVersion(cwd: string, packageName: string): string | null {
  const pkgPath = path.join(cwd, "package.json");
  if (!existsSync(pkgPath)) return null;
  try {
    const raw = readFileSync(pkgPath, "utf8");
    const pkg = JSON.parse(raw) as { dependencies?: Record<string, string>; devDependencies?: Record<string, string> };
    const deps = { ...pkg.dependencies, ...pkg.devDependencies };
    const spec = deps[packageName];
    if (!spec) return null;
    const coerced = semver.coerce(spec);
    return coerced?.version ?? null;
  } catch {
    return null;
  }
}

async function getLatestVersion(packageName: string, cwd: string): Promise<string | null> {
  try {
    const result = await runCommand("npm", ["view", packageName, "version"], cwd, [0]);
    return result.stdout.trim() || null;
  } catch {
    return null;
  }
}

function isMajorBump(current: string, target: string): boolean {
  const c = semver.coerce(current)?.version;
  const t = semver.coerce(target)?.version;
  if (!c || !t) return true;
  return semver.major(t) > semver.major(c);
}

async function promptApproval(packageName: string, current: string, target: string): Promise<boolean> {
  const readline = await import("readline");
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(
      chalk.yellow(`Upgrade ${packageName} from ${current} to ${target} (major)? [y/N] `),
      (answer) => {
        rl.close();
        resolve(/^y/i.test(answer?.trim() ?? ""));
      }
    );
  });
}
