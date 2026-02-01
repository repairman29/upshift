# UpshiftAI site (landing + docs + dev + pricing)

Static site for [upshiftai.dev](https://upshiftai.dev). No build step.

**Pages:** index.html (landing), docs.html (CLI reference), dev.html (for developers), pricing.html (pricing & packaging).

**Deploy:** Upload this directory to any static host.

- **Vercel / Netlify:** Point project root to `upshiftai/` and set publish directory to `site`, or deploy from inside `site/`.
- **GitHub Pages:** Push `site/` contents to a `gh-pages` branch or use Actions to copy `site/` into the Pages root.
- **Any host:** Serve `index.html`, `docs.html`, `dev.html`, `pricing.html`, and `style.css` at the root.

**Before deploy:** Replace placeholder GitHub links in the pages with your repo URL if you have one.

**When releasing a new CLI version:** Update the version in the footer of all four pages (`index.html`, `docs.html`, `dev.html`, `pricing.html`): change `CLI v0.2.1` to the new version (e.g. `CLI v0.2.2`). Optionally keep `VERSION` at repo root in sync.
