/**
 * Theme Management Script
 * Handles theme switching with accessibility considerations
 */

// Theme management with accessibility considerations
const getThemePreference = () => {
  if (typeof localStorage !== 'undefined' && localStorage.getItem('theme')) {
    return localStorage.getItem('theme');
  }
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

const isDark = getThemePreference() === 'dark';
document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');

if (typeof localStorage !== 'undefined') {
  // Watch for changes in system theme preference
  const observer = new MutationObserver(() => {
    const isDarkMode = document.documentElement.getAttribute('data-theme') === 'dark';
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
  });
  
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-theme']
  });
  
  // Listen for system theme changes
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    if (!localStorage.getItem('theme')) {
      document.documentElement.setAttribute('data-theme', e.matches ? 'dark' : 'light');
    }
  });
}

// Announce theme changes to screen readers
const announceThemeChange = (theme) => {
  const announcement = document.createElement('div');
  announcement.setAttribute('aria-live', 'polite');
  announcement.setAttribute('aria-atomic', 'true');
  announcement.className = 'sr-only';
  announcement.textContent = `Theme changed to ${theme} mode`;
  document.body.appendChild(announcement);
  
  setTimeout(() => {
    document.body.removeChild(announcement);
  }, 1000);
};

// Export for use by theme toggle component
window.themeManager = {
  getThemePreference,
  announceThemeChange
};