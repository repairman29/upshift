import chalk from "chalk";
import ora from "ora";
import { existsSync, readFileSync, writeFileSync } from "fs";
import path from "path";
import { glob } from "glob";
import { Project, SyntaxKind, Node } from "ts-morph";
import { createTwoFilesPatch } from "diff";
import { consumeCredit } from "./credits.js";
import { emitAuditEvent } from "./audit-log.js";

export type FixOptions = {
  cwd: string;
  packageName: string;
  fromVersion?: string;
  toVersion?: string;
  dryRun?: boolean;
  yes?: boolean;
  json?: boolean;
};

export type CodeFix = {
  file: string;
  line: number;
  original: string;
  replacement: string;
  description: string;
};

/** high = tests passed after apply (deterministic); heuristic = AI-suggested, review recommended */
export type FixConfidence = "high" | "heuristic";

export type FixResult = {
  package: string;
  fromVersion: string | null;
  toVersion: string;
  fixes: CodeFix[];
  applied: boolean;
  /** Present when applied or in JSON output; high = tests passed */
  confidence?: FixConfidence;
};

export async function runFix(options: FixOptions): Promise<void> {
  // Fix command costs 3 credits (more value)
  await consumeCredit("fix", 3);

  const spinner = ora(`Analyzing ${options.packageName} upgrade...`).start();

  try {
    // Get version info
    const currentVersion = options.fromVersion ?? getCurrentVersion(options.cwd, options.packageName);
    const targetVersion = options.toVersion ?? await getLatestVersion(options.cwd, options.packageName);

    spinner.text = "Getting AI migration analysis...";

    // Get AI analysis of what patterns need to change
    const patterns = await getAIPatterns(options.packageName, currentVersion, targetVersion);

    if (patterns.length === 0) {
      spinner.succeed("No code changes needed for this upgrade");
      process.stdout.write(chalk.green(`\n${options.packageName} ${currentVersion} → ${targetVersion} requires no code modifications.\n`));
      process.stdout.write(chalk.gray("Run `upshift upgrade " + options.packageName + "` to apply the upgrade.\n"));
      return;
    }

    spinner.text = `Scanning codebase for ${patterns.length} patterns...`;

    // Find files to scan
    const files = await findSourceFiles(options.cwd);
    
    // Scan for patterns and generate fixes
    const fixes: CodeFix[] = [];
    
    for (const pattern of patterns) {
      const patternFixes = await findAndFixPattern(options.cwd, files, pattern);
      fixes.push(...patternFixes);
    }

    spinner.succeed(`Found ${fixes.length} code changes needed`);

    if (fixes.length === 0) {
      process.stdout.write(chalk.green("\nNo matching patterns found in your codebase.\n"));
      process.stdout.write(chalk.gray("Your code may already be compatible, or you're not using the affected APIs.\n"));
      return;
    }

    // JSON output
    if (options.json) {
      const result: FixResult = {
        package: options.packageName,
        fromVersion: currentVersion ?? null,
        toVersion: targetVersion,
        fixes,
        applied: false,
        confidence: "heuristic", // no apply yet; run tests after apply for high
      };
      process.stdout.write(JSON.stringify(result, null, 2) + "\n");
      return;
    }

    // Display fixes grouped by file
    const byFile = groupByFile(fixes);
    
    process.stdout.write(chalk.bold(`\n📝 Code changes for ${options.packageName} ${currentVersion ?? "?"} → ${targetVersion}:\n\n`));

    for (const [file, fileFixes] of Object.entries(byFile)) {
      const relPath = path.relative(options.cwd, file);
      process.stdout.write(chalk.cyan(`${relPath}:\n`));
      
      for (const fix of fileFixes) {
        process.stdout.write(chalk.gray(`  Line ${fix.line}: `) + chalk.yellow(fix.description) + "\n");
        process.stdout.write(chalk.red(`    - ${fix.original.trim()}\n`));
        process.stdout.write(chalk.green(`    + ${fix.replacement.trim()}\n`));
      }
      process.stdout.write("\n");
    }

    // Dry run mode: also print unified diff for PR review
    if (options.dryRun) {
      const diffText = buildUnifiedDiff(byFile, options.cwd);
      if (diffText) {
        process.stdout.write(chalk.bold("\n--- Unified diff (for PR review) ---\n"));
        process.stdout.write(chalk.gray(diffText));
        process.stdout.write(chalk.bold("---\n\n"));
      }
      process.stdout.write(chalk.gray("Dry run - no changes applied.\n"));
      process.stdout.write(chalk.yellow("Confidence: heuristic (AI-suggested; run tests after applying to verify).\n"));
      process.stdout.write(chalk.gray("Remove --dry-run to apply these changes.\n"));
      return;
    }

    // Apply fixes
    if (options.yes || await confirmApply(fixes.length)) {
      const applySpinner = ora("Applying fixes...").start();
      
      try {
        applyFixes(fixes);
        await emitAuditEvent("fix", "package", options.packageName, {
          applied: true,
          fix_count: fixes.length,
          from_version: currentVersion ?? undefined,
          to_version: targetVersion,
        });
        applySpinner.succeed(`Applied ${fixes.length} fixes`);

        // Confidence: run tests; high if they pass, else heuristic
        let confidence: FixConfidence = "heuristic";
        try {
          const { runTests } = await import("./package-manager.js");
          await runTests(options.cwd);
          confidence = "high";
        } catch {
          // no test script or tests failed
        }

        if (confidence === "high") {
          process.stdout.write(chalk.green("\n✔ Code updated successfully! Confidence: high (tests passed).\n"));
        } else {
          process.stdout.write(chalk.green("\n✔ Code updated successfully!\n"));
          process.stdout.write(chalk.yellow("Confidence: heuristic (tests skipped or failed; review recommended).\n"));
        }
        process.stdout.write(chalk.gray("Next: run `upshift upgrade " + options.packageName + "` to complete the upgrade.\n"));
      } catch (err) {
        applySpinner.fail("Failed to apply some fixes");
        throw err;
      }
    } else {
      process.stdout.write(chalk.gray("\nNo changes applied.\n"));
    }

  } catch (error) {
    spinner.fail("Fix analysis failed");
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
  };

  const version = pkg.dependencies?.[packageName] ?? pkg.devDependencies?.[packageName];
  return version?.replace(/^[\^~]/, "");
}

