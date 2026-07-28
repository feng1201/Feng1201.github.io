const menuButton = document.querySelector("[data-menu-button]");
const menu = document.querySelector("[data-menu]");
const year = document.querySelector("[data-year]");

function closeMenu() {
    if (!menuButton || !menu) return;
    menuButton.setAttribute("aria-expanded", "false");
    menu.classList.remove("open");
    document.body.classList.remove("menu-open");
}

if (menuButton && menu) {
    menuButton.addEventListener("click", () => {
        const opening = menuButton.getAttribute("aria-expanded") !== "true";
        menuButton.setAttribute("aria-expanded", String(opening));
        menu.classList.toggle("open", opening);
        document.body.classList.toggle("menu-open", opening);
    });

    menu.querySelectorAll("a").forEach((link) => {
        link.addEventListener("click", closeMenu);
    });

    window.addEventListener("resize", () => {
        if (window.innerWidth > 700) closeMenu();
    });
}

if (year) {
    year.textContent = String(new Date().getFullYear());
}
