/**
 * Progressive Inter font loading after page load (avoids blocking LCP).
 * Playfair Display is self-hosted via global.css — do not fetch it from Google Fonts.
 */
window.addEventListener('load', function () {
  if (
    document.querySelector('link[href*="fonts.googleapis.com"]') ||
    window.matchMedia('(prefers-reduced-data: reduce)').matches
  ) {
    return;
  }

  const preconnect1 = document.createElement('link');
  preconnect1.rel = 'preconnect';
  preconnect1.href = 'https://fonts.googleapis.com';
  document.head.appendChild(preconnect1);

  const preconnect2 = document.createElement('link');
  preconnect2.rel = 'preconnect';
  preconnect2.href = 'https://fonts.gstatic.com';
  preconnect2.crossOrigin = 'anonymous';
  document.head.appendChild(preconnect2);

  setTimeout(function () {
    const fontLink = document.createElement('link');
    fontLink.href =
      'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap';
    fontLink.rel = 'stylesheet';

    fontLink.addEventListener('load', function () {
      document.documentElement.style.setProperty(
        '--font-family',
        "'Inter', system-ui, -apple-system, 'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif"
      );
      document.body.style.fontFamily = 'var(--font-family)';
    });

    document.head.appendChild(fontLink);
  }, 100);
});
