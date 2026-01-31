# Upshift Roadmap

This document outlines planned features and improvements for Upshift.

---

## ✅ Completed (v0.3.0)

- [x] `upshift scan` — scan for outdated dependencies (npm, yarn, pnpm)
- [x] `upshift explain` — version delta, breaking-change warnings, links
- [x] `upshift explain --ai` — AI-powered deep analysis of breaking changes
- [x] `upshift explain --risk` — risk score (low / medium / high)
- [x] `upshift explain --changelog` — fetch changelog from GitHub
- [x] `upshift upgrade` — upgrade with test and auto-rollback
- [x] `upshift upgrade --all` — batch upgrade all packages
- [x] `upshift fix` — AI-powered code fixes for breaking changes
- [x] `upshift interactive` — TUI for selecting packages
- [x] `upshift workspaces` — monorepo support
- [x] `upshift audit` — security vulnerability scanning
- [x] `upshift notify` — Slack/Discord/webhook notifications
- [x] `upshift rollback` — restore previous state
- [x] GitHub Action for CI/CD integration
- [x] VS Code extension

---

## 🔜 Coming Soon

### Code Migrations
- [ ] Migration templates for major framework upgrades (React, Next.js, etc.)
- [ ] `upgrade --dry-run` — preview code changes without applying

### Integrations
- [ ] GitHub App for repo-level scanning and PR comments
- [ ] Multi-repo dashboard

### Language Support
- [ ] Python support (pip/poetry)
- [ ] Ruby support (bundler)

### Team Features
- [ ] Org-level credit pools
- [ ] Upgrade policies (block high-risk upgrades)
- [ ] Audit logs

### Enterprise
- [ ] SSO (SAML/OIDC)
- [ ] On-premise deployment option
- [ ] SLA and dedicated support

---

## Contributing

We welcome contributions! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

**Areas we'd love help with:**
- Migration templates for popular frameworks
- Package manager improvements (yarn, pnpm edge cases)
- GitHub Action enhancements
- Documentation and examples
