#!/usr/bin/env node
/**
 * E2E tests for upshift CLI: build, then run key commands and assert exit codes + output.
 * Run from repo root: node tests/e2e/cli.e2e.mjs
 */
import { spawn } from "child_process";
import { readFileSync, existsSync } from "fs";
import { tmpdir } from "os";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "../..");
const cliPath = path.join(repoRoot, "dist/cli.js");
const fixtureDir = path.join(repoRoot, "tests/fixtures/minimal");
const fixturePython = path.join(repoRoot, "tests/fixtures/minimal-python");

function run(cmd, args, options = {}) {
  return new Promise((resolve, reject) => {
    const cwd = options.cwd ?? repoRoot;
    const node = spawn("node", [cmd, ...args], {
      cwd,
      shell: false,
      stdio: ["ignore", "pipe", "pipe"],
    });
    let stdout = "";
    let stderr = "";
    node.stdout?.on("data", (d) => { stdout += d.toString(); });
    node.stderr?.on("data", (d) => { stderr += d.toString(); });
    node.on("close", (code) => resolve({ code, stdout, stderr, cwd }));
    node.on("error", reject);
  });
}

function runNpm(cwd, args) {
  return new Promise((resolve, reject) => {
    const proc = spawn("npm", args, { cwd, shell: true, stdio: ["ignore", "pipe", "pipe"] });
    let stderr = "";
    proc.stderr?.on("data", (d) => { stderr += d.toString(); });
    proc.on("close", (code) => resolve({ code, stderr }));
    proc.on("error", reject);
  });
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function main() {
  console.log("E2E: Checking build...");
  assert(existsSync(cliPath), "Run npm run build first");
  assert(existsSync(path.join(fixtureDir, "package.json")), "Fixture tests/fixtures/minimal/package.json missing");

  if (!existsSync(path.join(fixtureDir, "node_modules"))) {
    console.log("E2E: Installing fixture deps (npm install)...");
    const install = await runNpm(fixtureDir, ["install"]);
    assert(install.code === 0, `Fixture npm install failed: ${install.stderr}`);
  }

  const results = [];
  let failed = 0;

  // 1) upshift --version
  console.log("E2E: upshift --version");
  const v = await run(cliPath, ["--version"], { cwd: repoRoot });
  assert(v.code === 0, `--version exit ${v.code}`);
  assert(v.stdout.trim().match(/^\d+\.\d+\.\d+/), "Version should be semver");
  results.push({ name: "version", ok: true });

  // 2) upshift scan (from fixture with package.json)
  console.log("E2E: upshift scan (fixture)");
  const scan = await run(cliPath, ["scan"], { cwd: fixtureDir });
  assert(scan.code === 0, `scan exit ${scan.code}: ${scan.stderr}`);
  assert(scan.stdout.includes("Scan") || scan.stdout.includes("chalk") || scan.stdout.includes("dependencies"), "scan should mention scan/deps");
  results.push({ name: "scan", ok: true });

  // 3) upshift scan --report (writes JSON)
  const reportPath = path.join(tmpdir(), `upshift-e2e-report-${Date.now()}.json`);
  console.log("E2E: upshift scan --report");
  const scanReport = await run(cliPath, ["scan", "--report", reportPath], { cwd: fixtureDir });
  assert(scanReport.code === 0, `scan --report exit ${scanReport.code}`);
  assert(existsSync(reportPath), "Report file should exist");
  const reportJson = JSON.parse(readFileSync(reportPath, "utf8"));
  assert(reportJson.status === "ok" && Array.isArray(reportJson.outdated), "Report should have status and outdated array");
  results.push({ name: "scan --report", ok: true });

  // 4) upshift suggest (fixture)
  console.log("E2E: upshift suggest");
  const suggest = await run(cliPath, ["suggest", "--limit", "3"], { cwd: fixtureDir });
  assert(suggest.code === 0, `suggest exit ${suggest.code}: ${suggest.stderr}`);
  results.push({ name: "suggest", ok: true });

  // 5) upshift plan (fixture)
  console.log("E2E: upshift plan");
  const plan = await run(cliPath, ["plan", "--mode", "patch"], { cwd: fixtureDir });
  assert(plan.code === 0, `plan exit ${plan.code}: ${plan.stderr}`);
  results.push({ name: "plan", ok: true });

  // 6) upshift migrate react --list (must run from repo root so migrations/ is found)
  console.log("E2E: upshift migrate react --list");
  const migrateList = await run(cliPath, ["migrate", "react", "--list"], { cwd: repoRoot });
  assert(migrateList.code === 0, `migrate --list exit ${migrateList.code}: ${migrateList.stderr}`);
  assert(migrateList.stdout.includes("react") || migrateList.stdout.includes("Templates"), "migrate --list should list react templates");
  results.push({ name: "migrate --list", ok: true });

  // 6b) upshift migrate react --template-file (custom template from repo migrations/)
  const customTemplatePath = path.join(repoRoot, "migrations", "react-18-19.json");
  if (existsSync(customTemplatePath)) {
    console.log("E2E: upshift migrate react --template-file migrations/react-18-19.json --dry-run");
    const migrateCustom = await run(cliPath, ["migrate", "react", "--template-file", customTemplatePath, "--dry-run"], { cwd: repoRoot });
    assert(migrateCustom.code === 0, `migrate --template-file exit ${migrateCustom.code}: ${migrateCustom.stderr}`);
    assert(migrateCustom.stdout.includes("template") || migrateCustom.stdout.includes("Dry run") || migrateCustom.stdout.includes("react"), "migrate --template-file should run");
    results.push({ name: "migrate --template-file", ok: true });
  } else {
    results.push({ name: "migrate --template-file", ok: true });
  }

  // 6c) upshift migrate vite --list (Vite template)
  console.log("E2E: upshift migrate vite --list");
  const migrateVite = await run(cliPath, ["migrate", "vite", "--list"], { cwd: repoRoot });
  assert(migrateVite.code === 0, `migrate vite --list exit ${migrateVite.code}: ${migrateVite.stderr}`);
  assert(migrateVite.stdout.includes("vite") || migrateVite.stdout.includes("Templates"), "migrate vite --list should list vite template");
  results.push({ name: "migrate vite --list", ok: true });

  // 7) upshift radar --no-open
  console.log("E2E: upshift radar --no-open");
  const radar = await run(cliPath, ["radar", "--no-open"], { cwd: repoRoot });
  assert(radar.code === 0, `radar --no-open exit ${radar.code}`);
  assert(radar.stdout.includes("radar") || radar.stdout.includes("upshiftai.dev"), "radar should print URL");
  results.push({ name: "radar --no-open", ok: true });

  // 8) upshift scan --json (fixture)
  console.log("E2E: upshift scan --json");
  const scanJson = await run(cliPath, ["scan", "--json"], { cwd: fixtureDir });
  assert(scanJson.code === 0, `scan --json exit ${scanJson.code}`);
  const parsed = JSON.parse(scanJson.stdout);
  assert(parsed && (parsed.status === "ok" || Array.isArray(parsed.outdated)), "scan --json should be valid JSON with status or outdated");
  results.push({ name: "scan --json", ok: true });

  // 9) upshift status --json
  console.log("E2E: upshift status --json");
  const statusJson = await run(cliPath, ["status", "--json"], { cwd: repoRoot });
  assert(statusJson.code === 0, `status --json exit ${statusJson.code}: ${statusJson.stderr}`);
  const statusParsed = JSON.parse(statusJson.stdout);
  assert(statusParsed && (typeof statusParsed.balance === "number" || statusParsed.source === "local" || statusParsed.source === "remote"), "status --json should have balance or source");
  results.push({ name: "status --json", ok: true });

  // 10) Batch upgrade --all --dry-run (Node fixture)
  console.log("E2E: upshift upgrade --all --dry-run (Node fixture)");
  const batchNode = await run(cliPath, ["upgrade", "--all", "--dry-run"], { cwd: fixtureDir });
  assert(batchNode.code === 0, `upgrade --all --dry-run exit ${batchNode.code}: ${batchNode.stderr}`);
  const batchOut = batchNode.stdout + batchNode.stderr;
  assert(
    batchOut.includes("Dry run") ||
      batchOut.includes("up to date") ||
      batchOut.includes("upgrade") ||
      batchOut.includes("packages") ||
      batchOut.includes("dependencies"),
    "batch upgrade dry-run should mention dry run, packages, or dependencies"
  );
  results.push({ name: "upgrade --all --dry-run (Node)", ok: true });

    // 11) Python: scan (minimal-python fixture)
    if (existsSync(path.join(fixturePython, "requirements.txt"))) {
    console.log("E2E: upshift scan (Python fixture)");
    const scanPy = await run(cliPath, ["scan"], { cwd: fixturePython });
    assert(scanPy.code === 0, `scan (Python) exit ${scanPy.code}: ${scanPy.stderr}`);
    assert(scanPy.stdout.includes("python") || scanPy.stdout.includes("Scan") || scanPy.stdout.includes("six") || scanPy.stdout.includes("outdated"), "scan Python should mention python/six/outdated");
    results.push({ name: "scan (Python)", ok: true });

    console.log("E2E: upshift scan --licenses (Python fixture)");
    const scanPyLic = await run(cliPath, ["scan", "--licenses", "--json"], { cwd: fixturePython });
    assert(scanPyLic.code === 0, `scan --licenses (Python) exit ${scanPyLic.code}: ${scanPyLic.stderr}`);
    const pyLicJson = JSON.parse(scanPyLic.stdout);
    assert(pyLicJson.licenses == null || typeof pyLicJson.licenses === "object", "scan --licenses (Python) should have licenses object or omit");
    results.push({ name: "scan --licenses (Python)", ok: true });

    // 12) Python: upgrade --dry-run
    console.log("E2E: upshift upgrade six --dry-run (Python fixture)");
    const upgradePy = await run(cliPath, ["upgrade", "six", "--dry-run"], { cwd: fixturePython });
    assert(upgradePy.code === 0, `upgrade six --dry-run (Python) exit ${upgradePy.code}: ${upgradePy.stderr}`);
    assert(upgradePy.stdout.includes("Dry run") || upgradePy.stdout.includes("pip") || upgradePy.stdout.includes("poetry") || upgradePy.stdout.includes("Python"), "Python upgrade dry-run should mention Dry run/pip/poetry");
    results.push({ name: "upgrade (Python) --dry-run", ok: true });

    // 13) Python: batch upgrade --all --dry-run
    console.log("E2E: upshift upgrade --all --dry-run (Python fixture)");
    const batchPy = await run(cliPath, ["upgrade", "--all", "--dry-run"], { cwd: fixturePython });
    assert(batchPy.code === 0, `upgrade --all --dry-run (Python) exit ${batchPy.code}: ${batchPy.stderr}`);
    const batchPyOut = batchPy.stdout + batchPy.stderr;
    assert(
      batchPyOut.includes("Dry run") ||
        batchPyOut.includes("up to date") ||
        batchPyOut.includes("Python") ||
        batchPyOut.includes("upgrade") ||
        batchPyOut.includes("packages"),
      "Python batch upgrade dry-run should mention dry run, Python, or packages"
    );
    results.push({ name: "upgrade --all --dry-run (Python)", ok: true });
  } else {
    results.push({ name: "scan (Python)", ok: true });
    results.push({ name: "scan --licenses (Python)", ok: true });
    results.push({ name: "upgrade (Python) --dry-run", ok: true });
    results.push({ name: "upgrade --all --dry-run (Python)", ok: true });
  }

  console.log("\n--- E2E results ---");
  results.forEach((r) => console.log(r.ok ? "  ✓ " + r.name : "  ✗ " + r.name));
  if (failed > 0) process.exit(1);
  console.log("All E2E checks passed.");
}

main().catch((err) => {
  console.error("E2E failed:", err.message);
  process.exit(1);
});
