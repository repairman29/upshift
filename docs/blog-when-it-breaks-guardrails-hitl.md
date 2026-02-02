# When it breaks, who fixes it, and why human-in-the-loop still matters

*Three questions experienced engineers ask about AI-powered dependency upgrades—and how we answer them.*

---

Dependency upgrades are boring until they break something. Then everyone wants to know: *when* did it break, *who* is supposed to catch it, and whether we’re really letting an AI change code without a human in the loop.

We get that. Here’s how we think about it.

## “When does it break?”

**At upgrade time.** Not “sometime after a code push” or “when the moon is full.” When you—or your CI—run `upshift upgrade <pkg>`, we change the manifest and lockfile, run your tests, and roll back if tests fail. The break is surfaced *at that moment* and reverted.

So:

- **You run `upshift upgrade`** → We update `package.json` and the lockfile, then run `npm test`. If tests fail, we roll back. The “break” is immediate and undone.
- **CI runs Upshift** → Same contract. Upgrade → run tests → fail the job (and optionally roll back) if tests fail. CI doesn’t self-heal; it *surfaces* the problem. We use that same guardrail.
- **You run `upshift fix`** → That’s for *code* changes (LLM-generated fixes for breaking API changes). You run it when you know an upgrade will break code, or after it already did. It’s an explicit step, not something that fires automatically on push.

**TL;DR:** “Breaks when?” → When an upgrade is applied and tests run. Tests are the gate.

## CI/CD and smoke tests: we’re not replacing them

Today, CI/CD with smoke or integration tests *surfaces* problems. It doesn’t self-heal. We’re aligned with that:

- We **run your tests** after every upgrade (if you have a test script). If they fail, we roll back and exit with failure.
- We don’t replace CI; we **use the same guardrail**: “tests pass = safe to keep the change.”
- The GitHub Action runs a **scan** on PRs (outdated deps, risk). You can also run `upshift upgrade` in CI; the job fails if the upgrade breaks tests.

Existing CI and test suites stay the source of truth. Upshift adds upgrade + optional code fixes on top of that contract.

## Self-healing LLM code: why human-in-the-loop still matters

**LLM-generated code changes should be reviewed.** “Self-healing” by applying AI-generated patches with no oversight is risky. We’re not pretending otherwise.

What we do today:

- **`upshift fix --dry-run`** — Preview every suggested change. Review the diff, then apply manually or run `upshift fix` without `--dry-run` when you’re satisfied.
- **Approval for upgrades** — Major (and optionally other) upgrades can require a prompt or webhook approval before we touch the manifest or lockfile. See [Human-in-the-Loop (HITL)](../upshiftai/docs/HITL.md).
- **No silent auto-apply of code fixes** — Fixes are either shown for review (dry-run) or applied only after an explicit confirm (or `-y` in automation, where *you’ve* chosen to trust the pipeline).

Recommendation: treat **dependency upgrades** as guardrailed by tests and optional approval. Treat **LLM-generated code fixes** as human-in-the-loop: review (dry-run, PR, or approval workflow) before merging. For full approval gates and event hooks, see [HITL in the docs](../upshiftai/docs/HITL.md).

---

So: it breaks at upgrade time, tests are the guardrail, and we don’t self-heal code without giving you a way to stay in the loop. If that matches how you want to work, [give Upshift a try](https://github.com/repairman29/upshift).
