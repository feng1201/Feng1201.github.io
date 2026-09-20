# Ninghui Feng — Personal Homepage

This repository hosts the English academic and engineering portfolio at [feng1201.github.io](https://feng1201.github.io/).

## Structure

- `index.html` — page content, metadata, and section structure
- `static/css/main.css` — visual system and responsive layout
- `static/js/scripts.js` — mobile navigation and active-section behavior
- `static/assets/img/og.png` — social sharing preview
- `blog/` — independent bilingual reading notes; see [Blog maintenance](blog/README.md)
- `scripts/build-blog.mjs` — optional, dependency-free generator for the static blog pages

The site is intentionally dependency-free and works directly on GitHub Pages.

To rebuild or check the Blog pages, use `node scripts/build-blog.mjs` and `node --test tests/blog.test.mjs`. The generator reuses the existing vendored Markdown parser; no package installation is needed.

## Preview locally

From the repository root:

```bash
python3 -m http.server 8000
```

Then open `http://localhost:8000`.

## Publishing

Changes pushed to the repository's `main` branch are published through GitHub Pages.
