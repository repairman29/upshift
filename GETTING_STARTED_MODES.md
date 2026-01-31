# JARVIS operational modes (first repo pull)

On your first pull you can run JARVIS in three tiers: **Blue** (free + fallback), **Yellow** (premium fallback), and **Hot Rod** (paid services). Pick one or combine them in a waterfall.

---

## 🔵 Blue — free + fallback

**Cost: $0.** Default for most users.

- **Primary:** Groq (free, very fast) — `groq/llama-3.1-8b-instant`
- **Fallbacks (waterfall):** Groq 70B → OpenRouter (free tier) → Together (free Llama 3.3 70B)

When the primary hits rate limit (429) or context overflow, the gateway tries the next in line. All free.

**Keys:** `GROQ_API_KEY`, optional `OPENROUTER_API_KEY`, `TOGETHER_API_KEY` in `.env` or Vault.  
**Setup:** [scripts/FREE_TIER_FALLBACKS.md](scripts/FREE_TIER_FALLBACKS.md)

---

## 🟡 Yellow — premium fallback

**Cost: free tier limits, then paid.** Use when you want a stronger fallback chain or higher limits.

- Same primary as Blue (Groq 8B).
- **Fallbacks:** Groq 70B, OpenRouter, Together, plus **OpenAI** or **Anthropic** (free tiers or paid) as later fallbacks.

Good for when Groq/OpenRouter/Together are rate-limited and you have OpenAI or Anthropic keys.

**Keys:** Add `OPENAI_API_KEY` and/or `ANTHROPIC_API_KEY` to `.env` or Vault; add the provider and models to `clawdbot.json` fallbacks.

---

## 🔴 Hot Rod — paid services

**Cost: pay-per-use.** Best quality and throughput when you need it.

- **Primary:** Paid model (e.g. `anthropic/claude-sonnet-4-5`, `openai/gpt-4o`)
- **Fallbacks:** Your choice — e.g. Groq 70B, then OpenRouter/Together, then other paid models.

Use for complex reasoning, multi-file edits, or when you want the best model first and free fallbacks only when paid fails.

**Keys:** `ANTHROPIC_API_KEY`, `OPENAI_API_KEY`, etc. in `.env` or Vault. Set `agents.defaults.model.primary` to your paid model in `clawdbot.json`; keep free models in `fallbacks` for a waterfall.

---

## Summary

| Mode     | Primary        | Fallbacks                    | Cost   |
|----------|----------------|------------------------------|--------|
| 🔵 Blue  | Groq 8B (free) | Groq 70B → OpenRouter → Together | $0     |
| 🟡 Yellow| Groq 8B        | + OpenAI / Anthropic (free or paid tier) | Free tier, then paid |
| 🔴 Hot Rod | Paid (Claude, GPT-4o, etc.) | Your waterfall (e.g. Groq, OpenRouter, Together) | Pay-per-use |

**First repo pull:** Start with **Blue**. Add OpenRouter + Together keys and fallbacks ([FREE_TIER_FALLBACKS.md](scripts/FREE_TIER_FALLBACKS.md)), then start the gateway. Add Yellow or Hot Rod when you add the keys and config.

**Secrets:** Prefer Supabase Vault for keys; use `node scripts/start-gateway-with-vault.js` so the gateway reads from Vault. See [docs/VAULT_MIGRATION.md](docs/VAULT_MIGRATION.md).
