# What JARVIS does when it encounters your repos

Single reference for how JARVIS uses **repos.json**, **products.json**, the **repo index**, and **GitHub** so you know what happens when your repos are in the mix.

---

## 1. Repo list: repos.json

- **What:** The list of repairman29 GitHub repos JARVIS knows about.
- **Where:** `repos.json` in the JARVIS repo root (or `gh repo list repairman29` if the file is missing).
- **Used by:** Indexer (clone/pull and index), scripts that need “all repos.”
- **JARVIS does not** auto-edit repos.json; you (or another process) add/remove repos there. The indexer then uses that list to clone, chunk, and embed.

---

## 2. Indexing: clone → chunk → embed → Supabase

- **Script:** `node scripts/index-repos.js` (optionally `--repo NAME --limit N` for one repo).
- **What happens:** Reads repos from repos.json (or gh), clones or pulls each repo into a cache, chunks files (skips node_modules, .git, build, etc.), generates embeddings (Ollama `nomic-embed-text`), upserts into Supabase (`repo_chunks`, `repo_sources`, etc.).
- **Result:** Cross-repo semantic search and summaries. JARVIS uses the **repo-knowledge** skill (`repo_search`, `repo_summary`, `repo_file`, `repo_map`) against this index.
- **Scheduled:** Optional — e.g. `add-repo-index-schedule.ps1` runs the indexer daily at 3 AM. Without that, indexing only runs when you (or a script) run index-repos.js.
- **JARVIS does not** clone or run code inside your other repos unless a tool or script explicitly does (e.g. indexer clones to index; autonomous build only builds in-repo subprojects in the JARVIS repo).

---

## 3. Master product list: products.json (work top-down)

- **What:** Ordered list of **products** (name, repo, description, status). Array order = priority (top = work first).
- **Where:** `products.json` in the JARVIS repo root. See **PRODUCTS.md**.
- **Used by:** JARVIS and heartbeat for “work top down,” “what should I work on?,” “next product.” Focus repo for heartbeat = first active product (or BEAST-MODE by default), then work down the list.
- **JARVIS does:** Read products.json to suggest next product or focus; it does not auto-edit it. You reorder/add/remove products there.

---

## 4. When you ask JARVIS about your repos

- **Cross-repo questions** (“search all repos for X,” “summarize BEAST-MODE,” “find OAuth code in echeo”): JARVIS uses **repo-knowledge** tools (`repo_search`, `repo_summary`, `repo_file`, `repo_map`) against the Supabase index. Index must have been run (index-repos.js) for those repos.
- **“Work top down” / “what should I work on?” / “next product”:** JARVIS reads **products.json** and uses the first active product(s) in order; may suggest issues/PRs or next actions for that product’s repo.
- **GitHub (issues, PRs, workflows):** JARVIS uses the **GitHub** skill (`github_issues`, `github_pulls`, `github_workflow_dispatch`, etc.) for any repo you name; no index required.
- **Repo index / Vault / health:** JARVIS is instructed to use `node scripts/index-repos.js`, `node scripts/jarvis-safety-net.js`, `node scripts/vault-healthcheck.js` when you ask for indexing, health, or Vault checks (see AGENTS.md, TOOLS.md).

---

## 5. Safety net and repo index freshness

- **Script:** `node scripts/jarvis-safety-net.js` (optional `--repair`).
- **Repo-related check:** `repo_index_freshness` — reads Supabase for last index time; warns or fails if the repo index is empty or too old (configurable max hours).
- **JARVIS does not** auto-run the indexer when freshness fails unless you’ve wired that (e.g. a scheduled task that runs index-repos when safety net reports stale index). By default, safety net only reports.

---

## 6. Autonomous build (JARVIS repo only)

- **Script:** `node scripts/jarvis-autonomous-build.js`. Pulls JARVIS repo, validates skills, runs optimize-jarvis --quick, builds **in-repo** subprojects that have a `build` script (discovered automatically).
- **Scope:** Only the JARVIS repo and its subdirectories. JARVIS does **not** clone or build your other repos (e.g. BEAST-MODE, upshift) as part of autonomous build; those are separate repos. To build them, you’d run commands or CI in those repos yourself or add separate automation.

---

## 7. Summary table

| Your repos | What JARVIS does |
|------------|-------------------|
| **repos.json** | Uses as the list to index (clone → chunk → embed). Does not auto-edit. |
| **Indexed repos** | Answers cross-repo questions via repo_search, repo_summary, repo_file, repo_map. |
| **products.json** | Reads for “work top down,” “next product,” heartbeat focus. Does not auto-edit. |
| **Any repo (by name)** | Can use GitHub skill for issues, PRs, workflow_dispatch. No index required. |
| **Repo index freshness** | Safety net checks last index time in Supabase; reports stale/empty. |
| **JARVIS repo only** | Autonomous build can pull, validate, and build in-repo subprojects. |
| **Other repos** | Not cloned or built by JARVIS unless you run a script that does (e.g. indexer). |

**TL;DR:** JARVIS uses **repos.json** to know which repos to index; the **index** powers search/summaries; **products.json** drives “work top down” and focus. It **reads** these files and uses **GitHub** and **repo-knowledge** tools on your repos; it doesn’t change your repo list or product list unless you (or another process) do. Autonomous build and indexing are the only things that touch repo contents (clone/index or build in-repo).
