# Upshift 60-Second Demo Script

## Goal

Show how Upshift removes risk and effort from dependency upgrades.

## Script (voiceover)

"Dependency upgrades are still painful.  
Breaking changes are hidden in changelogs, tests fail, and rollbacks are manual.  
Upshift makes upgrades safe and repeatable from the CLI."

## Demo Steps (terminal)

1) Scan the repo
```
upshift scan
```

2) Explain a dependency upgrade
```
upshift explain react --from 18.2.0 --to 19.0.0
```

3) Run the upgrade
```
upshift upgrade react --to 19.0.0
```

4) Show tests running and pass

## Closing

"Scan, explain, upgrade, test, rollback.  
That’s Upshift."

## On-screen captions

- "Dependabot tells you what to upgrade. Upshift does it."
- "Safe upgrades with rollback."
- "Built for developers who hate dependency days."
