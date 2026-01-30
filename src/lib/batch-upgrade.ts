import chalk from "chalk";
import ora from "ora";
import { existsSync, mkdirSync, readFileSync, copyFileSync, readdirSync } from "fs";
import path from "path";
import semver from "semver";
import { runCommand } from "./exec.js";

export type BatchUpgradeOptions = {
  cwd: string;
  mode: "all" | "minor" | "patch";
  dryRun?: boolean;
  yes?: boolean;
  skipTests?: boolean;
};

export type UpgradeCandidate = {
  name: string;
  current: string;
  wanted: string;
  latest: string;
  upgradeType: "major" | "minor" | "patch";
  target: string;
};

export async function runBatchUpgrade(options: BatchUpgradeOptions): Promise<void> {
  const spinner = ora("Scanning for upgradeable dependencies...").start();

  try {
    const packageManager = detectPackageManager(options.cwd);
    if (packageManager !== "npm") {
      throw new Error("Only npm is supported for batch upgrade currently.");
    }

    // Get outdated packages
    const outdated = await getOutdatedDependencies(options.cwd);
    
    if (outdated.length === 0) {
      spinner.succeed("All dependencies are up to date!");
      return;
    }

    // Filter based on mode
    const candidates = filterCandidates(outdated, options.mode);

    if (candidates.length === 0) {
      spinner.succeed(`No ${options.mode} updates available`);
      process.stdout.write(chalk.gray(`Found ${outdated.length} outdated packages, but none match the ${options.mode} criteria.\n`));
      process.stdout.write(chalk.gray("Run `upshift upgrade --all` to see all available upgrades.\n"));
      return;
    }

    spinner.succeed(`Found ${candidates.length} ${options.mode} upgrades`);

    // Display candidates
    process.stdout.write(chalk.bold("\nPackages to upgrade:\n\n"));
    
    for (const pkg of candidates) {
      const typeColor = pkg.upgradeType === "major" ? chalk.red :
                        pkg.upgradeType === "minor" ? chalk.yellow : chalk.green;
      
      process.stdout.write(
        `  ${chalk.cyan(pkg.name.padEnd(30))} ${pkg.current.padEnd(12)} → ${typeColor(pkg.target.padEnd(12))} ${chalk.gray(`(${pkg.upgradeType})`)}\n`
      );
    }

    // Dry run mode
    if (options.dryRun) {
      process.stdout.write(chalk.gray("\nDry run - no changes applied.\n"));
      process.stdout.write(chalk.gray("Remove --dry-run to apply these upgrades.\n"));
      return;
    }

    // Confirm
    if (!options.yes) {
      const confirmed = await confirmUpgrade(candidates.length);
      if (!confirmed) {
        process.stdout.write(chalk.gray("\nNo changes applied.\n"));
        return;
      }
    }

    // Create backup
    const backupDir = createBackup(options.cwd);
    process.stdout.write(chalk.gray(`\nBackup created: ${backupDir}\n\n`));

    // Upgrade packages one by one
    let succeeded = 0;
    let failed = 0;

    for (const pkg of candidates) {
      const pkgSpinner = ora(`Upgrading ${pkg.name}...`).start();
      
      try {
        await runCommand(
          "npm",
          ["install", `${pkg.name}@${pkg.target}`],
          options.cwd
        );
        pkgSpinner.succeed(`${pkg.name} ${pkg.current} → ${pkg.target}`);
        succeeded++;
      } catch (error) {
        pkgSpinner.fail(`${pkg.name} failed to upgrade`);
        failed++;
      }
    }

    // Run tests if not skipped
    if (!options.skipTests) {
      const testScript = getTestScript(options.cwd);
      if (testScript) {
        const testSpinner = ora("Running tests...").start();
        try {
          await runCommand("npm", ["test"], options.cwd);
          testSpinner.succeed("Tests passed");
        } catch {
          testSpinner.fail("Tests failed - consider rolling back with `upshift rollback`");
        }
      }
    }

    // Summary
    process.stdout.write(chalk.bold("\nUpgrade Summary:\n"));
    process.stdout.write(chalk.green(`  ✔ ${succeeded} packages upgraded\n`));
    if (failed > 0) {
      process.stdout.write(chalk.red(`  ✖ ${failed} packages failed\n`));
    }
    process.stdout.write(chalk.gray("\nTip: Run `upshift rollback` to undo all changes.\n"));

  } catch (error) {
    spinner.fail("Batch upgrade failed");
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

  throw new Error("No package.json or lockfile found.");
}

async function getOutdatedDependencies(cwd: string): Promise<UpgradeCandidate[]> {
  const result = await runCommand("npm", ["outdated", "--json"], cwd, [0, 1]);
  const stdout = result.stdout.trim();
  if (!stdout) return [];

  const parsed = JSON.parse(stdout) as Record<
    string,
    { current: string; wanted: string; latest: string }
  >;

  return Object.entries(parsed).map(([name, info]) => {
    const upgradeType = getUpgradeType(info.current, info.latest);
    return {
      name,
      current: info.current,
      wanted: info.wanted,
      latest: info.latest,
      upgradeType,
      target: info.latest,
    };
  });
}

function getUpgradeType(current: string, target: string): "major" | "minor" | "patch" {
  const currentClean = semver.coerce(current)?.version;
  const targetClean = semver.coerce(target)?.version;
  
  if (!currentClean || !targetClean) return "major";

  const currentMajor = semver.major(currentClean);
  const currentMinor = semver.minor(currentClean);
  const targetMajor = semver.major(targetClean);
  const targetMinor = semver.minor(targetClean);

  if (targetMajor > currentMajor) return "major";
  if (targetMinor > currentMinor) return "minor";
  return "patch";
}

function filterCandidates(
  candidates: UpgradeCandidate[],
  mode: "all" | "minor" | "patch"
): UpgradeCandidate[] {
  if (mode === "all") {
    return candidates;
  }
  
  if (mode === "minor") {
    // Include minor and patch updates (exclude major)
    return candidates.filter(c => c.upgradeType !== "major").map(c => ({
      ...c,
      // For minor mode, target the "wanted" version (respects semver range)
      target: c.wanted,
    }));
  }
  
  if (mode === "patch") {
    // Only patch updates
    return candidates.filter(c => c.upgradeType === "patch").map(c => ({
      ...c,
      target: c.wanted,
    }));
  }

  return candidates;
}

function createBackup(cwd: string): string {
  const backupRoot = path.join(cwd, ".upshift", "backups");
  mkdirSync(backupRoot, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const backupDir = path.join(backupRoot, stamp);
  mkdirSync(backupDir, { recursive: true });

  const files = ["package.json", "package-lock.json", "yarn.lock", "pnpm-lock.yaml"];
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

async function confirmUpgrade(count: number): Promise<boolean> {
  const readline = await import("readline");
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(chalk.yellow(`\nUpgrade ${count} packages? [y/N] `), (answer) => {
      rl.close();
      resolve(answer.toLowerCase() === "y" || answer.toLowerCase() === "yes");
    });
  });
}
