# Blog media: GIFs, videos, examples

Reference for adding media to blog posts (e.g. JARVIS adds GIFs, videos, code examples). Use these classes so images, videos, and examples render consistently.

---

## Images and GIFs

**Single image or GIF (with optional caption):**
```html
<figure class="blog-figure">
  <img src="path/to/your-image.gif" alt="Describe what the GIF shows" width="720" height="400">
  <figcaption class="blog-figcaption">Optional caption. Use for screenshots, demos, or before/after.</figcaption>
</figure>
```

**Image without figure (full-width, rounded):**
```html
<div class="blog-media">
  <img src="path/to/your-image.png" alt="Description">
</div>
```

---

## Video

**Native HTML5 video (your own .mp4/.webm):**
```html
<div class="blog-video-wrap">
  <video controls width="720" poster="path/to/poster.jpg" muted>
    <source src="path/to/your-demo.mp4" type="video/mp4">
    Your browser does not support the video tag.
  </video>
  <p class="blog-video-caption">Optional caption.</p>
</div>
```

**YouTube or Vimeo embed (responsive 16:9):**
```html
<div class="blog-video-wrap embed">
  <iframe src="https://www.youtube.com/embed/VIDEO_ID" allowfullscreen></iframe>
</div>
<p class="blog-video-caption">Optional caption.</p>
```

---

## Code examples

**Code block:**
```html
<pre class="code"><code># Your command or code here
upshiftai-deps analyze . --markdown</code></pre>
```

**Callout / tip / example box (left accent bar):**
```html
<div class="blog-callout">
  <h4>Example: Dry-run first</h4>
  <p>Run with <code>--dry-run</code> to see what would change before applying.</p>
</div>
```

---

## CTA block (end of post)

```html
<div class="blog-cta">
  <h3>Try UpshiftAI</h3>
  <p>Analyze dependencies, get AI insights, and upgrade with guardrails.</p>
  <a href=".." class="btn btn-primary">Get Started</a>
</div>
```

---

All styles live in the main `../style.css`. The "When it breaks" post has example figure, video placeholder, callout, and code block—use it as a reference when adding media.
