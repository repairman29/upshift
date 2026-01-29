import chalk from "chalk";
import ora from "ora";
import { existsSync, readFileSync } from "fs";
import path from "path";
import semver from "semver";
import { runCommand } from "./exec.js";
import { consumeCredit } from "./credits.js";

export type ExplainOptions = {
  cwd: string;
  packageName: string;
  fromVersion?: string;
  toVersion?: string;
};

export async function runExplain(options: ExplainOptions): Promise<void> {
  await consumeCredit("explain");
  const spinner = ora(`Explaining ${options.packageName}...`).start();
  try {
    const currentVersion =
      options.fromVersion ?? getCurrentVersion(options.cwd, options.packageName);
    const targetVersion =
      options.toVersion ?? (await getLatestVersion(options.cwd, options.packageName));

    const majorDelta = getMajorDelta(currentVersion, targetVersion);
    const packageInfo = await getPackageInfo(options.cwd, options.packageName);

    spinner.succeed("Explanation ready");

    process.stdout.write(chalk.bold(`${options.packageName}\n`));
    process.stdout.write(`Current: ${currentVersion ?? "unknown"}\n`);
    process.stdout.write(`Target:  ${targetVersion}\n`);

    if (majorDelta > 0) {
      process.stdout.write(
        chalk.yellow(
          `Potential breaking changes: major version increase (${majorDelta}).\n`
        )
      );
    } else {
      process.stdout.write(chalk.green("No major version bump detected.\n"));
    }

    if (packageInfo.homepage) {
      process.stdout.write(`Homepage: ${packageInfo.homepage}\n`);
    }
    if (packageInfo.repository) {
      process.stdout.write(`Repository: ${packageInfo.repository}\n`);
    }
    if (packageInfo.bugs) {
      process.stdout.write(`Issues: ${packageInfo.bugs}\n`);
    }

    process.stdout.write(
      chalk.gray(
        "\nTip: run `upshift upgrade <package>` to apply the upgrade and generate migration changes.\n"
      )
    );
  } catch (error) {
    spinner.fail("Explain failed");
    throw error;
  }
}

function getCurrentVersion(cwd: string, packageName: string): string | undefined {
  const packageJsonPath = path.join(cwd, "package.json");
  if (!existsSync(packageJsonPath)) return undefined;

  const raw = readFileSync(packageJsonPath, "utf8");
  const pkg = JSON.parse(raw) as {
    dependencies?: Record<string, string>;
    devDependencies?: Record<string, string>;
    peerDependencies?: Record<string, string>;
  };

  return (
    pkg.dependencies?.[packageName] ??
    pkg.devDependencies?.[packageName] ??
    pkg.peerDependencies?.[packageName]
  );
}

async function getLatestVersion(cwd: string, packageName: string): Promise<string> {
  const result = await runCommand("npm", ["view", packageName, "version"], cwd);
  return result.stdout.trim();
}

function getMajorDelta(
  fromVersion: string | undefined,
  toVersion: string
): number {
  if (!fromVersion) return 0;
  const cleanFrom = semver.coerce(fromVersion)?.version;
  const cleanTo = semver.coerce(toVersion)?.version;
  if (!cleanFrom || !cleanTo) return 0;
  const fromMajor = semver.major(cleanFrom);
  const toMajor = semver.major(cleanTo);
  return Math.max(0, toMajor - fromMajor);
}

async function getPackageInfo(
  cwd: string,
  packageName: string
): Promise<{ homepage?: string; repository?: string; bugs?: string }> {
  const result = await runCommand(
    "npm",
    ["view", packageName, "homepage", "repository.url", "bugs.url", "--json"],
    cwd,
    [0, 1]
  );
  if (!result.stdout.trim()) return {};
  const parsed = JSON.parse(result.stdout) as {
    homepage?: string;
    "repository.url"?: string;
    "bugs.url"?: string;
  };

  return {
    homepage: parsed.homepage,
    repository: parsed["repository.url"],
    bugs: parsed["bugs.url"],
  };
}
