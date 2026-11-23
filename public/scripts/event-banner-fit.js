// Sizes the featured-event photo column so the photo is exactly as tall as the banner copy.
// Without this script, CSS still keeps the photo within the copy height (object-fit: contain).
(() => {
  const wide = window.matchMedia('(min-width: 1100px)');
  const MAX_MEDIA_SHARE = 0.6;

  document.querySelectorAll('.event-banner-with-photo').forEach((banner) => {
    const copy = banner.querySelector('.event-banner-copy');
    const photo = banner.querySelector('.event-banner-photo');
    if (!copy || !photo) return;

    const ratio = Number(photo.getAttribute('width')) / Number(photo.getAttribute('height')) || 1;

    const fit = () => {
      if (!wide.matches) {
        delete banner.dataset.mediaFit;
        banner.style.removeProperty('--event-banner-media-size');
        return;
      }
      const height = copy.getBoundingClientRect().height;
      const size = Math.min(Math.round(height * ratio), Math.floor(banner.clientWidth * MAX_MEDIA_SHARE));
      banner.style.setProperty('--event-banner-media-size', `${size}px`);
      banner.dataset.mediaFit = '';
    };

    // Narrowing the photo column widens the copy, which can change its height; the observer
    // re-runs until the column width and copy height agree.
    const observer = new ResizeObserver(fit);
    observer.observe(copy);
    observer.observe(banner);
    wide.addEventListener('change', fit);
    fit();
  });
})();
