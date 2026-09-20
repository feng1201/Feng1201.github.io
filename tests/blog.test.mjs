import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";
import { buildPages, loadPosts, renderMarkdown } from "../scripts/build-blog.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const pages = buildPages();
const read = (path) => readFileSync(resolve(root, path), "utf8");

test("Blog is a separate route immediately after Snapshots, not a home section", () => {
    const home = read("index.html");
    assert.match(home, /<a href="#snapshots">Snapshots of Life<\/a>\s*<a href="\/blog\/">Blog<\/a>/);
    assert.doesNotMatch(home, /id="blog"|DINO-WM|data-language-toggle/);
    for (const html of pages.values()) {
        assert.match(html, /href="\/#snapshots"/);
        assert.match(html, /href="\/blog\/" aria-current="page"/);
        assert.doesNotMatch(html, /class="profile"|id="publications"|id="snapshots"/);
    }
});

test("Every generated page is current and all local links and fragments resolve", () => {
    for (const [path, html] of pages) {
        assert.equal(read(path), html, `${path} must be rebuilt`);
        const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]);
        assert.equal(new Set(ids).size, ids.length, `${path} has duplicate IDs`);
        for (const [, raw] of html.matchAll(/\b(?:href|src)="([^"]+)"/g)) {
            if (!raw.startsWith("/") && !raw.startsWith("#")) continue;
            const url = new URL(raw, `https://feng1201.github.io/${path}`);
            const target = url.pathname.endsWith("/") ? `${url.pathname}index.html` : url.pathname;
            assert.ok(existsSync(resolve(root, `.${target}`)), `Missing ${target}`);
            if (url.hash && target.endsWith(".html")) {
                assert.ok(read(`.${target}`).includes(`id="${url.hash.slice(1)}"`), `Missing anchor ${raw}`);
            }
        }
    }
});

test("Archive is a single-column article list without introductory or decorative copy", () => {
    const html = pages.get("blog/index.html");
    assert.match(html, /<main class="blog-archive" id="main">/);
    assert.match(html, /<h1>Blog<\/h1>/);
    assert.doesNotMatch(html, /<aside|<h2>Ninghui Feng<\/h2>|sidebar-description|archive-label|archive-note/);
    for (const phrase of ["读论文，记下思考", "还没完全想明白", "Written in Chinese", "English translations available", "论文、想法", "Notes on papers, ideas", "A personal notebook", "Reading &amp; thinking", "慢慢读", "More notes along the way"]) {
        assert.ok(!html.includes(phrase), `Removed text must not return: ${phrase}`);
    }
    assert.equal((html.match(/class="post-card"/g) || []).length, loadPosts().length);
    assert.match(html, /2026年9月20日/);
    assert.match(html, /World models · Paper notes/);
    assert.match(html, /href="\/blog\/dino-wm\/"/);
});

test("Upload dates are real, stable, and explicitly rendered in both languages", () => {
    const [post] = loadPosts();
    assert.equal(post.publishedAt, "2026-09-20T15:49:16Z");
    assert.equal(post.publishedDate, "2026-09-20");
    assert.equal(post.sourceCommit, "dcfb4f689adb4c3e90a19ac3ac0a00c03d29d32f");
    const html = pages.get("blog/dino-wm/index.html");
    assert.match(html, /2026年9月20日/);
    assert.match(html, /September 20, 2026/);
    assert.match(html, /"datePublished":"2026-09-20T15:49:16Z"/);
});

