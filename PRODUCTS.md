# Master product list (work top-down)

Single source of truth for **which products we have** and **what order to work them**. JARVIS, heartbeat, and PM mode use this to “work top down.”

---

## The list

**Canonical order:** `products.json` (repo root). **Array order = priority:** first = work first, then next, and so on.

| Field | Meaning |
|-------|--------|
| `name` | Product display name |
| `repo` | GitHub repo name (repairman29/`repo`) — must match `repos.json` if indexed |
| `description` | One-line what it is |
| `status` | Optional: `active`, `paused`, `archived` |
| `shipAccess` | Optional: `true` = JARVIS is allowed to **ship** this product (commit, push, deploy, run ops). See **docs/JARVIS_FULL_ACCESS_ONE_PRODUCT.md**. |
| `deepWorkAccess` | Optional: `true` = JARVIS is allowed to do **deep work** on this product: full-cycle planning (PRD, roadmap, metrics), development (issues, PRs, implementation), and execution (ship, run operation). See **jarvis/DEEP_WORK_PRODUCT.md**. Implies sustained focus; shipAccess is still required for JARVIS to actually push/deploy. |

Edit `products.json` to:

- **Reorder** — move entries up/down for top-down priority.
- **Add** — new product (same shape; repo must exist in `repos.json` for indexer).
- **Remove** — delete the entry (or set `status: "archived"`).
- **Update** — change name, repo, description, or status.

---

## How it’s used

- **You:** “What should I work on?” / “Work top down” → JARVIS uses the list order and suggests the next product(s).
- **Heartbeat / PM:** Can pick “next product from list” for scans, issues, or PRs (see `jarvis/HEARTBEAT.md`, `jarvis/BEAST_MODE_PM.md`).
- **Scripts:** `products.json` is JSON; scripts (e.g. index-repos, autonomous build, custom tooling) can read it to know product set and order.

---

## Relationship to repos

- **repos.json** — All repairman29 GitHub repos (for cloning, indexing, search).
- **products.json** — Subset + order: the **products** we care about and the **order we work them** (top down). A product usually maps to one repo; you can add products whose code lives in multiple repos by convention (e.g. same `name`, multiple entries or a single “umbrella” product pointing at the main repo).

---

## Quick commands

```bash
# View list (pretty)
node -e "console.log(JSON.stringify(require('./products.json'), null, 2))"

# Count
node -e "console.log(require('./products.json').length)"
```

**TL;DR:** Edit `products.json` to keep a master list of products in **top-down order**. JARVIS and scripts use it to work through them in that order.
