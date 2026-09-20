import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
import { createHash } from "node:crypto";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(import.meta.url);
const { marked, Renderer } = require("../static/js/marked.min.js");
const origin = "https://feng1201.github.io";
const versionedAsset = (path) => `${path}?v=${createHash("sha256").update(readFileSync(resolve(root, `.${path}`))).digest("hex").slice(0, 12)}`;
export const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

function safeUrl(value) {
    const url = String(value || "").trim();
    if (/^(https?:\/\/|\/(?!\/)|#)/i.test(url) && !/[\u0000-\u0020]/.test(url)) return escapeHtml(url);
    throw new Error(`Unsupported content URL: ${url}`);
}

export function renderMarkdown(markdown, language, post) {
    const toc = [];
    const renderer = new Renderer();
    renderer.html = escapeHtml;
    renderer.heading = (text, level) => {
        const id = `${language}-section-${toc.length + 1}`;
        toc.push({ id, text });
        return `<h${level} id="${id}">${text}</h${level}>\n`;
    };
    renderer.link = (href, title, text) => `<a href="${safeUrl(href)}"${title ? ` title="${escapeHtml(title)}"` : ""}>${text}</a>`;
    renderer.image = (href, title, text) => {
        const caption = language === "zh" ? "DINO-WM 方法图 · 点击查看大图 · 图片来自" : "DINO-WM architecture · Open full-size image · Figure from";
        return `<figure><a href="${safeUrl(href)}" target="_blank" rel="noopener noreferrer"><img src="${safeUrl(href)}" alt="${escapeHtml(text)}" width="2232" height="723" loading="lazy" decoding="async"></a><figcaption>${caption} <a href="${safeUrl(post.paperUrl)}">DINO-WM</a>.</figcaption></figure>`;
    };
    // Render images as figures, not invalid <p><figure> nests.
    renderer.paragraph = (text) => text.startsWith("<figure>") && text.endsWith("</figure>") ? `${text}\n` : `<p>${text}</p>\n`;
    return { html: marked.parse(markdown, { renderer, mangle: false, headerIds: false }), toc };
}

export function loadPosts() {
    const posts = JSON.parse(readFileSync(resolve(root, "blog/posts.json"), "utf8"));
    const slugs = new Set();
    for (const post of posts) {
        if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(post.slug) || slugs.has(post.slug)) throw new Error("Invalid or repeated post slug");
        slugs.add(post.slug);
        if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/.test(post.publishedAt) || Number.isNaN(Date.parse(post.publishedAt))) throw new Error("Missing publication timestamp");
        const parts = new Intl.DateTimeFormat("en", { timeZone: "Asia/Shanghai", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date(post.publishedAt));
        const part = (type) => parts.find((p) => p.type === type).value;
        if (post.publishedDate !== `${part("year")}-${part("month")}-${part("day")}`) throw new Error("Publication date does not match the original upload in Asia/Shanghai");
        for (const lang of ["zh", "en"]) {
            if (!post.title[lang] || !post.summary[lang]) throw new Error(`Missing ${lang} metadata`);
            post[lang] = renderMarkdown(readFileSync(resolve(root, `blog/content/${post.slug}.${lang}.md`), "utf8"), lang, post);
        }
    }
    return posts.sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
}

function navigation() {
    const homepage = readFileSync(resolve(root, "index.html"), "utf8");
    const header = homepage.match(/    <header class="site-header">[\s\S]*?<\/header>/)?.[0];
    if (!header || !header.includes('href="/blog/"')) throw new Error("Homepage Blog navigation is missing");
    return header.replace(/href="#([^"]+)"/g, 'href="/#$1"').replace('href="/blog/"', 'href="/blog/" aria-current="page"');
}

