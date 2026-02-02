# Design snapshots

Reference designs preserved so we can bring them forward. **Do not delete.**

## Indistractable (upshiftai/site)

- **Source:** `upshiftai/site/style.css` (commit when "Beautiful site redesign with original aesthetic" / "Indistractable" was added)
- **Palette:** Soft dark (`--bg-body: #0f1115`, `--bg-surface: #161b22`), blue accent (`--accent-primary: #3b82f6`), Inter font
- **Use:** Main site (`web/`) and Radar should use this design system for a calmer, more focused look

To reapply: copy design tokens (`:root` and typography) from `upshiftai/site/style.css` into `web/styles.css`, switch font to Inter, and use blue accent instead of green.
