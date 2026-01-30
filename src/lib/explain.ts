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
  json?: boolean;
  risk?: boolean;
  changelog?: boolean;
};

export type RiskLevel = "low" | "medium" | "high";

export type RiskAssessment = {
  level: RiskLevel;
  majorDelta: number;
  hasVulnerabilities: boolean;
  weeklyDownloads: number;
  reasons: string[];
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

    // Risk assessment (always compute for JSON, or when --risk)
    let risk: RiskAssessment | undefined;
    if (options.risk || options.json) {
      risk = await assessRisk(options.cwd, options.packageName, currentVersion, targetVersion);
    }

    // Changelog (when --changelog)
    let changelog: string | null = null;
    if (options.changelog) {
      changelog = await fetchChangelog(options.packageName, packageInfo.repository);
    }

    spinner.succeed("Explanation ready");

    if (options.json) {
      const out = {
        package: options.packageName,
        currentVersion: currentVersion ?? null,
        targetVersion,
        majorDelta,
        breakingChanges: majorDelta > 0,
        risk: risk ?? null,
        homepage: packageInfo.homepage ?? null,
        repository: packageInfo.repository ?? null,
        bugs: packageInfo.bugs ?? null,
        changelog: changelog ?? null,
      };
      process.stdout.write(JSON.stringify(out) + "\n");
      return;
    }

    // Risk-only mode: print one line and exit
    if (options.risk && risk) {
      const color =
        risk.level === "high" ? chalk.red : risk.level === "medium" ? chalk.yellow : chalk.green;
      process.stdout.write(
        `${options.packageName} ${currentVersion ?? "?"} → ${targetVersion}: ${color(risk.level.toUpperCase())}\n`
      );
      risk.reasons.forEach((r) => process.stdout.write(`  - ${r}\n`));
      return;
    }

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

    // Changelog output
    if (options.changelog && changelog) {
      process.stdout.write(chalk.bold("\nChangelog (recent releases):\n"));
      process.stdout.write(changelog + "\n");
    } else if (options.changelog && !changelog) {
      process.stdout.write(chalk.gray("\nNo changelog found.\n"));
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

async function getWeeklyDownloads(packageName: string): Promise<number> {
  try {
    const res = await fetch(
      `https://api.npmjs.org/downloads/point/last-week/${encodeURIComponent(packageName)}`
    );
    if (!res.ok) return 0;
    const data = (await res.json()) as { downloads?: number };
    return data.downloads ?? 0;
  } catch {
    return 0;
  }
}

async function hasKnownVulnerabilities(
  cwd: string,
  packageName: string,
  version: string
): Promise<boolean> {
  try {
    const result = await runCommand(
      "npm",
      ["audit", "--json", "--package-lock-only"],
      cwd,
      [0, 1]
    );
    if (!result.stdout.trim()) return false;
    const audit = JSON.parse(result.stdout) as {
      vulnerabilities?: Record<string, unknown>;
    };
    return Boolean(audit.vulnerabilities?.[packageName]);
  } catch {
    return false;
  }
}

export async function assessRisk(
  cwd: string,
  packageName: string,
  fromVersion: string | undefined,
  toVersion: string
): Promise<RiskAssessment> {
  const majorDelta = getMajorDelta(fromVersion, toVersion);
  const weeklyDownloads = await getWeeklyDownloads(packageName);
  const hasVulns = await hasKnownVulnerabilities(cwd, packageName, toVersion);

  const reasons: string[] = [];
  let level: RiskLevel = "low";

  if (majorDelta >= 2) {
    level = "high";
    reasons.push(`Major version jump of ${majorDelta}`);
  } else if (majorDelta === 1) {
    level = "medium";
    reasons.push("Major version bump (potential breaking changes)");
  }

  if (hasVulns) {
    level = "high";
    reasons.push("Known vulnerabilities in current version");
  }

  if (weeklyDownloads < 1000) {
    if (level === "low") level = "medium";
    reasons.push(`Low popularity (${weeklyDownloads.toLocaleString()} weekly downloads)`);
  } else if (weeklyDownloads > 1_000_000) {
    reasons.push(`High popularity (${weeklyDownloads.toLocaleString()} weekly downloads)`);
  }

  if (reasons.length === 0) {
    reasons.push("Minor or patch update, no known issues");
  }

  return { level, majorDelta, hasVulnerabilities: hasVulns, weeklyDownloads, reasons };
}

export async function fetchChangelog(
  packageName: string,
  repository?: string
): Promise<string | null> {
  if (!repository) return null;

  // Extract GitHub owner/repo from repository URL
  const match = repository.match(/github\.com[/:]([^/]+)\/([^/.]+)/);
  if (!match) return null;

  const [, owner, repo] = match;

  // Try GitHub releases API first
  try {
    const res = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/releases?per_page=5`,
      { headers: { Accept: "application/vnd.github.v3+json" } }
    );
    if (res.ok) {
      const releases = (await res.json()) as Array<{ tag_name: string; name: string; body: string }>;
      if (releases.length > 0) {
        const summary = releases
          .slice(0, 3)
          .map((r) => {
            const title = r.name || r.tag_name;
            const body = r.body?.slice(0, 300) ?? "";
            return `## ${title}\n${body}${body.length >= 300 ? "..." : ""}`;
          })
          .join("\n\n");
        return summary;
      }
    }
  } catch {
    // fall through
  }

  // Try raw CHANGELOG.md
  try {
    const res = await fetch(
      `https://raw.githubusercontent.com/${owner}/${repo}/HEAD/CHANGELOG.md`
    );
    if (res.ok) {
      const text = await res.text();
      return text.slice(0, 2000) + (text.length > 2000 ? "\n..." : "");
    }
  } catch {
    // fall through
  }

  return null;
}