function profile() {
    const homepage = readFileSync(resolve(root, "index.html"), "utf8");
    const sidebar = homepage.match(/        <aside class="profile" id="top">[\s\S]*?<\/aside>/)?.[0];
    if (!sidebar) throw new Error("Homepage profile sidebar is missing");
    return sidebar.replace('id="top"', 'id="top" lang="en"').replace(/src="static\//g, 'src="/static/');
}

function page({ title, description, path, body, article }) {
    const schema = article ? {
        "@context": "https://schema.org", "@type": "BlogPosting", headline: article.title.zh,
        datePublished: article.publishedAt, inLanguage: "zh-CN",
        author: { "@type": "Person", name: "Ninghui Feng", url: `${origin}/` },
        mainEntityOfPage: `${origin}${path}`
    } : null;
    return `<!doctype html>
<html lang="zh-CN">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="description" content="${escapeHtml(description)}">
    <meta name="author" content="Ninghui Feng">
    <meta name="theme-color" content="#ffffff">
    <title>${escapeHtml(title)} · Ninghui Feng</title>
    <link rel="canonical" href="${origin}${path}">
    <link rel="icon" type="image/x-icon" href="/static/assets/favicon.ico">
    <meta property="og:type" content="${article ? "article" : "website"}">
    <meta property="og:url" content="${origin}${path}">
    <meta property="og:title" content="${escapeHtml(title)} · Ninghui Feng">
    <meta property="og:description" content="${escapeHtml(description)}">
    <meta property="og:image" content="${origin}/static/assets/img/og-minimal.png">
    <meta name="twitter:card" content="summary_large_image">
    ${article ? `<meta property="article:published_time" content="${article.publishedAt}">` : ""}
    <link rel="stylesheet" href="${versionedAsset("/static/css/main.css")}">
    <link rel="stylesheet" href="${versionedAsset("/static/css/blog.css")}">
    <script src="/static/js/scripts.js" defer></script>
    ${article ? '<script src="/static/js/blog.js" defer></script>' : ""}
    ${schema ? `<script type="application/ld+json">${JSON.stringify(schema).replace(/</g, "\\u003c")}</script>` : ""}
</head>
<body>
    <a class="skip-link" href="#main">跳转到正文 / Skip to content</a>
${navigation()}
${body}
    <footer class="site-footer"><div>
        <p>© <span data-year>2026</span> Ninghui Feng.</p>
        <p><a href="/">Home</a><span>·</span><a href="/blog/">Blog</a><span>·</span><a href="mailto:feng65501@gmail.com">Email</a></p>
    </div></footer>
</body>
</html>
`;
}

function displayDate(post, language) {
    return new Intl.DateTimeFormat(language === "zh" ? "zh-CN" : "en-US", { timeZone: "Asia/Shanghai", year: "numeric", month: "long", day: "numeric" }).format(new Date(post.publishedAt));
}

function dateTag(post, language) {
    return `<time datetime="${post.publishedAt}" title="First uploaded: ${post.publishedAt}">${displayDate(post, language)}</time>`;
}

export function buildPages() {
    const posts = loadPosts();
    const files = new Map();
    if (!posts.length) throw new Error("The Blog entry page requires a published post");

    for (const post of posts) {
        const headings = ["zh", "en"].map((lang) => `<header class="post-heading" data-post-heading data-language="${lang}" lang="${lang === "zh" ? "zh-CN" : "en"}"${lang === "en" ? " hidden" : ""}>
                <h1>${escapeHtml(post.title[lang])}</h1>
                <div class="post-meta"><span>${lang === "zh" ? "上传于" : "Published"} ${dateTag(post, lang)}</span><span class="tag">${lang === "zh" ? "中文原文" : "English translation"}</span></div>
                <p class="post-deck">${escapeHtml(post.summary[lang])}</p>
            </header>`).join("\n");
        const contents = ["zh", "en"].map((lang) => `<div class="post-prose" id="post-${lang}" data-language="${lang}" lang="${lang === "zh" ? "zh-CN" : "en"}"${lang === "en" ? " hidden" : ""}>${post[lang].html}</div>`).join("\n");
        const renderPost = (path) => page({ title: post.title.zh, description: post.summary.zh, path, article: post, body: `
    <main class="page-layout blog-page" id="main">
${profile()}
        <article class="content blog-main">
            <div class="reader-toolbar">
                <span class="reader-label">Blog</span>
                <div class="language-control"><button class="language-button" type="button" data-language-toggle aria-controls="post-zh post-en" aria-pressed="false" hidden>Trans to English</button><small class="translation-credit">translate by GPT</small></div>
            </div>
            <span class="screen-reader-only" role="status" aria-live="polite" data-language-status></span>
            ${headings}
            <noscript><p class="note">当前显示中文原文。启用 JavaScript 可切换英文，或直接阅读 <a href="/blog/content/${post.slug}.en.md">English translation</a>。</p></noscript>
            ${contents}
            <footer class="post-end"><a href="/">← Home</a><a href="#main">回到顶部 / Back to top ↑</a></footer>
        </article>
    </main>` });
        files.set(`blog/${post.slug}/index.html`, renderPost(`/blog/${post.slug}/`));
        // The navigation entry is a complete reader, never a teaser or redirect.
        if (post === posts[0]) files.set("blog/index.html", renderPost("/blog/"));
    }
    return files;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
    for (const [path, html] of buildPages()) {
        const file = resolve(root, path);
        if (process.argv.includes("--check")) {
            if (readFileSync(file, "utf8") !== html) throw new Error(`Rebuild required: ${path}`);
        } else {
            mkdirSync(dirname(file), { recursive: true });
            writeFileSync(file, html);
        }
        console.log(`${process.argv.includes("--check") ? "Verified" : "Built"} ${path}`);
    }
}
