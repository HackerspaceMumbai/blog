/**
 * Deferred analytics loader (GA + Clarity).
 * Config via data-ga-id / data-clarity-id on this script element.
 */
(function () {
  // defer/async scripts have null document.currentScript — read the tag instead
  const current =
    document.currentScript ||
    document.querySelector('script[src*="/scripts/tracking.js"]');
  const googleAnalyticsId = current && current.getAttribute('data-ga-id');
  const clarityId = current && current.getAttribute('data-clarity-id');

  // Quieter console when trackers are blocked by privacy tools
  const originalError = console.error;
  console.error = function (...args) {
    const message = args.join(' ').toLowerCase();
    if (
      message.includes('clarity.ms') ||
      message.includes('google-analytics.com') ||
      message.includes('googletagmanager.com') ||
      message.includes('net::err_blocked_by_client')
    ) {
      console.debug('Tracking blocked by privacy settings:', ...args);
      return;
    }
    originalError.apply(console, args);
  };

  window.addEventListener(
    'error',
    function (event) {
      if (event.target && event.target.tagName === 'SCRIPT' && event.target.src) {
        const src = event.target.src;
        if (
          src.includes('clarity.ms') ||
          src.includes('google-analytics.com') ||
          src.includes('googletagmanager.com')
        ) {
          event.preventDefault();
          console.debug('Tracking script blocked:', src);
        }
      }
    },
    true
  );

  window.addEventListener('load', function () {
    setTimeout(function () {
      if (googleAnalyticsId) {
        const gaScript = document.createElement('script');
        gaScript.async = true;
        gaScript.src =
          'https://www.googletagmanager.com/gtag/js?id=' + googleAnalyticsId;
        document.head.appendChild(gaScript);

        window.dataLayer = window.dataLayer || [];
        function gtag() {
          try {
            window.dataLayer.push(arguments);
          } catch (e) {
            /* ignore */
          }
        }
        gtag('js', new Date());
        gtag('config', googleAnalyticsId, {
          anonymize_ip: true,
          allow_google_signals: false,
          allow_ad_personalization_signals: false,
          send_page_view: true,
        });
        window.gtag = gtag;

        gtag('consent', 'default', {
          analytics_storage: 'granted',
          ad_storage: 'denied',
          ad_user_data: 'denied',
          ad_personalization: 'denied',
        });
      }

      if (clarityId) {
        if (!navigator.doNotTrack && !window.navigator.globalPrivacyControl) {
          (function (c, l, a, r, i, t, y) {
            c[a] =
              c[a] ||
              function () {
                (c[a].q = c[a].q || []).push(arguments);
              };
            t = l.createElement(r);
            t.async = 1;
            t.src = 'https://www.clarity.ms/tag/' + i;
            t.onerror = function () {
              console.debug('Clarity blocked by privacy settings');
            };
            y = l.getElementsByTagName(r)[0];
            y.parentNode.insertBefore(t, y);
          })(window, document, 'clarity', 'script', clarityId);
        }
      }

      console.log(
        '🔒 Privacy Notice: This site uses analytics to improve user experience. Data is anonymized and not used for advertising.'
      );
    }, 100);
  });
})();