async function getLatestVersion(cwd: string, packageName: string): Promise<string> {
  const { runCommand } = await import("./exec.js");
  const result = await runCommand("npm", ["view", packageName, "version"], cwd);
  return result.stdout.trim();
}

type MigrationPattern = {
  pattern: string;
  replacement: string;
  description: string;
  regex?: boolean;
  astType?: string;
};

async function getAIPatterns(
  packageName: string,
  fromVersion: string | undefined,
  toVersion: string
): Promise<MigrationPattern[]> {
  const apiKey = process.env.OPENAI_API_KEY;
  
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY not configured. Set it to enable AI-powered fixes.");
  }

  const { default: OpenAI } = await import("openai");
  const openai = new OpenAI({ apiKey });

  const systemPrompt = `You are an expert at npm package migrations. Given a package upgrade, identify specific code patterns that need to change.

Return a JSON array of migration patterns. Each pattern should have:
- pattern: the old code pattern to find (can use simple regex)
- replacement: the new code to replace it with (use $1, $2 for capture groups)
- description: brief explanation of the change
- regex: true if pattern is a regex, false for literal string match

Focus on the most common breaking changes. Return 3-10 patterns max.

Example response:
[
  {
    "pattern": "res\\.send\\(\\{([^}]+)\\}\\)",
    "replacement": "res.json({$1})",
    "description": "Use res.json() for object responses",
    "regex": true
  },
  {
    "pattern": "bodyParser.json()",
    "replacement": "express.json()",
    "description": "bodyParser is now built into express",
    "regex": false
  }
]

IMPORTANT: Return ONLY the JSON array, no markdown or explanation.`;

  const userPrompt = `Package: ${packageName}
From version: ${fromVersion ?? "unknown"}  
To version: ${toVersion}

What code patterns need to change for this upgrade?`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    max_tokens: 1500,
    temperature: 0.2,
  });

  const content = response.choices[0]?.message?.content?.trim();
  if (!content) {
    return [];
  }

  try {
    // Clean up potential markdown code blocks
    const cleaned = content.replace(/```json\n?|\n?```/g, "").trim();
    const patterns = JSON.parse(cleaned) as MigrationPattern[];
    return Array.isArray(patterns) ? patterns : [];
  } catch {
    console.error("Failed to parse AI response:", content);
    return [];
  }
}

