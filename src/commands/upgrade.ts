import { Command } from "commander";
import { runUpgrade } from "../lib/upgrade.js";

export function upgradeCommand(): Command {
  const command = new Command("upgrade");
  command
    .description("Upgrade a dependency and apply migration fixes")
    .argument("<package>", "Package name to upgrade")
    .option("--to <version>", "Target version (default: latest)")
    .option("--cwd <path>", "Project directory", process.cwd())
    .option("--dry-run", "Show planned changes without modifying files", false)
    .action(async (pkg, options) => {
      await runUpgrade({
        cwd: options.cwd,
        packageName: pkg,
        toVersion: options.to,
        dryRun: options.dryRun,
      });
    });

  return command;
}
