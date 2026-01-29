import { Command } from "commander";
import { getCreditBalance, addCredits, resetCredits } from "../lib/credits.js";

export function creditsCommand(): Command {
  const command = new Command("credits");
  command
    .description("Show or manage your Upshift credits")
    .option("--add <amount>", "Add credits to the local bank")
    .option("--reset <amount>", "Reset credit balance to a number")
    .action((options) => {
      if (options.reset) {
        const amount = Number(options.reset);
        if (!Number.isFinite(amount) || amount < 0) {
          throw new Error("Invalid reset amount");
        }
        resetCredits(amount);
        process.stdout.write(`Credits reset to ${amount}\n`);
        return;
      }

      if (options.add) {
        const amount = Number(options.add);
        if (!Number.isFinite(amount) || amount <= 0) {
          throw new Error("Invalid add amount");
        }
        addCredits(amount);
        process.stdout.write(`Added ${amount} credits\n`);
        return;
      }

      const balance = getCreditBalance();
      process.stdout.write(`Credits: ${balance}\n`);
    });

  return command;
}
