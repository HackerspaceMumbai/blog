/**
 * Mobile menu functionality
 * Handles mobile navigation toggle and animations
 * (kept in sync with public/scripts/mobile-menu.js for src/ consumers)
 */
(function initMobileMenu() {
  function setup() {
    const menuButton = document.getElementById("mobile-menu-button");
    const mobileMenu = document.getElementById("mobile-menu");

    if (!menuButton || !mobileMenu) return;

    menuButton.addEventListener("click", function () {
      const isExpanded = menuButton.getAttribute("aria-expanded") === "true";
      const newState = !isExpanded;

      mobileMenu.classList.toggle("hidden");
      menuButton.setAttribute("aria-expanded", newState.toString());

      const spans = menuButton.querySelectorAll("span");
      if (isExpanded) {
        spans[0].style.transform = "none";
        spans[1].style.opacity = "1";
        spans[2].style.transform = "none";
      } else {
        spans[0].style.transform = "rotate(45deg) translate(5px, 5px)";
        spans[1].style.opacity = "0";
        spans[2].style.transform = "rotate(-45deg) translate(7px, -6px)";
      }
    });

    mobileMenu.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () {
        mobileMenu.classList.add("hidden");
        menuButton.setAttribute("aria-expanded", "false");

        const spans = menuButton.querySelectorAll("span");
        spans[0].style.transform = "none";
        spans[1].style.opacity = "1";
        spans[2].style.transform = "none";
      });
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", setup);
  } else {
    setup();
  }
})();
