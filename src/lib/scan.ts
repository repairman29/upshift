import chalk from "chalk";
import ora from "ora";
import { existsSync } from "fs";
import path from "path";
import { runCommand } from "./exec.js";

export type ScanOptions = {
  cwd: string;
  json: boolean;
};

export async function runScan(options: ScanOptions): Promise<void> {
  const spinner = ora("Scanning dependencies...").start();
  try {
    const packageManager = detectPackageManager(options.cwd);
    const outdated = await getOutdatedDependencies(packageManager, options.cwd);
    const vulnerabilities = await getVulnerabilities(
      packageManager,
      options.cwd
    );

    spinner.succeed("Scan complete");

    if (options.json) {
      process.stdout.write(
        JSON.stringify(
          {
            status: "ok",
            packageManager,
            outdated,
            vulnerabilities,
          },
          null,
          2
        )
      );
      process.stdout.write("\n");
      return;
    }

    renderHumanOutput(packageManager, outdated, vulnerabilities);
  } catch (error) {
    spinner.fail("Scan failed");
    throw error;
  }
}

type OutdatedEntry = {
  name: string;
  current: string;
  wanted: string;
  latest: string;
  type?: string;
};

type VulnerabilitySummary = {
  counts: Record<string, number>;
  items: Array<{
    name: string;
    severity: string;
    range?: string;
    fixAvailable?: boolean | { name: string; version: string; isSemVerMajor?: boolean };
    via?: Array<string | { name: string; title?: string }>;
  }>;
};

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

async function getOutdatedDependencies(
  packageManager: "npm" | "yarn" | "pnpm",
  cwd: string
): Promise<OutdatedEntry[]> {
  if (packageManager === "npm") {
    const result = await runCommand("npm", ["outdated", "--json"], cwd, [0, 1]);
    const stdout = result.stdout.trim();
    if (!stdout) return [];

    const parsed = JSON.parse(stdout) as Record<
      string,
      { current: string; wanted: string; latest: string; type?: string }
    >;

    return Object.entries(parsed).map(([name, info]) => ({
      name,
      current: info.current,
      wanted: info.wanted,
      latest: info.latest,
      type: info.type,
    }));
  }

  if (packageManager === "yarn") {
    // yarn outdated --json outputs NDJSON with type: "table"
    const result = await runCommand("yarn", ["outdated", "--json"], cwd, [0, 1]);
    const stdout = result.stdout.trim();
    if (!stdout) return [];

    const entries: OutdatedEntry[] = [];
    for (const line of stdout.split("\n")) {
      try {
        const obj = JSON.parse(line) as {
          type?: string;
          data?: { body?: Array<[string, string, string, string, string, string]> };
        };
        if (obj.type === "table" && obj.data?.body) {
          for (const row of obj.data.body) {
            // [name, current, wanted, latest, type, url]
            entries.push({
              name: row[0],
              current: row[1],
              wanted: row[2],
              latest: row[3],
              type: row[4],
            });
          }
        }
      } catch {
        // skip malformed lines
      }
    }
    return entries;
  }

  if (packageManager === "pnpm") {
    // pnpm outdated --json returns array
    const result = await runCommand("pnpm", ["outdated", "--json"], cwd, [0, 1]);
    const stdout = result.stdout.trim();
    if (!stdout) return [];

    const parsed = JSON.parse(stdout) as Record<
      string,
      { current: string; wanted: string; latest: string; dependencyType?: string }
    >;

    return Object.entries(parsed).map(([name, info]) => ({
      name,
      current: info.current,
      wanted: info.wanted,
      latest: info.latest,
      type: info.dependencyType,
    }));
  }

  return [];
}

