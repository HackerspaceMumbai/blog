(function () {
    const heroRoot = document.querySelector('[data-premiere-hero]');
    if (!(heroRoot instanceof HTMLElement)) return;
    if (heroRoot.dataset.hasPremiere !== 'true') return;

    const startMs = Number(heroRoot.dataset.startAt);
    const endMs = Number(heroRoot.dataset.endAt);
    if (!Number.isFinite(startMs) || !Number.isFinite(endMs) || endMs <= startMs) return;

    const statePanels = heroRoot.querySelectorAll('[data-hero-state]');
    const countdownEl = heroRoot.querySelector('[data-countdown-target]');
    const countdownA11yEl = heroRoot.querySelector('[data-countdown-accessibility]');

    const resolveState = (nowMs) => {
      if (nowMs < startMs) return 'upcoming';
      if (nowMs < endMs) return 'live';
      return 'post';
    };

    const formatCountdown = (remainingMs) => {
      const safeRemainingMs = Math.max(0, remainingMs);
      const totalSeconds = Math.floor(safeRemainingMs / 1000);
      const days = Math.floor(totalSeconds / 86400);
      const hours = Math.floor((totalSeconds % 86400) / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const seconds = totalSeconds % 60;

      return `${String(days).padStart(2, '0')}d : ${String(hours).padStart(2, '0')}h : ${String(minutes).padStart(2, '0')}m : ${String(seconds).padStart(2, '0')}s`;
    };

    const applyState = (state) => {
      statePanels.forEach((panel) => {
        const isCurrentState = panel.dataset.heroState === state;
        panel.classList.toggle('hidden', !isCurrentState);
        panel.setAttribute('aria-hidden', isCurrentState ? 'false' : 'true');
      });
    };

    let countdownIntervalId = null;

    const tick = () => {
      const nowMs = Date.now();
      const state = resolveState(nowMs);
      applyState(state);

      if (state === 'post' && countdownIntervalId !== null) {
        window.clearInterval(countdownIntervalId);
        countdownIntervalId = null;
      }

      if (countdownEl && state === 'upcoming') {
        const remainingMs = startMs - nowMs;
        const formattedCountdown = formatCountdown(remainingMs);
        countdownEl.textContent = formattedCountdown;
        if (countdownA11yEl) {
          countdownA11yEl.textContent = `Premiere starts in ${formattedCountdown.replace(/ : /g, ', ')}`;
        }
      }
      return state;
    };

    const initialState = tick();
    if (initialState !== 'post') {
      countdownIntervalId = window.setInterval(tick, 1000);
    }
  })();
