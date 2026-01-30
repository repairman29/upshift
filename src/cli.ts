#!/usr/bin/env node
import { Command } from "commander";
import { createRequire } from "module";
import { scanCommand } from "./commands/scan.js";
import { explainCommand } from "./commands/explain.js";
import { fixCommand } from "./commands/fix.js";
import { upgradeCommand } from "./commands/upgrade.js";
import { auditCommand } from "./commands/audit.js";
import { initCommand } from "./commands/init.js";
import { creditsCommand } from "./commands/credits.js";
import { buyCreditsCommand } from "./commands/buy-credits.js";
import { subscribeCommand } from "./commands/subscribe.js";
import { statusCommand } from "./commands/status.js";

const require = createRequire(import.meta.url);
const pkg = require("../package.json");

const program = new Command();

program
  .name("upshift")
  .description("AI-powered dependency upgrades with explanations and safe rollbacks.")
  .version(pkg.version);

// Core commands
program.addCommand(scanCommand());
program.addCommand(explainCommand());
program.addCommand(fixCommand());
program.addCommand(upgradeCommand());
program.addCommand(auditCommand());

// Setup
program.addCommand(initCommand());

// Billing
program.addCommand(creditsCommand());
program.addCommand(buyCreditsCommand());
program.addCommand(subscribeCommand());
program.addCommand(statusCommand());

program.parse(process.argv);
