/**
 * Mobile Menu Handler
 * Handles mobile navigation menu functionality with accessibility
 */

document.addEventListener('DOMContentLoaded', function() {
  const mobileMenuButton = document.querySelector('[data-mobile-menu-button]');
  const mobileMenu = document.querySelector('[data-mobile-menu]');
  const menuOverlay = document.querySelector('[data-menu-overlay]');
  
  if (!mobileMenuButton || !mobileMenu) return;
  
  let isMenuOpen = false;
  
  // Toggle menu function
  const toggleMenu = () => {
    isMenuOpen = !isMenuOpen;
    
    // Update button attributes
    mobileMenuButton.setAttribute('aria-expanded', isMenuOpen.toString());
    mobileMenuButton.setAttribute('aria-label', isMenuOpen ? 'Close menu' : 'Open menu');
    
    // Update menu visibility
    mobileMenu.classList.toggle('hidden', !isMenuOpen);
    if (menuOverlay) {
      menuOverlay.classList.toggle('hidden', !isMenuOpen);
    }
    
    // Manage focus
    if (isMenuOpen) {
      // Focus first menu item
      const firstMenuItem = mobileMenu.querySelector('a, button');
      if (firstMenuItem) {
        firstMenuItem.focus();
      }
      
      // Prevent body scroll
      document.body.style.overflow = 'hidden';
    } else {
      // Return focus to menu button
      mobileMenuButton.focus();
      
      // Restore body scroll
      document.body.style.overflow = '';
    }
  };
  
  // Button click handler
  mobileMenuButton.addEventListener('click', toggleMenu);
  
  // Overlay click handler
  if (menuOverlay) {
    menuOverlay.addEventListener('click', () => {
      if (isMenuOpen) {
        toggleMenu();
      }
    });
  }
  
  // Keyboard navigation
  document.addEventListener('keydown', (e) => {
    if (!isMenuOpen) return;
    
    if (e.key === 'Escape') {
      toggleMenu();
    }
    
    // Tab trapping within menu
    if (e.key === 'Tab') {
      const focusableElements = mobileMenu.querySelectorAll(
        'a, button, input, textarea, select, [tabindex]:not([tabindex="-1"])'
      );
      
      if (focusableElements.length === 0) return;
      
      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];
      
      if (e.shiftKey && document.activeElement === firstElement) {
        e.preventDefault();
        lastElement.focus();
      } else if (!e.shiftKey && document.activeElement === lastElement) {
        e.preventDefault();
        firstElement.focus();
      }
    }
  });
  
  // Close menu on window resize (desktop view)
  window.addEventListener('resize', () => {
    if (window.innerWidth >= 768 && isMenuOpen) {
      toggleMenu();
    }
  });
  
  // Close menu when clicking on menu links
  const menuLinks = mobileMenu.querySelectorAll('a');
  menuLinks.forEach(link => {
    link.addEventListener('click', () => {
      if (isMenuOpen) {
        toggleMenu();
      }
    });
  });
});