test("Full translations and the original local figure work without external services", () => {
    const html = pages.get("blog/dino-wm/index.html");
    assert.match(html, /translate by GPT/);
    assert.match(html, /id="post-zh" data-language="zh" lang="zh-CN">/);
    assert.match(html, /id="post-en" data-language="en" lang="en" hidden>/);
    assert.match(html, /distribution&#39;s|distribution's/);
    assert.match(html, /iteration limit is reached/);
    assert.match(html, /直到满足条件或者达到迭代次数的阈值/);
    assert.equal((html.match(/<figure>/g) || []).length, 2);
    assert.doesNotMatch(html, /<p><figure>|user-attachments|api\.openai|private-user|github_pat_|ghp_/);
    assert.match(html, /<noscript>/);
    assert.doesNotMatch(read("static/js/blog.js"), /\bfetch\s*\(|localStorage/);
    assert.equal(readFileSync(resolve(root, "static/assets/blog/dino-wm-architecture.png")).subarray(0, 8).toString("hex"), "89504e470d0a1a0a");
});

test("Markdown is escaped and unsafe links are rejected", () => {
    const [post] = loadPosts();
    const safe = renderMarkdown('<script>alert(1)</script>', "zh", post).html;
    assert.doesNotMatch(safe, /<script>/);
    assert.match(safe, /&lt;script&gt;/);
    assert.throws(() => renderMarkdown('[bad](javascript:alert%281%29)', "zh", post), /Unsupported content URL/);
});

function client(url) {
    const callbacks = {};
    const button = { hidden: true, textContent: "", attrs: {}, setAttribute(k, v) { this.attrs[k] = v; }, addEventListener(k, fn) { callbacks[k] = fn; } };
    const panels = ["zh", "en"].flatMap((language) => Array.from({ length: 3 }, () => ({ dataset: { language }, hidden: language === "en" })));
    const titles = { zh: "中文标题", en: "English title" };
    const descriptions = { zh: "中文摘要", en: "English summary" };
    const status = { textContent: "" };
    const metadata = { content: "" };
    const document = {
        documentElement: { lang: "zh-CN" },
        title: "",
        querySelector(selector) {
            if (selector === "[data-language-toggle]") return button;
            if (selector === "[data-language-status]") return status;
            if (selector.startsWith("meta[")) return metadata;
            if (selector.startsWith("[data-post-heading]")) {
                const lang = selector.includes('"en"') ? "en" : "zh";
                return { querySelector: (s) => ({ textContent: s === "h1" ? titles[lang] : descriptions[lang] }) };
            }
            return null;
        },
        querySelectorAll: () => panels
    };
    const window = { location: { href: url }, history: { replaceState(_state, _title, next) { window.location.href = String(next); } }, addEventListener(k, fn) { callbacks[k] = fn; } };
    vm.runInNewContext(read("static/js/blog.js"), { document, window, URL });
    return { button, panels, document, window, callbacks, status };
}

test("Toggle switches all panels, title, accessibility state, and URL; then restores Chinese", () => {
    const app = client("https://feng1201.github.io/blog/dino-wm/#zh-section-3");
    assert.equal(app.button.hidden, false);
    assert.equal(app.document.documentElement.lang, "zh-CN");
    app.callbacks.click();
    assert.equal(app.document.documentElement.lang, "en");
    assert.equal(app.button.attrs["aria-pressed"], "true");
    assert.equal(app.button.textContent, "查看中文原文");
    assert.equal(app.document.title, "English title · Ninghui Feng");
    assert.equal(app.window.location.href, "https://feng1201.github.io/blog/dino-wm/?lang=en#en-section-3");
    assert.ok(app.panels.every((panel) => panel.hidden === (panel.dataset.language === "zh")));
    assert.match(app.status.textContent, /English/);
    app.callbacks.click();
    assert.equal(app.button.attrs["aria-pressed"], "false");
    assert.equal(app.button.textContent, "Trans to English");
    assert.equal(app.document.documentElement.lang, "zh-CN");
    assert.equal(app.window.location.href, "https://feng1201.github.io/blog/dino-wm/#zh-section-3");
    assert.ok(app.panels.every((panel) => panel.hidden === (panel.dataset.language === "en")));
});

test("English deep links survive refresh and unsupported languages fall back to Chinese", () => {
    const english = client("https://feng1201.github.io/blog/dino-wm/?lang=en");
    assert.equal(english.document.documentElement.lang, "en");
    english.window.location.href = "https://feng1201.github.io/blog/dino-wm/";
    english.callbacks.popstate();
    assert.equal(english.document.documentElement.lang, "zh-CN");
    assert.equal(client("https://feng1201.github.io/blog/dino-wm/?lang=invalid").document.documentElement.lang, "zh-CN");
});
