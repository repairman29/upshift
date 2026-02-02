import { Command } from "commander";
import { openUrl } from "../lib/open.js";

const RADAR_URL = "https://upshiftai.dev/radar/";

export function radarCommand(): Command {
  return new Command("radar")
    .description("Open Radar: central view of dependency health across all your repos")
    .option("--no-open", "Only print the Radar URL (don't open in browser)")
    .action(async (options) => {
      if (options.open !== false) {
        try {
          await openUrl(RADAR_URL);
          process.stdout.write(`Opened ${RADAR_URL}\n`);
        } catch {
          process.stdout.write(`Radar: ${RADAR_URL}\n`);
          process.stdout.write("Open the URL in your browser to view your dependency dashboard.\n");
        }
      } else {
        process.stdout.write(`${RADAR_URL}\n`);
      }
      process.stdout.write("\nGenerate reports with: upshift scan --report report.json\n");
      process.stdout.write("Then paste or upload the JSON at Radar. Pro: persisted dashboard, history, alerts.\n");
    });
}
