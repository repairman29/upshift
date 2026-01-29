# Launch Pack

## Product Hunt Draft

**Name:** Upshift  
**Tagline:** Dependabot that actually upgrades and fixes your code  
**Description:**  
Upshift is a CLI that scans dependencies, explains breaking changes, applies upgrades, runs tests, and can roll back if anything fails. It is built for developers who dread dependency upgrades.

**Key features:**
- Scan outdated and vulnerable dependencies
- Explain breaking changes and risks
- Upgrade with safe rollback
- Works in your terminal

**First comment draft:**  
I built Upshift because dependency upgrades are still painful in 2026. Dependabot tells you what to upgrade. Upshift actually upgrades and runs tests, with rollback if something fails.  

If you try it, I would love feedback on:
1. Which package manager should we support next
2. What migration steps should be automated first

## Hacker News Draft

**Title:** Show HN: Upshift – a CLI that upgrades dependencies and rolls back if tests fail  

**Post:**  
I built a CLI called Upshift that scans dependencies, explains breaking changes, upgrades packages, runs tests, and rolls back if anything fails.  

It is early but I am looking for feedback from devs who hate upgrades.  

What would make you trust a tool like this to apply migrations automatically?

## Demo Script

```
upshift scan
upshift explain react --from 18.2.0 --to 19.0.0
upshift upgrade react --to 19.0.0
```

## Launch Checklist

- [ ] Publish repo to GitHub
- [ ] Add README with install and quickstart
- [ ] Record 60s demo (terminal + test pass)
- [ ] Post on Product Hunt
- [ ] Post on Hacker News
- [ ] Share on Twitter/X and Discord

