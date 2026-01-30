import chalk from "chalk";
import ora from "ora";
import { existsSync, mkdirSync, readFileSync, copyFileSync } from "fs";
import path from "path";
import semver from "semver";
import {
  detectPackageManager,
  getOutdatedPackages,
  installPackage,
  runTests,
  getLockfileName,
  type PackageManager,
} from "./package-manager.js";

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
    spinner.text = `Using ${packageManager}...`;

    // Get outdated packages
    const outdatedRaw = await getOutdatedPackages(options.cwd, packageManager);
    const outdated: UpgradeCandidate[] = outdatedRaw.map(pkg => ({
      ...pkg,
      upgradeType: getUpgradeType(pkg.current, pkg.latest),
      target: pkg.latest,
    }));

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

    spinner.succeed(`Found ${candidates.length} ${options.mode} upgrades (${packageManager})`);

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
    const backupDir = createBackup(options.cwd, packageManager);
    process.stdout.write(chalk.gray(`\nBackup created: ${backupDir}\n\n`));

    // Upgrade packages one by one
    let succeeded = 0;
    let failed = 0;

    for (const pkg of candidates) {
      const pkgSpinner = ora(`Upgrading ${pkg.name}...`).start();

      try {
        await installPackage(options.cwd, pkg.name, pkg.target, packageManager);
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
          await runTests(options.cwd, packageManager);
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

function getUpgradeType(current: string, target: string): "major" | "minor" | "patch" {
  const currentClean = semver.coerce(current)?.version;
  const targetClean = semver.coerce(target)?.version;

  if (!currentClean || !targetClean) return "major";

  if (semver.major(targetClean) > semver.major(currentClean)) return "major";
  if (semver.minor(targetClean) > semver.minor(currentClean)) return "minor";
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
    return candidates.filter(c => c.upgradeType !== "major").map(c => ({
      ...c,
      target: c.wanted,
    }));
  }

  if (mode === "patch") {
    return candidates.filter(c => c.upgradeType === "patch").map(c => ({
      ...c,
      target: c.wanted,
    }));
  }

  return candidates;
}

function createBackup(cwd: string, pm: PackageManager): string {
  const backupRoot = path.join(cwd, ".upshift", "backups");
  mkdirSync(backupRoot, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const backupDir = path.join(backupRoot, stamp);
  mkdirSync(backupDir, { recursive: true });

  // Always backup package.json and the relevant lockfile
  const files = ["package.json", getLockfileName(pm)];
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
