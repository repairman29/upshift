import { Command } from "commander";
import chalk from "chalk";
import {
  listTemplates,
  findTemplate,
  applyTemplate,
  type MigrationTemplate,
} from "../lib/migrate.js";

export function migrateCommand(): Command {
  return new Command("migrate")
    .description("Apply a migration template for a package (e.g. React 18→19)")
    .argument("<package>", "Package name (e.g. react, next)")
    .option("--template <name>", "Template id (e.g. react-18-19); default: auto-detect from package")
    .option("--dry-run", "Show what would be changed without modifying files", false)
    .option("--list", "List available templates for the package")
    .option("--cwd <path>", "Project directory", process.cwd())
    .action(async (pkg, options) => {
      const cwd = options.cwd ?? process.cwd();

      if (options.list) {
        const templates = listTemplates(pkg);
        if (templates.length === 0) {
          process.stdout.write(chalk.yellow(`No migration templates found for "${pkg}".\n`));
          process.stdout.write(chalk.gray("Run `upshift migrate <package>` without --list to see all templates.\n"));
          return;
        }
        process.stdout.write(chalk.bold(`Templates for ${pkg}:\n\n`));
        for (const t of templates) {
          process.stdout.write(`  ${chalk.cyan(t.name)} — ${t.description}\n`);
          process.stdout.write(`    ${t.from} → ${t.to}\n`);
          if (t.links?.length) {
            process.stdout.write(`    ${chalk.gray(t.links[0])}\n`);
          }
          process.stdout.write("\n");
        }
        return;
      }

      let template: MigrationTemplate | null;
      if (options.template) {
        const all = listTemplates(pkg);
        template = all.find((t) => t.name === options.template) ?? all[0] ?? null;
      } else {
        template = findTemplate(pkg);
      }

      if (!template) {
        process.stdout.write(chalk.yellow(`No migration template found for "${pkg}".\n`));
        process.stdout.write(chalk.gray("Add one in migrations/ or run `upshift migrate --list` to see available templates.\n"));
        process.exit(1);
      }

      process.stdout.write(chalk.bold(`Applying template: ${template.name}\n`));
      process.stdout.write(chalk.gray(`${template.description}\n\n`));

      const result = applyTemplate({
        cwd,
        template,
        dryRun: options.dryRun ?? false,
      });

      if (result.filesModified.length > 0) {
        process.stdout.write(chalk.green("Files to modify:\n"));
        for (const f of result.filesModified) {
          process.stdout.write(`  ${f}\n`);
        }
      }
      if (result.packageSteps.length > 0) {
        process.stdout.write(chalk.cyan("Package steps (run manually or with upgrade):\n"));
        for (const s of result.packageSteps) {
          process.stdout.write(`  upshift upgrade ${s.package}${s.version ? ` --to ${s.version}` : ""}\n`);
        }
      }

      if (options.dryRun) {
        process.stdout.write(chalk.gray("\nDry run — no files modified. Remove --dry-run to apply.\n"));
      } else {
        process.stdout.write(chalk.green(`\nApplied ${result.stepsApplied} step(s). ${result.stepsSkipped} skipped (no match).\n`));
      }

      if (template.links?.length) {
        process.stdout.write(chalk.gray("\nGuides: " + template.links.join(", ") + "\n"));
      }
    });
}
