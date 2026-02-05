# upshiftai.dev — Product Hunt launch review

Quick review of the site for your Product Hunt launch and what was changed.

---

## What’s in good shape

- **Value prop** — “Stop reading changelogs. Let AI tell you what breaks.” is clear and different from Dependabot/Renovate.
- **Hero** — Install command + “Get Started” and “Star on GitHub” give a clear next step.
- **Demo** — GIF gallery (Full Workflow, Scan, AI Explain, etc.) shows the product without a signup.
- **Comparison** — Dependabot vs Upshift table makes the “explain + fix, not just bump” story obvious.
- **Pricing** — Free / Pro / Team is visible and easy to scan.
- **FAQ** — Covers “How is Upshift different?”, credits, rollback, HITL.
- **Get Started** (`/start`) — Step-by-step install and first commands.
- **Radar** — Free tier is tryable from the nav.
- **Analytics** — Plausible on upshiftai.dev.

---

## Changes made for launch

1. **Product Hunt banner**  
   Orange bar at the top: “We're live on Product Hunt →” linking to your PH page.  
   **Action:** In `web/index.html`, set the `href` of `#ph-banner` to your real Product Hunt URL (e.g. `https://www.producthunt.com/posts/upshift` or the exact launch link).

2. **OG / Twitter card image**  
   Added `og:image`, `og:url`, and `twitter:image` pointing to `https://upshiftai.dev/og.png` so shares on Product Hunt, Twitter, Slack, etc. get a proper preview.  
   **Note:** `web/og.png` is currently the hero asset; ideal size for social is **1200×630**. If the crop looks wrong, replace `web/og.png` with a 1200×630 version (and compress if needed).

3. **Bottom CTA**  
   - Primary action is now **“Get started free”** (link to `/start`) plus **“Star on GitHub”**, so PH traffic can try the product or star without joining a waitlist.  
   - **“Want product updates?”** and the email form are clearly secondary (“Join the list” button).  
   - Waitlist count is shown only when the API returns a number (“50+ on the list”), and the previous `waitlist-count` DOM bug is fixed.

4. **Waitlist count bug**  
   The script was updating `#waitlist-count` but the element didn’t exist. Added the element and a `#waitlist-count-line` that is only shown when a count is available.

---

## Optional follow-ups

- **PH link** — Replace the placeholder PH URL in the banner with your actual launch URL.
- **og.png** — If `og.png` isn’t 1200×630 or looks cropped badly on shares, swap in a dedicated 1200×630 image and optionally compress (e.g. &lt; 1MB).
- **Test shares** — Share the homepage on Twitter/Slack/LinkedIn and confirm the card shows the right title, description, and image.
- **Mobile** — Spot-check hero, demo grid, and CTA on a phone; viewport and tap targets are already in place.
- **Radar** — If Radar is a key story for PH, consider a stronger in-hero or “See Radar” CTA.

---

## One-line summary

The site is in good shape for launch: clear value prop, try-before-signup (install + Radar), and comparison to Dependabot. The updates above make the Product Hunt banner and social previews work and put “Get started free” ahead of the waitlist so PH visitors can act immediately.
