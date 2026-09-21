(() => {
    const entries = [...document.querySelectorAll("[data-blog-post]")].map((root) => ({
        root,
        slug: root.dataset.blogPost,
        prefix: root.dataset.sectionPrefix || "",
        button: root.querySelector("[data-language-toggle]"),
        panels: [...root.querySelectorAll("[data-language]")],
        status: root.querySelector("[data-language-status]"),
        language: "zh"
    })).filter((entry) => entry.button);
    if (!entries.length) return;
    const multiple = entries.length > 1;
    const normalize = (value) => value === "en" ? "en" : "zh";

    function syncPageMetadata() {
        document.documentElement.lang = entries.every((entry) => entry.language === "en") ? "en" : "zh-CN";
        // A mixed-language feed keeps its Blog title; permalinks follow the article.
        if (multiple) return;
        const entry = entries[0];
        const heading = entry.root.querySelector('[data-post-heading][data-language="' + entry.language + '"]');
        if (!heading) return;
        document.title = heading.querySelector("h1").textContent + " · Ninghui Feng";
        const description = heading.querySelector(".post-deck").textContent;
        for (const [selector, value] of [
            ['meta[name="description"]', description],
            ['meta[property="og:title"]', document.title],
            ['meta[property="og:description"]', description]
        ]) {
            const metadata = document.querySelector(selector);
            if (metadata) metadata.content = value;
        }
    }

    function setLanguage(entry, next, updateHistory = false) {
        const language = normalize(next);
        entry.language = language;
        entry.root.setAttribute("lang", language === "en" ? "en" : "zh-CN");
        entry.panels.forEach((panel) => { panel.hidden = panel.dataset.language !== language; });
        entry.button.textContent = language === "en" ? "查看中文原文" : "Trans to English";
        entry.button.setAttribute("aria-label", language === "en" ? "查看中文原文" : "Translate this article to English");
        entry.button.setAttribute("aria-pressed", String(language === "en"));
        if (updateHistory) {
            const url = new URL(window.location.href);
            if (multiple) {
                const key = "lang-" + entry.slug;
                if (language === normalize(url.searchParams.get("lang"))) url.searchParams.delete(key);
                else url.searchParams.set(key, language);
            } else if (language === "en") url.searchParams.set("lang", "en");
            else url.searchParams.delete("lang");
            url.hash = url.hash.replace(new RegExp("^#" + entry.prefix + "(?:en|zh)-"), "#" + entry.prefix + language + "-");
            window.history.replaceState(null, "", url);
            if (entry.status) entry.status.textContent = language === "en" ? "English translation is now displayed." : "已切换为中文原文。";
        }
        syncPageMetadata();
    }

    function restoreLanguages() {
        const params = new URL(window.location.href).searchParams;
        entries.forEach((entry) => setLanguage(entry, multiple ? params.get("lang-" + entry.slug) ?? params.get("lang") : params.get("lang")));
    }

    // Each article switches independently using its pre-rendered translation.
    entries.forEach((entry) => {
        entry.button.hidden = false;
        entry.button.addEventListener("click", () => setLanguage(entry, entry.language === "zh" ? "en" : "zh", true));
    });
    restoreLanguages();
    window.addEventListener("popstate", restoreLanguages);
})();
