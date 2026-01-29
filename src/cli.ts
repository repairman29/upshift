#!/usr/bin/env node
import { Command } from "commander";
import { createRequire } from "module";
import { scanCommand } from "./commands/scan.js";
import { explainCommand } from "./commands/explain.js";
import { upgradeCommand } from "./commands/upgrade.js";
import { creditsCommand } from "./commands/credits.js";
import { buyCreditsCommand } from "./commands/buy-credits.js";

const require = createRequire(import.meta.url);
const pkg = require("../package.json");

const program = new Command();

program
  .name("upshift")
  .description("AI-powered dependency upgrades with explanations and safe rollbacks.")
  .version(pkg.version);

program.addCommand(scanCommand());
program.addCommand(explainCommand());
program.addCommand(upgradeCommand());
program.addCommand(creditsCommand());
program.addCommand(buyCreditsCommand());

program.parse(process.argv);
