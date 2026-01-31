# Memory, MCP, and lightning-fast JARVIS

Short answer: **we do not have an "a2a MCP server" or shared memory service in this repo.** What we have is below — plus what to turn on so JARVIS stays fast.

---

## What's in this repo vs at home

| Thing | In JARVIS repo? | Where it lives |
|-------|------------------|----------------|
| **A2A MCP server** | **No** | Not present. No agent-to-agent MCP server or shared memory service in the repo. |
| **MCP** | Yes (Cursor only) | Cursor ↔ Supabase ([SUPABASE_MCP_SETUP.md](../SUPABASE_MCP_SETUP.md)), Cursor ↔ browser (IDE MCPs). **Clawdbot does not use Cursor's MCP**; it uses skills/plugins and its own session store. |
| **Clawdbot session** | No (config at home) | `%USERPROFILE%\.clawdbot\agents\main\sessions\sessions.json` and gateway config. |
| **Clawdbot/OpenClaw memory** | No (config at home) | OpenClaw's **memory plugin** (default: `memory-core`) and **memory search** are configured in `%USERPROFILE%\.clawdbot\clawdbot.json` (and OpenClaw docs). Not in the repo. |

So: **a2a MCP server memory systems are not set up in this repo.** Fast replies come from model choice, context size, bootstrap size, and (optionally) OpenClaw memory + compaction so the agent doesn't carry a huge context every time.

---

## What we already did for speed

- **Smaller bootstrap:** `agents.defaults.bootstrapMaxChars` (e.g. 3000) so injected workspace content is trimmed.
- **128K context on providers:** `contextWindow: 131072` for Groq/OpenRouter/Together so the prompt isn't capped at 16K.
- **Fast primary model:** e.g. OpenRouter Trinity Mini (or Groq 8B when not rate-limited); fallbacks in [FREE_TIER_FALLBACKS.md](FREE_TIER_FALLBACKS.md).
- **Discord session alias:** So replies deliver; see [DISCORD_ROG_ED.md](DISCORD_ROG_ED.md) "Add your Discord user ID as session alias".

---

## Enable memory + compaction (step-by-step)

1. **Workspace memory files**  
   The repo already has `jarvis/MEMORY.md` and `jarvis/memory/` (daily notes go in `memory/YYYY-MM-DD.md`). If your gateway uses a different workspace path, ensure that workspace has the same layout.

2. **Embedding API key**  
   Memory search needs embeddings. Pick one:
   - **OpenAI:** set `OPENAI_API_KEY` in `%USERPROFILE%\.clawdbot\.env` (used by the example config).
   - **Gemini:** set `GEMINI_API_KEY` and use `provider: "gemini"`, `model: "gemini-embedding-001"` in `memorySearch`.
   - **Local:** set `memorySearch.provider: "local"` and `memorySearch.local.modelPath` (e.g. a GGUF path); no API key.

3. **Merge config into clawdbot.json**  
   Copy the blocks from **[scripts/clawdbot-memory-and-compaction.example.json](clawdbot-memory-and-compaction.example.json)** into `%USERPROFILE%\.clawdbot\clawdbot.json`:
   - `plugins.slots.memory`: keep `"memory-core"` (or omit to use default).
   - `agents.defaults.memorySearch`: provider, model, remote.apiKey (or use `${OPENAI_API_KEY}` and ensure it's in `.env`).
   - `agents.defaults.compaction`: mode, reserveTokensFloor, memoryFlush.
   - `agents.defaults.contextPruning`: optional; trims old tool results so context stays smaller and responses faster.

   Merge under the existing `agents.defaults` and `plugins` keys; don't replace the whole file.

4. **Restart the gateway**  
   `npx clawdbot gateway stop` then `npx clawdbot gateway run` (or your start script).

5. **Verify memory**  
   From the repo (or your cwd):  
   - `npx clawdbot memory status`  
   - `npx clawdbot memory status --deep` to check vector/embedding availability.  
   - `npx clawdbot memory index --verbose` to trigger an index of `MEMORY.md` and `memory/*.md`.

References: [OpenClaw Memory](https://docs.clawd.bot/concepts/memory), [CLI memory](https://docs.clawd.bot/cli/memory), [Session management + compaction](https://docs.clawd.bot/reference/session-management-compaction).

---

## Other ways to speed up delivery

| What | Where | Why |
|------|--------|-----|
| **Smaller bootstrap** | `agents.defaults.bootstrapMaxChars: 3000` (or 2000) | Less workspace text in every prompt → faster first token. |
| **Context pruning** | `agents.defaults.contextPruning` (see example JSON) | Trims old tool results so context doesn't balloon; keeps turns fast. |
| **Compaction + memory flush** | `agents.defaults.compaction` | Summarizes old turns and flushes notes to disk before compacting so context stays small. |
| **Fast primary model** | `agents.defaults.model.primary` | e.g. OpenRouter Trinity Mini or Groq 8B; see [FREE_TIER_FALLBACKS.md](FREE_TIER_FALLBACKS.md). |
| **128K context on providers** | `models.providers.*.models[].contextWindow: 131072` | Avoids accidental 16K cap and overflow. |
| **Memory search** | `agents.defaults.memorySearch` | Agent uses `memory_search` / `memory_get` instead of re-reading huge context. |
| **Discord session alias** | See [DISCORD_ROG_ED.md](DISCORD_ROG_ED.md) | Ensures replies are delivered so the bot doesn't "hang". |
| **Block streaming** | `agents.defaults.blockStreamingDefault: "on"` (per channel if needed) | Streams reply in chunks so the user sees progress sooner (Discord/Telegram etc.). |
| **Inbound debounce** | `messages.inbound.debounceMs` | Batches rapid messages into one turn; reduces duplicate work. |

---

## Quick checklist (lightning fast)

- [x] Primary model fast and 128K context (e.g. OpenRouter Trinity / Groq 8B).
- [x] Fallbacks so 429/overflow don't block (see [FREE_TIER_FALLBACKS.md](FREE_TIER_FALLBACKS.md)).
- [x] `bootstrapMaxChars` reduced (e.g. 3000).
- [x] Discord session alias so replies deliver.
- [ ] **(Optional)** Memory plugin enabled and embeddings configured so the agent can use `memory_search` / `memory_get`.
- [ ] **(Optional)** Compaction (and memory flush) tuned so context stays small; see example JSON and OpenClaw compaction docs.
- [ ] **(Optional)** Context pruning enabled so old tool results are trimmed.

We do **not** have a2a MCP server memory in the repo; we have Cursor MCP (Supabase, browser) and Clawdbot session + optional OpenClaw memory. For "lightning fast," the above is what's set up and what to add.
