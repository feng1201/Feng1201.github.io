(() => {
    const button = document.querySelector("[data-language-toggle]");
    if (!button) return;

    const panels = [...document.querySelectorAll("[data-language]")];
    const status = document.querySelector("[data-language-status]");
    const metadata = document.querySelector('meta[name="description"]');
    const metadataTitle = document.querySelector('meta[property="og:title"]');
    const metadataDescription = document.querySelector('meta[property="og:description"]');
    let language = "zh";

    function setLanguage(next, updateHistory = false) {
        language = next === "en" ? "en" : "zh";
        panels.forEach((panel) => { panel.hidden = panel.dataset.language !== language; });
        document.documentElement.lang = language === "en" ? "en" : "zh-CN";
        button.textContent = language === "en" ? "查看中文原文" : "Trans to English";
        button.setAttribute("aria-label", language === "en" ? "查看中文原文" : "Translate this article to English");
        button.setAttribute("aria-pressed", String(language === "en"));
        const heading = document.querySelector(`[data-post-heading][data-language="${language}"]`);
        if (heading) {
            document.title = `${heading.querySelector("h1").textContent} · Ninghui Feng`;
            const description = heading.querySelector(".post-deck").textContent;
            if (metadata) metadata.content = description;
            if (metadataTitle) metadataTitle.content = document.title;
            if (metadataDescription) metadataDescription.content = description;
        }
        if (updateHistory) {
            const url = new URL(window.location.href);
            if (language === "en") url.searchParams.set("lang", "en");
            else url.searchParams.delete("lang");
            url.hash = url.hash.replace(/^(#)(?:en|zh)-/, `$1${language}-`);
            window.history.replaceState(null, "", url);
            if (status) status.textContent = language === "en" ? "English translation is now displayed." : "已切换为中文原文。";
        }
    }

    // Readable Chinese is already in the HTML. No network call, API key, or
    // third-party translation service is needed to switch languages.
    button.hidden = false;
    setLanguage(new URL(window.location.href).searchParams.get("lang"));
    button.addEventListener("click", () => setLanguage(language === "zh" ? "en" : "zh", true));
    window.addEventListener("popstate", () => setLanguage(new URL(window.location.href).searchParams.get("lang")));
})();
