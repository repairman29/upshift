# Product Hunt Listing: Upshift

## Tagline (60 chars max)
AI tells you what breaks when you upgrade npm packages

## Description

**Stop reading changelogs. Let AI explain what breaks.**

Upshift is a CLI tool that scans your dependencies, explains breaking changes with AI, and upgrades them safely with automatic rollback.

### The Problem
You run `npm outdated` and see 47 packages need updating. Now what?
- Read through release notes for each one?
- Hope nothing breaks?
- Put it off for another 6 months?

### The Solution
```bash
npm install -g upshift-cli
upshift scan                    # See what's outdated
upshift explain react --ai      # AI explains breaking changes
upshift fix react               # AI generates code fixes
upshift upgrade react           # Upgrade with auto-rollback
```

### What's Free
- Unlimited scans
- Unlimited upgrades  
- Automatic rollback on test failure
- Basic breaking change warnings

### What's Paid
- AI-powered deep analysis: 1 credit ($0.05)
- AI code fixes: 3 credits ($0.15)
- 10 free credits to start

### Also Available
- **VS Code Extension** - Inline warnings in package.json
- **GitHub Action** - Auto-scan PRs
- **Slack/Discord** - Get notified about vulnerabilities

---

## About the Maker

I'm Jeff, a developer who spent way too many hours reading changelogs and migration guides. I built Upshift as a side project to scratch my own itch.

**This is indie/bootstrapped** - no VC, no team, just me building nights and weekends.

I'm actively developing this and genuinely want your feedback. Drop a comment or hit me up - I respond to everything.

---

## First Comment (Post immediately after launch)

Hey Product Hunt! 👋

I'm Jeff, the maker of Upshift.

**Why I built this:** I was mass if manually reading changelogs every time Dependabot opened a PR. "React 19 has breaking changes" - cool, but WHICH ones affect MY code?

So I built a tool that uses AI to actually explain what matters and even generate the fixes.

**What I'd love feedback on:**
- Is the credit pricing fair? ($0.05 per AI analysis)
- What package managers should I prioritize next? (Currently npm/yarn/pnpm)
- Would you use the GitHub Action in CI?

This is a true side project - I'm actively building and would love to hear what features would make this useful for you.

Try it: `npm install -g upshift-cli && upshift scan`

---

## Maker Info

**Name:** Jeff Adkins
**Twitter/X:** [your handle]
**Website:** https://upshiftai.dev
**GitHub:** https://github.com/repairman29/upshift

---

## Topics/Tags
- Developer Tools
- Artificial Intelligence  
- Open Source
- Productivity
- Command Line

---

## Images Needed

1. **Thumbnail (240x240)** - Logo or icon
2. **Gallery Image 1** - Terminal showing `upshift scan` output
3. **Gallery Image 2** - AI analysis output (`upshift explain react --ai`)
4. **Gallery Image 3** - VS Code extension with inline warnings
5. **Gallery Image 4** - Pricing comparison (Free vs Pro)

---

## Launch Checklist

- [ ] Schedule for Tuesday 12:01 AM PT
- [ ] Prepare first comment (above)
- [ ] Have demo GIF ready
- [ ] Clear calendar to respond to comments all day
- [ ] Prepare honest answers to tough questions:
  - "Why not just use Dependabot?" → We explain + fix, not just notify
  - "Is the AI accurate?" → Uses GPT-4o-mini, focused prompts, but always verify
  - "Will you raise prices?" → Credit model is designed to be sustainable

---

## Social Share Templates

### Twitter/X
```
I built an AI that tells you what breaks when you upgrade npm packages.

No more reading changelogs.
No more surprise breaking changes.
No more mass if "let's just see if it works."

It's called Upshift and it's live on Product Hunt today 🚀

[link]
```

### LinkedIn
```
Launched my side project on Product Hunt today.

Upshift uses AI to explain what actually breaks when you upgrade npm dependencies - and generates the code fixes.

Built it because I was mass if manually reading changelogs every time Dependabot opened a PR.

Would love your feedback: [link]
```
