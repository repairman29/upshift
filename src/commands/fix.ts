import { Command } from "commander";
import { runFix } from "../lib/fix.js";

export function fixCommand(): Command {
  return new Command("fix")
    .description("AI-powered code fixes for breaking changes (costs 3 credits)")
    .argument("<package>", "Package name to fix code for")
    .option("--from <version>", "Current version (auto-detected from package.json)")
    .option("--to <version>", "Target version (defaults to latest)")
    .option("--dry-run", "Show changes without applying them")
    .option("-y, --yes", "Apply fixes without confirmation")
    .option("--json", "Output results as JSON")
    .action(async (packageName: string, options) => {
      try {
        await runFix({
          cwd: process.cwd(),
          packageName,
          fromVersion: options.from,
          toVersion: options.to,
          dryRun: options.dryRun,
          yes: options.yes,
          json: options.json,
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        console.error(`Error: ${message}`);
        process.exit(1);
      }
    });
}
