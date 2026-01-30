import { Command } from "commander";
import chalk from "chalk";
import ora from "ora";
import { detectMonorepo, getAllDependencies, formatMonorepoSummary } from "../lib/monorepo.js";
import { getOutdatedPackages, detectPackageManager } from "../lib/package-manager.js";

export function workspacesCommand(): Command {
  return new Command("workspaces")
    .alias("ws")
    .description("Scan monorepo workspaces for outdated dependencies")
    .option("--json", "Output results as JSON")
    .option("--cwd <path>", "Project directory", process.cwd())
    .action(async (options) => {
      try {
        await runWorkspacesScan(options.cwd, options.json);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        console.error(`Error: ${message}`);
        process.exit(1);
      }
    });
}

async function runWorkspacesScan(cwd: string, json: boolean): Promise<void> {
  const spinner = ora("Detecting monorepo structure...").start();

  const monorepo = detectMonorepo(cwd);

  if (monorepo.type === "none") {
    spinner.info("Not a monorepo - use `upshift scan` for single packages");
    return;
  }

  spinner.succeed(`Found ${formatMonorepoSummary(monorepo)}`);

  // Get all dependencies across workspaces
  const allDeps = getAllDependencies(monorepo);
  
  // Scan for outdated at root level
  const pm = detectPackageManager(cwd);
  const outdatedSpinner = ora("Scanning for outdated dependencies...").start();
  
  let outdated: Awaited<ReturnType<typeof getOutdatedPackages>> = [];
  try {
    outdated = await getOutdatedPackages(cwd, pm);
  } catch {
    // May fail if no root dependencies
  }
  
  outdatedSpinner.succeed(`Found ${outdated.length} outdated packages`);

  if (json) {
    const result = {
      monorepo: {
        type: monorepo.type,
        root: monorepo.root,
        workspaceCount: monorepo.workspaces.length,
      },
      workspaces: monorepo.workspaces.map(ws => ({
        name: ws.name,
        path: ws.path,
        dependencyCount: Object.keys({
          ...ws.packageJson.dependencies,
          ...ws.packageJson.devDependencies,
        }).length,
      })),
      outdated,
      sharedDependencies: Array.from(allDeps.entries())
        .filter(([, info]) => info.workspaces.length > 1)
        .map(([name, info]) => ({
          name,
          version: info.version,
          usedIn: info.workspaces,
        })),
    };
    process.stdout.write(JSON.stringify(result, null, 2) + "\n");
    return;
  }

  // Human-readable output
  console.log(chalk.bold("\n📦 Workspaces:\n"));

  for (const workspace of monorepo.workspaces) {
    const depCount = Object.keys({
      ...workspace.packageJson.dependencies,
      ...workspace.packageJson.devDependencies,
    }).length;
    
    console.log(`  ${chalk.cyan(workspace.name)}`);
    console.log(chalk.gray(`    ${workspace.path}`));
    console.log(chalk.gray(`    ${depCount} dependencies`));
  }

  // Find shared dependencies with version conflicts
  const sharedDeps = Array.from(allDeps.entries())
    .filter(([, info]) => info.workspaces.length > 1);

  const conflicts = sharedDeps.filter(([, info]) => info.version.includes(","));

  if (conflicts.length > 0) {
    console.log(chalk.bold.yellow("\n⚠️  Version conflicts:\n"));
    
    for (const [name, info] of conflicts) {
      console.log(`  ${chalk.red(name)}: ${info.version}`);
      console.log(chalk.gray(`    Used in: ${info.workspaces.join(", ")}`));
    }
  }

  // Show outdated if any
  if (outdated.length > 0) {
    console.log(chalk.bold("\n📋 Outdated dependencies:\n"));
    
    for (const pkg of outdated.slice(0, 10)) {
      const inWorkspaces = allDeps.get(pkg.name);
      const workspaceInfo = inWorkspaces 
        ? chalk.gray(` (${inWorkspaces.workspaces.length} workspaces)`)
        : "";
      
      console.log(`  ${chalk.cyan(pkg.name)} ${pkg.current} → ${chalk.green(pkg.latest)}${workspaceInfo}`);
    }
    
    if (outdated.length > 10) {
      console.log(chalk.gray(`\n  ... and ${outdated.length - 10} more`));
    }
  }

  console.log(chalk.bold("\n💡 Commands:\n"));
  console.log(chalk.gray("  upshift upgrade --all-minor    Upgrade all workspaces (safe)"));
  console.log(chalk.gray("  upshift scan --workspace <name>  Scan specific workspace"));
  console.log("");
}
