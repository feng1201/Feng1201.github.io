# Blog maintenance

This is a separate GitHub Pages section at `/blog/`, not a section appended to the homepage. The homepage's only content change is its Blog navigation link. The site remains a plain static site with no new runtime dependency.

## Current post

- `/blog/dino-wm/` opens the original Chinese note.
- `/blog/dino-wm/?lang=en` opens its full GPT-generated English translation.
- Both languages are pre-rendered. The button switches locally; no API key, visitor data, translation request, or GitHub authentication is needed.
- `translate by GPT` identifies the translation in small text beside the button.
- Without JavaScript, the Chinese article remains readable and a link to the English Markdown is provided.

The Chinese text comes from the explicitly selected `DINO_WM.md` at revision `6d373495e912c47a489b0fc633d13a2dcd937a23`. Only headings, list formatting, a disclaimer blockquote and a local image URL were added. The note is not silently fact-corrected. The article's original figure is saved in `static/assets/blog/` so visitors do not depend on a private GitHub attachment.

## Dates

`publishedAt` records the first upload: `2026-09-20T15:49:16Z`, from commit `dcfb4f689adb4c3e90a19ac3ac0a00c03d29d32f`. Display dates use **Asia/Shanghai**, so the date stays September 20, 2026 regardless of when or where a visitor opens the page. Rebuilding or editing a translation must not reset it. `sourceRevision` records the imported content version, not the publication date.

## Add or update a note

1. Add Chinese and GPT-translated English Markdown in `blog/content/<slug>.zh.md` and `<slug>.en.md`. Add section headings for the table of contents.
2. Add the post's metadata to `blog/posts.json`, including its real first-upload timestamp. Do not import an entire private notebook automatically: include only posts intended for publication.
3. Store approved figures locally in `static/assets/blog/` and use site-root-relative URLs in Markdown. Preserve figure attribution.
4. Run `node scripts/build-blog.mjs`, followed by `node --test tests/blog.test.mjs` and `node scripts/build-blog.mjs --check`.
5. Review and commit the Markdown, metadata, assets, and generated HTML. Push to the existing GitHub Pages `main` branch to publish.

The English translation is a maintained snapshot, not a live AI service. When changing the Chinese note, update its English counterpart and rebuild. Future posts are not imported automatically from the private blog repository.
