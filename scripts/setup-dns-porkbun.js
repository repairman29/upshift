#!/usr/bin/env node
/**
 * Set DNS for upshiftai.dev via Porkbun API.
 * Keys from env only (never commit): PORKBUN_API_KEY, PORKBUN_SECRET_KEY
 *
 * Optional: DNS_TARGET_CNAME (e.g. cname.vercel-dns.com), DNS_TARGET_A (e.g. 76.76.21.21)
 * Defaults point to Vercel so you can add the domain in Vercel and deploy.
 *
 * Run: PORKBUN_API_KEY=pk1_... PORKBUN_SECRET_KEY=sk1_... node scripts/setup-dns-porkbun.js
 */

const domain = "upshiftai.dev";
const apiKey = process.env.PORKBUN_API_KEY;
const secretKey = process.env.PORKBUN_SECRET_KEY;
const targetCname = process.env.DNS_TARGET_CNAME || "cname.vercel-dns.com";
const targetA = process.env.DNS_TARGET_A || "76.76.21.21";

if (!apiKey || !secretKey) {
  console.error("Set PORKBUN_API_KEY and PORKBUN_SECRET_KEY");
  process.exit(1);
}

const base = "https://api.porkbun.com/api/json/v3/dns";
const body = (type, content, name = "") => ({
  apikey: apiKey,
  secretapikey: secretKey,
  type,
  content,
  name,
  ttl: "600",
});

async function create(type, content, name = "") {
  const payload = body(type, content, name);
  const res = await fetch(`${base}/create/${domain}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (data.status !== "SUCCESS") {
    const msg = data.message || JSON.stringify(data);
    throw new Error(`Create error: ${msg}`);
  }
  return data;
}

async function retrieve() {
  const res = await fetch(`${base}/retrieve/${domain}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ apikey: apiKey, secretapikey: secretKey }),
  });
  const data = await res.json();
  if (data.status !== "SUCCESS") {
    throw new Error(data.message || JSON.stringify(data));
  }
  return data.records || [];
}

async function deleteById(recordId) {
  const res = await fetch(`${base}/delete/${domain}/${recordId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ apikey: apiKey, secretapikey: secretKey }),
  });
  const data = await res.json();
  if (data.status !== "SUCCESS") {
    throw new Error(data.message || JSON.stringify(data));
  }
}

async function main() {
  try {
    const records = await retrieve();
    console.log("Existing records:", records.length);
    // Porkbun retrieve returns full FQDN in name (e.g. "upshiftai.dev", "www.upshiftai.dev")
    const hasApexA = records.some((r) => (r.name === domain || r.name === "") && r.type === "A");
    const hasWwwCname = records.some((r) => (r.name === "www." + domain || r.name === "www") && r.type === "CNAME");
    if (hasApexA) {
      console.log("Apex A already exists, skipping.");
    } else {
      // Apex may have ALIAS instead of A (Porkbun allows only one apex record). Remove ALIAS so we can add A for Vercel.
      const apexAlias = records.find((r) => (r.name === domain || r.name === "") && r.type === "ALIAS");
      if (apexAlias) {
        console.log("Removing apex ALIAS (id " + apexAlias.id + ") so we can add A record...");
        await deleteById(apexAlias.id);
      }
      console.log("Creating apex A...");
      await create("A", targetA, "");
      console.log("Apex A record:", targetA);
    }
    if (hasWwwCname) {
      console.log("www CNAME already exists, skipping.");
    } else {
      console.log("Creating www CNAME...");
      await create("CNAME", targetCname, "www");
      console.log("www CNAME:", targetCname);
    }
    console.log("Done. Add upshiftai.dev (and www) in your host (e.g. Vercel) and deploy.");
  } catch (e) {
    console.error("Error:", e.message || e);
    process.exit(1);
  }
}

main();
