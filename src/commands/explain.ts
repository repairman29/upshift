import { Command } from "commander";
import { runExplain } from "../lib/explain.js";

export function explainCommand(): Command {
  const command = new Command("explain");
  command
    .description("Explain breaking changes for a dependency")
    .argument("<package>", "Package name to explain")
    .option("--from <version>", "Current version")
    .option("--to <version>", "Target version")
    .option("--cwd <path>", "Project directory", process.cwd())
    .action(async (pkg, options) => {
      await runExplain({
        cwd: options.cwd,
        packageName: pkg,
        fromVersion: options.from,
        toVersion: options.to,
      });
    });

  return command;
}
