#!/usr/bin/env node
/**
 * Verify the site (web/) has the expected content. Optionally verify live URL.
 * Usage:
 *   node scripts/verify-site.mjs              # check local web/ only
 *   node scripts/verify-site.mjs --live      # check local + curl SITE_URL (default https://upshiftai.dev)
 *   SITE_URL=https://... node scripts/verify-site.mjs --live
 */
import { readFileSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");
const webDir = path.join(repoRoot, "web");

const checks = [
  {
    name: "web/index.html has new hero",
    file: path.join(webDir, "index.html"),
    expect: "Stop reading changelogs",
  },
  {
    name: "web/index.html has Radar link",
    file: path.join(webDir, "index.html"),
    expect: 'href="/radar/"',
  },
  {
    name: "web/index.html Docs link points to /docs/",
    file: path.join(webDir, "index.html"),
    expect: 'href="/docs/"',
  },
  {
    name: "web/index.html has mobile nav toggle",
    file: path.join(webDir, "index.html"),
    expect: "nav-toggle",
  },
  {
    name: "web/index.html has Sign in link to platform",
    file: path.join(webDir, "index.html"),
    expect: "api.upshiftai.dev",
  },
  {
    name: "web/docs/access-and-auth.html exists",
    file: path.join(webDir, "docs", "access-and-auth.html"),
    expect: "Use the tools",
  },
  {
    name: "web/docs/index.html exists and has Documentation",
    file: path.join(webDir, "docs", "index.html"),
    expect: "Documentation",
  },
  {
    name: "web/radar/index.html has Radar Pro section",
    file: path.join(webDir, "radar", "index.html"),
    expect: "Radar Pro",
  },
  {
    name: "web/radar/index.html has Load my reports",
    file: path.join(webDir, "radar", "index.html"),
    expect: "Load my reports",
  },
];

function verifyLocal() {
  let failed = 0;
  for (const c of checks) {
    try {
      const content = readFileSync(c.file, "utf8");
      if (!content.includes(c.expect)) {
        console.error(`FAIL: ${c.name} (missing: ${c.expect})`);
        failed++;
      } else {
        console.log(`OK: ${c.name}`);
      }
    } catch (e) {
      console.error(`FAIL: ${c.name} (${e.message})`);
      failed++;
    }
  }
  return failed;
}

async function verifyLive(url) {
  console.log(`\nVerifying live: ${url}`);
  try {
    const res = await fetch(url);
    const html = await res.text();
    const mustHave = ["Stop reading changelogs", "Radar Pro", "/radar/"];
    let failed = 0;
    for (const s of mustHave) {
      if (html.includes(s)) {
        console.log(`OK: live page contains "${s.slice(0, 30)}..."`);
      } else {
        console.error(`FAIL: live page missing "${s}"`);
        failed++;
      }
    }
    if (failed > 0) {
      console.error("\nLive site is still serving the old version. Point upshiftai.dev to the Vercel project that deploys web/ (outputDirectory: web).");
    }
    return failed;
  } catch (e) {
    console.error(`FAIL: fetch error ${e.message}`);
    return 1;
  }
}

const args = process.argv.slice(2);
const doLive = args.includes("--live");
const siteUrl = process.env.SITE_URL || "https://upshiftai.dev";

let failed = verifyLocal();
if (doLive) {
  failed += await verifyLive(siteUrl);
}

process.exit(failed > 0 ? 1 : 0);
