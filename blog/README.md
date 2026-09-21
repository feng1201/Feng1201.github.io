# Blog maintenance

This is a separate GitHub Pages section at `/blog/`, not a section appended to the homepage. The homepage's only content change is its Blog navigation link. The site remains a plain static site with no new runtime dependency.

## Current posts

- `/blog/` opens all published notes in full in the right-hand content column: **DINO-WM first, Newt immediately below it**. There is no article-list screen, extra click, or JavaScript redirect. The order follows `blog/posts.json`, not newest-first sorting.
- The header, left profile, portrait, caption, and contact links are reused from the homepage. The same `page-layout` and `profile` styles preserve their placement and sticky behavior; only the right-hand content changes. Mobile follows the homepage's responsive layout, with additional reading gutters for the article.
- `/blog/#newt` jumps directly to the second note within the same page.
- Each article has its own language button. `/blog/?lang=en` opens both English translations; `?lang-newt=en#newt` translates only Newt, while the first note remains in Chinese.
- `/blog/dino-wm/` and `/blog/newt/` are permanent links, each supporting `?lang=en`.
- Both languages are pre-rendered. The button switches locally; no API key, visitor data, translation request, or GitHub authentication is needed.
- `translate by GPT` identifies the translation in small text beside the button.
- Without JavaScript, the Chinese article remains readable and a link to the English Markdown is provided.

The Chinese texts come from the explicitly selected `DINO_WM.md` at revision `6d373495e912c47a489b0fc633d13a2dcd937a23` and `Newt.md` at revision `6bcc4b4a8f35c0ef9ab249d649aff229f8678aaa`. Only headings, list formatting, a disclaimer blockquote and local image URLs were added. The notes are not silently fact-corrected. Both original figures are saved in `static/assets/blog/` so visitors do not depend on private GitHub attachments.

## Dates

`publishedAt` records the first upload: `2026-09-20T15:49:16Z`, from commit `dcfb4f689adb4c3e90a19ac3ac0a00c03d29d32f`. Display dates use **Asia/Shanghai**, so the date stays September 20, 2026 regardless of when or where a visitor opens the page. Rebuilding or editing a translation must not reset it. `sourceRevision` records the imported content version, not the publication date.

Newt's first upload is `2026-09-21T16:07:29Z`, from commit `e0e9a2955430f75cc4b676dab612c1e3cff3fdb6`: **September 22, 2026 in Asia/Shanghai**, not September 21.

## Add or update a note

1. Add Chinese and GPT-translated English Markdown in `blog/content/<slug>.zh.md` and `<slug>.en.md`. Add section headings for readable structure and stable anchors.
2. Append the post's metadata to `blog/posts.json`, including its real first-upload timestamp, short label, and figure dimensions. Do not import an entire private notebook automatically: include only posts intended for publication.
3. Store approved figures locally in `static/assets/blog/` and use site-root-relative URLs in Markdown. Preserve figure attribution.
4. Run `node scripts/build-blog.mjs`, followed by `node --test tests/blog.test.mjs` and `node scripts/build-blog.mjs --check`.
5. Review and commit the Markdown, metadata, assets, and generated HTML. Push to the existing GitHub Pages `main` branch to publish.

The English translation is a maintained snapshot, not a live AI service. When changing the Chinese note, update its English counterpart and rebuild. Future posts are not imported automatically from the private blog repository.
