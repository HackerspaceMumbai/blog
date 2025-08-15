/**
 * Mobile menu functionality
 * Handles mobile navigation toggle and animations
 */
document.addEventListener("DOMContentLoaded", function() {
  const menuButton = document.getElementById("mobile-menu-button");
  const mobileMenu = document.getElementById("mobile-menu");
  
  if (!menuButton || !mobileMenu) return;
  
  // Toggle mobile menu
  menuButton.addEventListener("click", function() {
    const isExpanded = menuButton.getAttribute("aria-expanded") === "true";
    const newState = !isExpanded;
    
    // Toggle menu visibility
    mobileMenu.classList.toggle("hidden");
    menuButton.setAttribute("aria-expanded", newState.toString());
    
    // Animate hamburger icon
    const spans = menuButton.querySelectorAll("span");
    if (isExpanded) {
      // Reset to hamburger
      spans[0].style.transform = "none";
      spans[1].style.opacity = "1";
      spans[2].style.transform = "none";
    } else {
      // Transform to X
      spans[0].style.transform = "rotate(45deg) translate(5px, 5px)";
      spans[1].style.opacity = "0";
      spans[2].style.transform = "rotate(-45deg) translate(7px, -6px)";
    }
  });
  
  // Close menu when clicking on navigation links
  mobileMenu.querySelectorAll("a").forEach(link => {
    link.addEventListener("click", function() {
      mobileMenu.classList.add("hidden");
      menuButton.setAttribute("aria-expanded", "false");
      
      // Reset hamburger icon
      const spans = menuButton.querySelectorAll("span");
      spans[0].style.transform = "none";
      spans[1].style.opacity = "1";
      spans[2].style.transform = "none";
    });
  });
});