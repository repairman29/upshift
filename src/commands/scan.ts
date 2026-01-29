import { Command } from "commander";
import { runScan } from "../lib/scan.js";

export function scanCommand(): Command {
  const command = new Command("scan");
  command
    .description("Scan dependencies for updates and vulnerabilities")
    .option("--json", "Output results as JSON", false)
    .option("--cwd <path>", "Project directory to scan", process.cwd())
    .action(async (options) => {
      await runScan({
        cwd: options.cwd,
        json: options.json,
      });
    });

  return command;
}
