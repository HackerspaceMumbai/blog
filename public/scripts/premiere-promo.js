(function () {
  // The script tag is emitted by every premiere component, so guard against double init.
  if (window.__hmPremierePromoInitialized) return;
  window.__hmPremierePromoInitialized = true;

  var roots = document.querySelectorAll('[data-premiere-promo]');
  if (!roots.length) return;

  function formatCountdown(remainingMs) {
    var safeMs = Math.max(0, remainingMs);
    var totalSeconds = Math.floor(safeMs / 1000);
    var days = Math.floor(totalSeconds / 86400);
    var hours = Math.floor((totalSeconds % 86400) / 3600);
    var minutes = Math.floor((totalSeconds % 3600) / 60);
    var seconds = totalSeconds % 60;

    function pad(value) {
      return String(value).padStart(2, '0');
    }

    return pad(days) + 'd : ' + pad(hours) + 'h : ' + pad(minutes) + 'm : ' + pad(seconds) + 's';
  }

  function isDismissed(key) {
    if (!key) return false;
    try {
      return window.localStorage.getItem(key) === 'dismissed';
    } catch (error) {
      return false;
    }
  }

  function rememberDismissal(key) {
    if (!key) return;
    try {
      window.localStorage.setItem(key, 'dismissed');
    } catch (error) {
      /* Storage unavailable (private mode / blocked cookies): dismiss for this page view only. */
    }
  }

  Array.prototype.forEach.call(roots, function (root) {
    var startMs = Number(root.dataset.startAt);
    var endMs = Number(root.dataset.endAt);
    if (!isFinite(startMs) || !isFinite(endMs) || endMs <= startMs) return;

    var dismissKey = root.dataset.dismissKey || '';
    var hideAfterEnd = root.dataset.hideAfterEnd === 'true';
    var statePanels = root.querySelectorAll('[data-premiere-state]');
    var labels = root.querySelectorAll('[data-premiere-label]');
    var countdownEl = root.querySelector('[data-premiere-countdown]');
    var countdownA11yEl = root.querySelector('[data-premiere-countdown-a11y]');
    var dismissButton = root.querySelector('[data-premiere-dismiss]');

    function removeRoot() {
      root.remove();
    }

    if (isDismissed(dismissKey)) {
      removeRoot();
      return;
    }

    if (dismissButton) {
      dismissButton.addEventListener('click', function (event) {
        event.preventDefault();
        event.stopPropagation();
        rememberDismissal(dismissKey);
        removeRoot();
      });
    }

    function resolveState(nowMs) {
      if (nowMs < startMs) return 'upcoming';
      if (nowMs < endMs) return 'live';
      return 'post';
    }

    function applyState(state) {
      Array.prototype.forEach.call(statePanels, function (panel) {
        var states = (panel.dataset.premiereState || '').split(/\s+/);
        var isVisible = states.indexOf(state) !== -1;
        panel.classList.toggle('hidden', !isVisible);
        panel.setAttribute('aria-hidden', isVisible ? 'false' : 'true');
      });

      Array.prototype.forEach.call(labels, function (label) {
        var text = label.dataset['label' + state.charAt(0).toUpperCase() + state.slice(1)];
        if (text) {
          label.textContent = text;
        }
      });
    }

    var intervalId = null;

    function tick() {
      var nowMs = Date.now();
      var state = resolveState(nowMs);

      if (state === 'post' && hideAfterEnd) {
        if (intervalId !== null) window.clearInterval(intervalId);
        removeRoot();
        return state;
      }

      applyState(state);

      if (state === 'post' && intervalId !== null) {
        window.clearInterval(intervalId);
        intervalId = null;
      }

      if (countdownEl && state === 'upcoming') {
        var formatted = formatCountdown(startMs - nowMs);
        countdownEl.textContent = formatted;
        if (countdownA11yEl) {
          countdownA11yEl.textContent = 'Premiere starts in ' + formatted.replace(/ : /g, ', ');
        }
      }

      return state;
    }

    if (tick() !== 'post') {
      intervalId = window.setInterval(tick, 1000);
    }
  });
})();
