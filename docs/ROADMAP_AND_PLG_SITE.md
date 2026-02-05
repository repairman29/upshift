# What’s next + PLG site improvements (animations, GIFs, growth)

Two threads: **roadmap priorities** and **site motion/visuals** for better product-led growth.

---

## 1. What’s next on the roadmap

From [ROADMAP.md](../ROADMAP.md), the main **not-yet-done** items:

### Platform / v0.5.0 (highest impact for growth)

| Priority | Item | Why it matters for PLG |
|----------|------|------------------------|
| **1** | **Published one-click GitHub App** | Low-friction try: “Install Upshift” on a repo → scan on PR + comment. No CLI install to see value. |
| **2** | **Platform audit endpoint** | Teams can send upgrade/fix events to your backend; enables usage dashboards and “who upgraded what.” |
| **3** | **Org-level credit pools** | Team plan: shared credits, org context; unblocks real team adoption. |

### Team & enterprise (after PLG flywheel)

- **Audit logs** — Who ran which upgrade/fix, when; CLI already can POST to `UPSHIFT_AUDIT_URL`.
- **Enterprise** — SSO (SAML/OIDC), on-premise option, SLA. See [docs/enterprise.md](enterprise.md).

### Product polish (already strong)

- Migration templates, Python/Ruby/Go parity, Radar Pro, VS Code explain/fix in editor are done.
- **Custom migration generators** (learn from code style) and **regression prediction** are longer-term innovation.

**TL;DR:** The biggest “what’s next” for growth is **ship the one-click GitHub App** and **org credit pools + audit endpoint** so teams can adopt without friction and you can measure usage.

---

## 2. Improving animations and GIFs for PLG

Goal: make the site feel more alive, reduce perceived friction, and help visitors *see* the product before they install.

### A. Demo GIFs (current: `web/demos/*.gif`)

- **Quality and length**
  - Re-record at **2x density** (Retina) so they stay sharp on high-DPI screens; keep duration **&lt; 15–20s** so the “Full Workflow” doesn’t feel long.
  - **Optimize:** Use a tool like `gifsicle` or export from screen recorder with lower color count / smaller dimensions to keep file size **&lt; 2–3 MB** per GIF so the page stays fast.
- **Consistency**
  - Same terminal theme (e.g. same background, font size) across all six GIFs so switching thumbnails feels like one product.
  - Same “starting state” (e.g. same repo or folder name) so the story is coherent.
- **Optional: short video**
  - Add a **15–30s MP4/WebM** for the hero (e.g. “Full Workflow”) with `muted autoplay loop playsinline`. Many PLG sites use video in the hero and keep GIFs for the gallery; video often compresses better and looks smoother.

### B. Hero and above-the-fold

- **Install block**
  - Subtle **pulse or glow** on the copy button on hover (you already have `transition` on buttons).
  - After “Copy,” brief **checkmark + “Copied!”** (e.g. 1.5s) so the action is visible and satisfying.
- **Scroll cue**
  - Small **bounce or fade-in** on a “Scroll to see demo” or down-arrow below the hero so first-time visitors know there’s more below.

### C. Demo section (“See it in action”)

- **Entrance**
  - **Fade-in or slide-up** when the demo section enters the viewport (e.g. `intersection observer` + add a class that triggers `opacity`/`transform` animation). One animation per section is enough.
- **Main demo area**
  - When switching GIFs, **crossfade** (e.g. 200–300ms) instead of a hard swap so the change doesn’t feel jarring.
  - Optional: very subtle **border or shadow pulse** on the main demo container so it reads as “this is the live demo.”
- **Cards**
  - You already have hover `translateY(-2px)` and `.active` state. Add a **light scale (e.g. 1.02)** on hover and a **short transition on `.active`** (e.g. background 0.2s) so the selected card feels clearly chosen.

### D. Trust and comparison section

- **Staggered list**
  - Fade-in or slide-up the **trust bullets** and the **Dependabot vs Upshift** rows with a small delay between items (e.g. 50–80ms) so the section feels composed, not static.
- **Minimal motion**
  - No need for heavy animation here; subtle is enough.

### E. CTA and buttons

- **Primary CTAs** (“Get started free,” “Star on GitHub”)
  - Keep the existing hover lift; ensure **focus visible** (outline or ring) for accessibility.
  - Optional: very subtle **background gradient shift** or **border glow** on hover so the main actions feel responsive.
- **Copy button (install)**
  - As above: **“Copied!” state** with checkmark and reset after ~1.5s.

### F. Performance and perceived speed

- **Lazy-load demo GIFs**
  - Use `loading="lazy"` on the **thumbnail row** images if you ever show small previews, or load the **main demo `img`** only when the demo section is in view (swap `src` when in viewport) so the hero loads faster.
- **Preload the main hero demo**
  - If the hero uses the full-workflow GIF or video, `<link rel="preload" as="image" href="demos/6-full-workflow.gif">` (or equivalent for video) so it’s ready when the user scrolls.

### G. Optional: video in hero

- Replace or complement the hero GIF with a **short looped video** (e.g. 15–20s, muted, autoplay).
- Use **poster** frame that matches the first frame so LCP and layout are stable.
- Keeps the same “See it in action” gallery below; video can be the “hero proof” and GIFs the detailed steps.

---

## 3. Quick wins (do first)

1. **Copy button feedback** — “Copied!” + checkmark for the install command (and any other copy buttons).
2. **Demo switcher crossfade** — 200–300ms opacity/transition when changing the main demo image.
3. **Demo section entrance** — Single fade-in or slide-up when the section enters the viewport.
4. **GIF optimization** — Compress existing GIFs (smaller dimensions/colors) and, if needed, re-record at 2x for sharpness.

Then, if you want to go further: hero video option, lazy-load demo assets, and staggered trust/compare animations.

---

## 4. Summary

- **Roadmap:** Next big levers are **one-click GitHub App**, **audit endpoint**, and **org credit pools**; enterprise (SSO, on-prem, SLA) follows.
- **PLG site:** Improve **GIF quality and consistency**, add **lightweight motion** (entrance, crossfade, copy feedback, optional hero video), and keep **performance** in mind (lazy-load, preload hero asset). Small, consistent motion and clear “try it” CTAs will support conversion without feeling noisy.