async function findSourceFiles(cwd: string): Promise<string[]> {
  const patterns = [
    "**/*.ts",
    "**/*.tsx",
    "**/*.js",
    "**/*.jsx",
    "**/*.mjs",
    "**/*.cjs",
  ];
  
  const ignorePatterns = [
    "**/node_modules/**",
    "**/dist/**",
    "**/build/**",
    "**/.next/**",
    "**/coverage/**",
  ];

  const files: string[] = [];
  
  for (const pattern of patterns) {
    const matches = await glob(pattern, {
      cwd,
      absolute: true,
      ignore: ignorePatterns,
    });
    files.push(...matches);
  }

  return [...new Set(files)];
}

async function findAndFixPattern(
  cwd: string,
  files: string[],
  pattern: MigrationPattern
): Promise<CodeFix[]> {
  const fixes: CodeFix[] = [];

  for (const file of files) {
    try {
      const content = readFileSync(file, "utf8");
      const lines = content.split("\n");

      if (pattern.regex) {
        const regex = new RegExp(pattern.pattern, "g");
        
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];
          if (regex.test(line)) {
            regex.lastIndex = 0; // Reset regex state
            const replacement = line.replace(regex, pattern.replacement);
            
            if (replacement !== line) {
              fixes.push({
                file,
                line: i + 1,
                original: line,
                replacement,
                description: pattern.description,
              });
            }
          }
        }
      } else {
        // Literal string match
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];
          if (line.includes(pattern.pattern)) {
            const replacement = line.replace(pattern.pattern, pattern.replacement);
            
            if (replacement !== line) {
              fixes.push({
                file,
                line: i + 1,
                original: line,
                replacement,
                description: pattern.description,
              });
            }
          }
        }
      }
    } catch {
      // Skip files we can't read
    }
  }

  return fixes;
}

function groupByFile(fixes: CodeFix[]): Record<string, CodeFix[]> {
  const groups: Record<string, CodeFix[]> = {};
  
  for (const fix of fixes) {
    if (!groups[fix.file]) {
      groups[fix.file] = [];
    }
    groups[fix.file].push(fix);
  }

  // Sort fixes within each file by line number
  for (const file of Object.keys(groups)) {
    groups[file].sort((a, b) => a.line - b.line);
  }

  return groups;
}

async function confirmApply(count: number): Promise<boolean> {
  const readline = await import("readline");
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(chalk.yellow(`\nApply ${count} fixes? [y/N] `), (answer) => {
      rl.close();
      resolve(answer.toLowerCase() === "y" || answer.toLowerCase() === "yes");
    });
  });
}

/** Build a unified diff (for PR review) from fixes without writing files. */
function buildUnifiedDiff(byFile: Record<string, CodeFix[]>, cwd: string): string {
  const chunks: string[] = [];
  for (const [file, fileFixes] of Object.entries(byFile)) {
    if (!existsSync(file)) continue;
    const oldContent = readFileSync(file, "utf8");
    const lines = oldContent.split("\n");
    const sortedFixes = [...fileFixes].sort((a, b) => b.line - a.line);
    for (const fix of sortedFixes) {
      if (fix.line >= 1 && fix.line <= lines.length) {
        lines[fix.line - 1] = fix.replacement;
      }
    }
    const newContent = lines.join("\n");
    const relPath = path.relative(cwd, file);
    const patch = createTwoFilesPatch(relPath, relPath, oldContent, newContent, "before", "after", { context: 3 });
    chunks.push(patch);
  }
  return chunks.join("");
}

function applyFixes(fixes: CodeFix[]): void {
  const byFile = groupByFile(fixes);

  for (const [file, fileFixes] of Object.entries(byFile)) {
    const content = readFileSync(file, "utf8");
    const lines = content.split("\n");

    // Apply fixes in reverse order to preserve line numbers
    const sortedFixes = [...fileFixes].sort((a, b) => b.line - a.line);
    
    for (const fix of sortedFixes) {
      lines[fix.line - 1] = fix.replacement;
    }

    writeFileSync(file, lines.join("\n"), "utf8");
  }
}
