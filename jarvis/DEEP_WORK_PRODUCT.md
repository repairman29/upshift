# Deep work: product planning, development, and execution

When the user wants JARVIS to do **deep work** on a product — full-cycle planning, development, and execution — use this mode. Scope to one product (from **products.json**); prefer products with **`deepWorkAccess: true`** or **`shipAccess: true`** so JARVIS can plan, build, and ship.

---

## What “deep work” means

1. **Planning** — Problem → users → outcomes; PRD (or outline), roadmap, milestones, success metrics (north star + KPIs), launch checklist. Concrete artifacts, not hand-wavy.
2. **Development** — Break work into issues/PRs; propose architecture and tasks; implement, refactor, test; use repo-knowledge and GitHub. Durable work units (issues, PRs); spawn subagents for long implementation passes.
3. **Execution** — Ship: commit, push, deploy, run the operation. Use **shipAccess** (see docs/JARVIS_FULL_ACCESS_ONE_PRODUCT.md). Drive CI via workflow_dispatch; verify and iterate.

Deep work = **sustained focus** on one product across all three, with checkpoints and clear next actions.

---

## When to use it

**Trigger phrases (examples):**

- “Do deep work on [product]”
- “Full product cycle for [product]”
- “Plan, develop, and execute [product]”
- “Take over [product]: planning, development, and execution”
- “Deep work on BEAST-MODE” / “full product cycle for upshift”

**Scope:** One product at a time. Read **products.json**; if the product has **`deepWorkAccess: true`** (or **`shipAccess: true`**), JARVIS is allowed to do full-cycle work including shipping. If only planning/development is requested, JARVIS can do planning + development without ship rights.

---

## How to run it

### 1. Planning phase

- **Problem → user → outcome.** Who is it for, what problem, what success looks like.
- **Artifacts:** PRD (or PRD outline), roadmap with phases/milestones, success metrics (north star + 2–3 KPIs), launch checklist per segment (e.g. dev, agent, human).
- Use **Product Manager Mode** rules (see AGENTS.md). Prefer **impact vs effort**; state what is deferred.
- **Output:** Shared doc or summary (e.g. paste in chat, or create/update a doc in repo). End with **next action** (e.g. “Create 3 issues for milestone 1,” “Draft architecture for X”).

### 2. Development phase

- **Break work down:** Map roadmap/milestones to **issues** and **PRs**. Use **GitHub** tools: create issues, open PRs, comment. Prefer **triad/swarm** when the user wants parallel roles (PM, Eng, QA, UX, Ops) — see **PO_SWARMS.md**.
- **Implementation:** Use **repo-knowledge** (repo_search, repo_summary, repo_file) for context; use **exec** (when elevated) for running tests, linters, builds. For long implementation runs, **spawn a subagent** with clear deliverables and ETA; checkpoint and summarize when it finishes.
- **Output:** Issues/PRs created or updated; code or docs changed; test/build status. End with **next action** (e.g. “Merge PR #5 then run deploy,” “Add acceptance tests for feature X”).

### 3. Execution phase

- **Ship:** For products with **shipAccess: true**, run the shipping flow: pull, validate, commit, push, deploy (see **REPAIRMAN29_OPERATIONS.md** — Shipping Flow). Use **platform CLIs** (Vercel, Railway, etc.) per TOOLS.md when that product deploys there.
- **Run the operation:** Trigger **workflow_dispatch** if the repo uses GitHub Actions for deploy/build; run scripts or CLIs for the product. Verify (e.g. health check, smoke test) and report.
- **Output:** What was pushed/deployed, links (e.g. PR, deploy URL), and any follow-up (e.g. “Monitor for 24h,” “Next: milestone 2”).

---

## Checkpoints and scope

- **Checkpoints:** After each phase (or after each major milestone within a phase), give a short summary: what was done, what’s next, one **next action**.
- **Long runs:** If the user says “do the full cycle” or “deep work for the next 2 weeks,” break into **sprints**: e.g. “Week 1: planning + first 3 issues; Week 2: implement + ship.” Use **sessions_spawn** for heavy implementation; deliver a concise final summary + next action when the subagent finishes.
- **Guardrails:** No destructive actions unless explicitly asked. Never commit secrets. Prefer repo scripts and GitHub as durable work units.

---

## Relation to other modes

| Mode | Use when |
|------|----------|
| **Deep work (this doc)** | User wants full-cycle: planning + development + execution on one product. |
| **Beast-Mode PM** (BEAST_MODE_PM.md) | User wants JARVIS as PM for BEAST-MODE only; same PM rules, can add deep work if user asks. |
| **Triad / swarm** (PO_SWARMS.md) | User wants a one-shot multi-role pass (PM + Eng + QA, etc.); can be one phase inside deep work. |
| **Ship access** (JARVIS_FULL_ACCESS_ONE_PRODUCT.md) | User wants JARVIS to ship/run ops only; no full planning/development cycle. |

**TL;DR:** Deep work = **planning** (PRD, roadmap, metrics) → **development** (issues, PRs, implementation, tests) → **execution** (ship, deploy, run operation). Scope to one product; use **deepWorkAccess** or **shipAccess** in products.json to know where JARVIS can ship. Use checkpoints, spawn for long runs, and always end with a **next action**.
