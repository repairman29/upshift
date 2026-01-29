# Dependabot tells you what to upgrade. Upshift upgrades it and fixes the code.

Dependency upgrades are the most boring high-risk work in software. Everyone knows they matter, and everyone delays them.

Here’s why they feel so painful:
- Breaking changes are buried in changelogs
- Migration guides are scattered across docs and blog posts
- Tests fail, and rollback is manual
- The same work repeats across every repo

## The idea

Upshift turns upgrades into a workflow:

**Scan → Explain → Upgrade → Test → Rollback**

One command at a time, everything in the terminal.

## What Upshift does today

- Scans dependencies for updates and vulnerabilities (npm)
- Explains risk when versions jump across majors
- Upgrades a dependency and runs tests
- Rolls back if tests fail

## What makes it different

Dependabot tells you what to upgrade. Upshift performs the upgrade.  
Copilot helps if you ask. Upshift is built specifically for upgrades.

## What’s coming next

- AI migration fixes
- Yarn/pnpm support
- Scheduled upgrades + PRs
- Team policies and audit logs

