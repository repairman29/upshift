import { Command } from "commander";
import { runScan } from "../lib/scan.js";

export function scanCommand(): Command {
  const command = new Command("scan");
  command
    .description("Scan dependencies for updates and vulnerabilities")
    .option("--json", "Output results as JSON", false)
    .option("--licenses", "Include license for each direct dependency (npm)", false)
    .option("--report <path>", "Write JSON report to file (for Radar/dashboard)")
    .option("--cwd <path>", "Project directory to scan", process.cwd())
    .action(async (options) => {
      await runScan({
        cwd: options.cwd,
        json: options.json,
        licenses: options.licenses ?? false,
        report: options.report,
      });
    });

  return command;
}
