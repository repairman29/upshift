# When it breaks & CI/CD guardrails

Feedback from experienced engineers often centers on three questions. Here’s how Upshift fits in.

## When does it break?

**It breaks at upgrade time** — when you (or CI) run `upshift upgrade <pkg>`, not “after a random code push.”

1. **You run `upshift upgrade`**  
   We update `package.json` and the lockfile, then run your test script (`npm test`). If tests fail, we **roll back** to the previous state. So the “break” is surfaced immediately and reverted.

2. **CI runs Upshift**  
   Same contract: upgrade → run tests → fail the job (and optionally roll back) if tests fail. CI doesn’t self-heal; it **surfaces** the problem. Upshift uses that same guardrail.

3. **You run `upshift fix`**  
   This is for **code** changes (LLM-generated fixes for breaking API changes). You run it when you know an upgrade will break code, or after an upgrade already broke things. It doesn’t run automatically on push; it’s an explicit step.

So: **“Breaks when?”** → When an upgrade is applied and tests run. Not “sometime after a push” — at the moment of upgrade, with tests as the gate.

## CI/CD and smoke/integration tests

Today, CI/CD with smoke or integration tests **surfaces** problems; it doesn’t self-heal. Upshift is aligned with that:

- We **run your tests** after every upgrade (if you have a test script). If they fail, we roll back and exit with failure.
- We don’t replace CI; we **use the same guardrail**: “tests pass = safe to keep the change.”
- The GitHub Action runs a **scan** on PRs (e.g. outdated deps, risk). You can also run `upshift upgrade` in CI; the job fails if the upgrade breaks tests.

So existing CI/CD and test suites remain the source of truth; Upshift adds upgrade + optional code fixes on top of that contract.

## Self-healing LLM code fixes and Human-in-the-Loop

**LLM-generated code changes should be reviewed.** “Self-healing” by applying AI-generated patches without oversight is risky.

What we do today:

- **`upshift fix --dry-run`** — Preview all suggested code changes. Review in diff form, then apply manually or run `upshift fix` without `--dry-run` after you’re satisfied.
- **Approval for upgrades** — Major (and optionally other) upgrades can require a prompt or webhook approval before we change the manifest/lockfile. See [Human-in-the-Loop (HITL)](../upshiftai/docs/HITL.md).
- **No silent auto-apply of code fixes** — Fixes are either shown for review (dry-run) or applied only after an explicit confirm (or `-y` in automation, where you’ve chosen to trust the pipeline).

Recommendation: treat **dependency upgrades** as guardrailed by tests and optional approval; treat **LLM-generated code fixes** as Human-in-the-Loop: review (e.g. dry-run, PR, or approval workflow) before merging. For full approval gates and event hooks, see [upshiftai/docs/HITL.md](../upshiftai/docs/HITL.md).
