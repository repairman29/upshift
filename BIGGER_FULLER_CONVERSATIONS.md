# Bigger, fuller conversations with JARVIS

Discord is **great for quick hits** and chatting from your phone, but it’s not ideal for long threads, big pastes, or serious back-and-forth. Here’s how to have **bigger, fuller** conversations with JARVIS.

---

## 1. Web dashboard (best for “full” when at the machine)

**Open:** http://127.0.0.1:18789/ (with the gateway running)

- **Full-screen chat** — Bigger input, scrollable history, no Discord character limits.
- **Paste long messages** — Paste docs, code snippets, or multi-paragraph context.
- **Rich replies** — Markdown, formatting, and tool output are easier to read than in Discord.
- **Same session** — Conversation continues; JARVIS keeps context across turns.

**Quick access:** Bookmark the URL, or run `scripts\create-jarvis-shortcut.ps1` for a Desktop shortcut. Optional: bind **Win+J** (e.g. via PowerToys) to open the dashboard.

Use the **web UI** when you’re at the PC and want a real “conversation” — planning, long prompts, or tool-heavy work.

---

## 2. CLI with a stable session (terminal-first, scriptable)

**Command:**  
`npx clawdbot agent --session-id "ally" --message "your message here" --local`

- Use the **same** `--session-id` (e.g. `"ally"` or `"main"`) every time so JARVIS keeps context.
- **Paste long or multi-line** messages (terminal supports it); send multiple turns in a row.
- Good for **scripting** or when you live in the terminal — e.g. pipe content:  
  `Get-Content draft.md | ForEach-Object { npx clawdbot agent --session-id ally --message $_ --local }` (or a single message with the full content).

Use the **CLI** when you prefer the terminal, want to script JARVIS, or need to send large input from files.

---

## 3. Discord — when to use it

- **Quick asks** from your phone or another PC (“What’s the deploy status?”, “Remind me of X”).
- **Notifications and alerts** — JARVIS can message you (e.g. safety net, completion).
- **Short, casual** back-and-forth.

Discord is **not** the right place for long design docs, big code reviews, or multi-turn planning. For those, use the **web dashboard** or **CLI** with a stable session.

---

## 4. Cursor (where you are now)

You’re in **Cursor** — this chat is already a “bigger fuller” conversation (long context, code, multi-file). Use it for:

- **Deep code/design** work and architecture.
- **Repo-wide** questions (MCP, Supabase, etc. when configured).

Use **JARVIS web or CLI** when you want JARVIS’s **skills and tools** (Launcher, repo index, Vault, platform CLIs, etc.) and a dedicated, scrollable conversation with the same agent.

---

## Summary

| Where        | Best for |
|-------------|----------|
| **Web UI**  | Bigger, fuller conversations at the machine — long prompts, history, rich replies. |
| **CLI**     | Terminal-first, scriptable, same session for context; paste long or multi-line input. |
| **Discord** | Quick asks, phone, alerts; keep it short. |
| **Cursor**  | Deep code/repo work; use JARVIS web/CLI when you need JARVIS’s tools and a long session. |

**TL;DR:** For “bigger fuller” with JARVIS, use **http://127.0.0.1:18789/** (web) or the **CLI** with a stable `--session-id`. Use Discord for quick, casual, or remote use.