async function getVulnerabilities(
  packageManager: "npm" | "yarn" | "pnpm",
  cwd: string
): Promise<VulnerabilitySummary | null> {
  if (packageManager === "npm") {
    const result = await runCommand("npm", ["audit", "--json"], cwd, [0, 1, 2]);
    const stdout = result.stdout.trim();
    if (!stdout) return null;

    const parsed = JSON.parse(stdout) as {
      metadata?: { vulnerabilities?: Record<string, number> };
      vulnerabilities?: Record<
        string,
        {
          name: string;
          severity: string;
          range?: string;
          fixAvailable?: boolean | { name: string; version: string; isSemVerMajor?: boolean };
          via?: Array<string | { name: string; title?: string }>;
        }
      >;
    };

    const counts = parsed.metadata?.vulnerabilities ?? {};
    const items = Object.values(parsed.vulnerabilities ?? {}).map((item) => ({
      name: item.name,
      severity: item.severity,
      range: item.range,
      fixAvailable: item.fixAvailable,
      via: item.via,
    }));

    return { counts, items };
  }

  if (packageManager === "yarn") {
    // yarn audit --json outputs NDJSON with advisories
    const result = await runCommand("yarn", ["audit", "--json"], cwd, [0, 1, 2, 4, 8, 16]);
    const stdout = result.stdout.trim();
    if (!stdout) return null;

    const counts: Record<string, number> = {};
    const items: VulnerabilitySummary["items"] = [];

    for (const line of stdout.split("\n")) {
      try {
        const obj = JSON.parse(line) as {
          type?: string;
          data?: {
            advisory?: {
              module_name?: string;
              severity?: string;
              vulnerable_versions?: string;
              title?: string;
            };
            vulnerabilities?: { info?: number; low?: number; moderate?: number; high?: number; critical?: number };
          };
        };
        if (obj.type === "auditAdvisory" && obj.data?.advisory) {
          const adv = obj.data.advisory;
          items.push({
            name: adv.module_name ?? "unknown",
            severity: adv.severity ?? "unknown",
            range: adv.vulnerable_versions,
            via: adv.title ? [adv.title] : undefined,
          });
        }
        if (obj.type === "auditSummary" && obj.data?.vulnerabilities) {
          const v = obj.data.vulnerabilities;
          if (v.info) counts["info"] = v.info;
          if (v.low) counts["low"] = v.low;
          if (v.moderate) counts["moderate"] = v.moderate;
          if (v.high) counts["high"] = v.high;
          if (v.critical) counts["critical"] = v.critical;
        }
      } catch {
        // skip malformed lines
      }
    }

    return { counts, items };
  }

  if (packageManager === "pnpm") {
    // pnpm audit --json
    const result = await runCommand("pnpm", ["audit", "--json"], cwd, [0, 1, 2]);
    const stdout = result.stdout.trim();
    if (!stdout) return null;

    try {
      const parsed = JSON.parse(stdout) as {
        metadata?: { vulnerabilities?: Record<string, number> };
        advisories?: Record<
          string,
          {
            module_name?: string;
            severity?: string;
            vulnerable_versions?: string;
            title?: string;
          }
        >;
      };

      const counts = parsed.metadata?.vulnerabilities ?? {};
      const items = Object.values(parsed.advisories ?? {}).map((adv) => ({
        name: adv.module_name ?? "unknown",
        severity: adv.severity ?? "unknown",
        range: adv.vulnerable_versions,
        via: adv.title ? [adv.title] : undefined,
      }));

      return { counts, items };
    } catch {
      return null;
    }
  }

  return null;
}

function renderHumanOutput(
  packageManager: string,
  outdated: OutdatedEntry[],
  vulnerabilities: VulnerabilitySummary | null
): void {
  process.stdout.write(chalk.bold(`Package manager: ${packageManager}\n`));
  process.stdout.write("\n");
  if (outdated.length === 0) {
    process.stdout.write(chalk.green("No outdated dependencies found.\n"));
  } else {
    process.stdout.write(chalk.yellow("Outdated dependencies:\n"));
    for (const entry of outdated) {
      process.stdout.write(
        `- ${entry.name}: ${entry.current} -> ${entry.wanted} (latest ${entry.latest})\n`
      );
    }
  }

  process.stdout.write("\n");
  if (!vulnerabilities) {
    process.stdout.write(chalk.gray("No vulnerability data available.\n"));
    return;
  }

  const countLines = Object.entries(vulnerabilities.counts).map(
    ([severity, count]) => `${severity}: ${count}`
  );
  process.stdout.write(
    chalk.red(`Vulnerabilities: ${countLines.join(", ") || "none"}\n`)
  );
  if (vulnerabilities.items.length === 0) {
    process.stdout.write(chalk.green("No vulnerability details found.\n"));
    return;
  }

  for (const item of vulnerabilities.items) {
    process.stdout.write(`- ${item.name} (${item.severity})\n`);
  }
}
