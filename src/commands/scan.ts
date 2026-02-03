import { Command } from "commander";
import { runScan } from "../lib/scan.js";

export function scanCommand(): Command {
  const command = new Command("scan");
  command
    .description("Scan dependencies for updates and vulnerabilities")
    .option("--json", "Output results as JSON", false)
    .option("--licenses", "Include license for each direct dependency (npm, Python)", false)
    .option("--report <path>", "Write JSON report to file (for Radar/dashboard)")
    .option("--upload", "Upload report to Radar Pro (requires --report, UPSHIFT_RADAR_TOKEN, UPSHIFT_RADAR_UPLOAD_URL)", false)
    .option("--cwd <path>", "Project directory to scan", process.cwd())
    .action(async (options) => {
      const uploadUrl = options.upload ? process.env.UPSHIFT_RADAR_UPLOAD_URL : undefined;
      const uploadToken = options.upload ? process.env.UPSHIFT_RADAR_TOKEN : undefined;
      if (options.upload) {
        if (!options.report) {
          console.error("Error: --upload requires --report <path>");
          process.exit(1);
        }
        if (!uploadToken || !uploadUrl) {
          console.error("Error: --upload requires env UPSHIFT_RADAR_TOKEN and UPSHIFT_RADAR_UPLOAD_URL (e.g. your Supabase function URL)");
          process.exit(1);
        }
      }
      await runScan({
        cwd: options.cwd,
        json: options.json,
        licenses: options.licenses ?? false,
        report: options.report,
        uploadUrl,
        uploadToken,
      });
    });

  return command;
}
