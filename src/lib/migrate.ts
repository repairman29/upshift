/**
 * Migration templates: discover and apply template steps (find/replace, package bumps).
 */

import { existsSync, readFileSync, readdirSync, writeFileSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

export type MigrationStep = {
  id: string;
  description: string;
  find?: string;
  replace?: string;
  package?: string;
  version?: string;
  note?: string;
};

export type MigrationTemplate = {
  name: string;
  description: string;
  from: string;
  to: string;
  package: string;
  steps: MigrationStep[];
  links?: string[];
};

const MIGRATIONS_DIR = "migrations";

function getMigrationsDir(): string {
  const cwd = process.cwd();
  const fromCwd = path.join(cwd, MIGRATIONS_DIR);
  if (existsSync(fromCwd)) return fromCwd;
  try {
    const dir = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "..", MIGRATIONS_DIR);
    if (existsSync(dir)) return dir;
  } catch {
    // ignore
  }
  return fromCwd;
}

/** Load a migration template from a JSON file path (custom template). */
export function loadTemplateFromFile(filePath: string, cwd?: string): MigrationTemplate | null {
  const base = cwd ?? process.cwd();
  const resolved = path.isAbsolute(filePath) ? filePath : path.resolve(base, filePath);
  if (!existsSync(resolved)) return null;
  try {
    const raw = readFileSync(resolved, "utf8");
    const t = JSON.parse(raw) as MigrationTemplate;
    if (!t.package || !t.steps || !Array.isArray(t.steps)) return null;
    return { ...t, name: t.name || path.basename(resolved, ".json") };
  } catch {
    return null;
  }
}

/** List available migration templates (by package name or all). */
export function listTemplates(packageName?: string): MigrationTemplate[] {
  const dir = getMigrationsDir();
  if (!existsSync(dir)) return [];

  const templates: MigrationTemplate[] = [];
  const entries = readdirSync(dir, { withFileTypes: true });

  for (const e of entries) {
    if (!e.isFile() || !e.name.endsWith(".json")) continue;
    const filePath = path.join(dir, e.name);
    try {
      const raw = readFileSync(filePath, "utf8");
      const t = JSON.parse(raw) as MigrationTemplate;
      if (!t.package || !t.steps) continue;
      if (packageName && t.package !== packageName) continue;
      templates.push(t);
    } catch {
      // skip invalid
    }
  }

  return templates;
}

/** Find a template for a package and optional version range (e.g. "18.x" -> "19.x"). */
export function findTemplate(
  packageName: string,
  fromVersion?: string,
  toVersion?: string
): MigrationTemplate | null {
  const all = listTemplates(packageName);
  if (all.length === 0) return null;
  if (fromVersion && toVersion) {
    const match = all.find(
      (t) =>
        t.from && t.to &&
        (fromVersion.startsWith(t.from.replace(".x", "")) || t.from === "*") &&
        (toVersion.startsWith(t.to.replace(".x", "")) || t.to === "*")
    );
    return match ?? all[0];
  }
  return all[0];
}

/** Apply a single find/replace step to file contents. Returns new content and whether a change was made. */
function applyStepToContent(content: string, step: MigrationStep): { content: string; changed: boolean } {
  if (!step.find || step.replace === undefined) return { content, changed: false };
  const idx = content.indexOf(step.find);
  if (idx === -1) return { content, changed: false };
  const newContent = content.slice(0, idx) + step.replace + content.slice(idx + step.find.length);
  return { content: newContent, changed: true };
}

/** Collect JS/TS/JSX/TSX files under dir. */
function collectSourceFiles(dir: string, baseDir: string): string[] {
  const results: string[] = [];
  if (!existsSync(dir)) return results;
  const entries = readdirSync(dir, { withFileTypes: true });
  const ext = [".js", ".ts", ".jsx", ".tsx", ".mjs", ".cjs"];
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (e.name === "node_modules" || e.name === ".git" || e.name === "dist") continue;
      results.push(...collectSourceFiles(full, baseDir));
    } else if (ext.some((x) => e.name.endsWith(x))) {
      results.push(path.relative(baseDir, full));
    }
  }
  return results;
}

export type ApplyTemplateOptions = {
  cwd: string;
  template: MigrationTemplate;
  dryRun: boolean;
};

export type ApplyResult = {
  stepsApplied: number;
  stepsSkipped: number;
  filesModified: string[];
  packageSteps: Array<{ package: string; version?: string }>;
};

export function applyTemplate(options: ApplyTemplateOptions): ApplyResult {
  const { cwd, template, dryRun } = options;
  const result: ApplyResult = {
    stepsApplied: 0,
    stepsSkipped: 0,
    filesModified: [],
    packageSteps: [],
  };

  const sourceFiles = collectSourceFiles(cwd, cwd);

  for (const step of template.steps) {
    if (step.package && step.version) {
      result.packageSteps.push({ package: step.package, version: step.version });
      result.stepsApplied++;
      continue;
    }

    if (!step.find || step.replace === undefined) {
      result.stepsSkipped++;
      continue;
    }

    let applied = false;
    for (const rel of sourceFiles) {
      const full = path.join(cwd, rel);
      try {
        const content = readFileSync(full, "utf8");
        const { content: newContent, changed } = applyStepToContent(content, step);
        if (changed) {
          if (!dryRun) {
            writeFileSync(full, newContent, "utf8");
          }
          if (!result.filesModified.includes(rel)) result.filesModified.push(rel);
          result.stepsApplied++;
          applied = true;
          break; // one file per find/replace step for now
        }
      } catch {
        // skip
      }
    }
    if (!applied) result.stepsSkipped++;
  }

  return result;
}
