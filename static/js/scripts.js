const header = document.querySelector("[data-header]");
const menuButton = document.querySelector("[data-menu-button]");
const menu = document.querySelector("[data-menu]");
const menuLinks = menu ? [...menu.querySelectorAll('a[href^="#"]')] : [];
const sections = [...document.querySelectorAll("main section[id]")];
const year = document.querySelector("[data-year]");

function setHeaderState() {
    if (header) {
        header.classList.toggle("scrolled", window.scrollY > 12);
    }
}

function closeMenu() {
    if (!menu || !menuButton) return;
    menu.classList.remove("open");
    menuButton.setAttribute("aria-expanded", "false");
    document.body.classList.remove("menu-open");
}

if (menuButton && menu) {
    menuButton.addEventListener("click", () => {
        const willOpen = menuButton.getAttribute("aria-expanded") !== "true";
        menu.classList.toggle("open", willOpen);
        menuButton.setAttribute("aria-expanded", String(willOpen));
        document.body.classList.toggle("menu-open", willOpen);
    });

    menuLinks.forEach((link) => link.addEventListener("click", closeMenu));

    window.addEventListener("resize", () => {
        if (window.innerWidth > 760) closeMenu();
    });
}

if ("IntersectionObserver" in window && menuLinks.length && sections.length) {
    const sectionObserver = new IntersectionObserver(
        (entries) => {
            const visibleEntry = entries
                .filter((entry) => entry.isIntersecting)
                .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

            if (!visibleEntry) return;

            menuLinks.forEach((link) => {
                link.classList.toggle("active", link.getAttribute("href") === `#${visibleEntry.target.id}`);
            });
        },
        {
            rootMargin: "-20% 0px -65% 0px",
            threshold: [0.05, 0.25, 0.5],
        }
    );

    sections.forEach((section) => sectionObserver.observe(section));
}

if (year) {
    year.textContent = String(new Date().getFullYear());
}

setHeaderState();
window.addEventListener("scroll", setHeaderState, { passive: true });
