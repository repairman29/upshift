# JARVIS workspace templates

These files are **templates** for your real JARVIS workspace (`~/jarvis` or wherever Clawdbot runs from). They include Kroger so JARVIS has full access to grocery tools.

## Use

**Option A — Copy into existing `~/jarvis`**

- Merge **TOOLS.md** into your existing `~/jarvis/TOOLS.md` (add the Kroger section).
- Merge **AGENTS.md** into your existing `~/jarvis/AGENTS.md` (add the Kroger and default-behavior sections if missing).

**Option B — Replace**

- If you don’t have `~/jarvis/TOOLS.md` or `AGENTS.md` yet, copy these files into `~/jarvis/`.

Then restart the gateway:

```bash
clawdbot gateway restart
```

## Contents

| File      | Purpose |
|-----------|---------|
| **TOOLS.md**  | Lists Kroger, repo-knowledge, repo index & Vault scripts, and other skills so the agent knows which tools/scripts exist and when to use them. |
| **AGENTS.md** | Tells the agent to call Kroger tools for grocery requests, use repo index/safety net/Vault in ops mode, and how to reply in DMs. |

After copying/merging, JARVIS will have full access to Kroger search, stores, shopping list, and cart.
