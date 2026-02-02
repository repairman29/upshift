/**
 * Ecosystem detection: node (npm/yarn/pnpm), python (pip/poetry), ruby (bundler), go.
 */

import { existsSync } from "fs";
import path from "path";
import { runCommand } from "./exec.js";

export type Ecosystem = "node" | "python" | "ruby" | "go";

export function detectEcosystem(cwd: string): Ecosystem {
  const pkgJson = path.join(cwd, "package.json");
  const pyProject = path.join(cwd, "pyproject.toml");
  const requirementsTxt = path.join(cwd, "requirements.txt");
  const gemfile = path.join(cwd, "Gemfile");
  const goMod = path.join(cwd, "go.mod");

  if (existsSync(pkgJson) || existsSync(path.join(cwd, "package-lock.json")) || existsSync(path.join(cwd, "yarn.lock")) || existsSync(path.join(cwd, "pnpm-lock.yaml"))) {
    return "node";
  }
  if (existsSync(pyProject) || existsSync(requirementsTxt)) {
    return "python";
  }
  if (existsSync(gemfile)) {
    return "ruby";
  }
  if (existsSync(goMod)) {
    return "go";
  }

  return "node"; // default
}

export type OutdatedEntry = {
  name: string;
  current: string;
  wanted: string;
  latest: string;
  type?: string;
};

/** Scan Python (pip list --outdated or poetry). */
export async function getPythonOutdated(cwd: string): Promise<OutdatedEntry[]> {
  if (existsSync(path.join(cwd, "pyproject.toml"))) {
    try {
      const result = await runCommand("poetry", ["show", "--outdated"], cwd, [0, 1]);
      const lines = result.stdout.trim().split("\n");
      const entries: OutdatedEntry[] = [];
      let currentName = "";
      let currentVersion = "";
      let latestVersion = "";
      for (const line of lines) {
        const match = line.match(/^(\S+)\s+(\S+)\s+(\S+)/);
        if (match) {
          currentName = match[1];
          currentVersion = match[2];
          latestVersion = match[3];
          entries.push({
            name: currentName,
            current: currentVersion,
            wanted: latestVersion,
            latest: latestVersion,
          });
        }
      }
      return entries;
    } catch {
      // fallback to pip
    }
  }
  try {
    const result = await runCommand("pip", ["list", "--outdated", "--format=json"], cwd, [0, 1]);
    const parsed = JSON.parse(result.stdout || "[]") as Array<{ name: string; version: string; latest_version?: string }>;
    return parsed.map((p) => ({
      name: p.name,
      current: p.version,
      wanted: p.latest_version ?? p.version,
      latest: p.latest_version ?? p.version,
    }));
  } catch {
    return [];
  }
}

/** Scan Ruby (bundle outdated). */
export async function getRubyOutdated(cwd: string): Promise<OutdatedEntry[]> {
  try {
    const result = await runCommand("bundle", ["outdated", "--strict", "--parseable"], cwd, [0, 1]);
    const entries: OutdatedEntry[] = [];
    for (const line of result.stdout.trim().split("\n")) {
      const match = line.match(/^(\S+)\s+\(.*?(\d+\.\d+.*?)\)\s+.*?(\d+\.\d+.*?)\)/);
      if (match) {
        entries.push({
          name: match[1],
          current: match[2],
          wanted: match[3],
          latest: match[3],
        });
      }
    }
    return entries;
  } catch {
    return [];
  }
}

/** Scan Go (go list -m -u all). Output is one JSON object per line. */
export async function getGoOutdated(cwd: string): Promise<OutdatedEntry[]> {
  try {
    const result = await runCommand("go", ["list", "-m", "-u", "-json", "all"], cwd, [0, 1]);
    const entries: OutdatedEntry[] = [];
    for (const line of result.stdout.trim().split("\n")) {
      if (!line.trim()) continue;
      try {
        const obj = JSON.parse(line) as { Path?: string; Version?: string; Update?: { Version: string } };
        if (obj.Path && obj.Version && obj.Update?.Version && obj.Update.Version !== obj.Version) {
          entries.push({
            name: obj.Path,
            current: obj.Version,
            wanted: obj.Update.Version,
            latest: obj.Update.Version,
          });
        }
      } catch {
        // skip
      }
    }
    return entries;
  } catch {
    return [];
  }
}
