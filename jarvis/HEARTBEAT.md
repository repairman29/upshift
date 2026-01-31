# Heartbeat — JARVIS ROG Ed.

Short checklist for periodic heartbeat runs. Keep this file tiny to avoid token burn.
Heartbeat should **drive production**: check queues, launch subagents, and advance shipping.

## Today (Production Mode — Beast-Mode focus)
- [ ] Check if user needs anything (if no action items, continue checklist)
- [ ] **Product order:** Use **products.json** (master list, top-down). Focus repo = first active product unless user says otherwise; then work down the list.
- [ ] Focus repo: **BEAST-MODE** (primary) or next product from list. Defer other repos unless asked.
- [ ] Scan for pending tasks: focus-repo issues/PRs, recent failures, blocked threads
- [ ] If GitHub is available: run `github_status`; if OK, pick 1 BEAST-MODE action (issue, PR, workflow_dispatch)
- [ ] If background work is needed: spawn subagents with clear deliverables and ETA
- [ ] Note any follow-ups from recent chats (Discord, CLI, repo ops)

## Optional
- [ ] Summarize system health if performance-monitor is enabled
- [ ] Suggest one quick win (e.g. "Run CLI test", "Trigger workflow", "Draft PRD")

## Response rule
- If **no actionable items**: reply **HEARTBEAT_OK**
- Otherwise: reply **HEARTBEAT_REPORT** with 3–5 bullets and a next action
