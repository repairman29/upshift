# Optional anonymized insights

Upshift does **not** collect any usage data by default. No telemetry, no analytics, no uploads.

## Opt-in: local outcome recording

If you set **`UPSHIFT_RECORD_OUTCOMES=1`** when running upgrades, the CLI will append upgrade outcomes to a local file:

- **Location:** `.upshift/outcomes.json` in your project directory
- **Contents:** One entry per upgrade: `packageName`, `fromVersion`, `toVersion`, `testsPassed`, `recordedAt`
- **Use:** Local only. You can use this data to review upgrade history or feed your own analytics. We do not read or upload this file.

Example:

```bash
UPSHIFT_RECORD_OUTCOMES=1 upshift upgrade react
```

After the upgrade (and tests, if configured), a record is appended:

```json
{
  "packageName": "react",
  "fromVersion": "18.2.0",
  "toVersion": "19.0.0",
  "testsPassed": true,
  "recordedAt": "2026-02-01T12:00:00.000Z"
}
```

## Future: optional anonymized insights

We may offer an **opt-in** flow to contribute anonymized, aggregate data (e.g. “package X upgrade from A to B: tests passed/failed”) to improve risk scoring and recommendations for everyone. If we do:

- We will document it here and in the CLI
- There will be no collection without explicit opt-in
- No source code or identifying information will be sent

Nothing of the kind is implemented today.
