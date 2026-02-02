import { Command } from "commander";
import { existsSync, writeFileSync } from "fs";
import path from "path";
import chalk from "chalk";
import { createConfigTemplate } from "../lib/config.js";

export function initCommand(): Command {
  return new Command("init")
    .description("Create a .upshiftrc.json config file")
    .option("--force", "Overwrite existing config file")
    .action(async (options) => {
      const cwd = process.cwd();
      const configPath = path.join(cwd, ".upshiftrc.json");

      if (existsSync(configPath) && !options.force) {
        console.log(chalk.yellow("Config file already exists: .upshiftrc.json"));
        console.log(chalk.gray("Use --force to overwrite."));
        return;
      }

      const template = createConfigTemplate();
      writeFileSync(configPath, template, "utf8");

      console.log(chalk.green("✔ Created .upshiftrc.json"));
      console.log("");
      console.log("Configuration options:");
      console.log(chalk.gray("  ignore        - Packages to skip during upgrades"));
      console.log(chalk.gray("  defaultMode   - Default batch mode (all/minor/patch)"));
      console.log(chalk.gray("  autoTest      - Run tests after upgrades"));
      console.log(chalk.gray("  approval      - HITL: prompt for major upgrades (mode: prompt|none|webhook, requireFor: [major], webhookUrl: optional)"));
      console.log(chalk.gray("  upgradePolicy - block upgrades by risk: { blockRisk: [\"high\"] } (optional)"));
      console.log(chalk.gray("  ai.autoEnable - Auto-use AI for explains"));
      console.log("");
      console.log(chalk.gray("Edit the file to customize your settings."));
    });
}
