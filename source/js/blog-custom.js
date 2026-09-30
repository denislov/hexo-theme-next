/* global CONFIG */

/**
 * Blog custom behaviour (this fork):
 *  - manual light/dark theme toggle (button rendered in header/brand.njk)
 *  - floating table-of-contents drawer (markup in _partials/toc-drawer.njk)
 *
 * All handlers are delegated / guarded so they survive PJAX navigations.
 */
(function() {
  function storedTheme() {
    try {
      const value = localStorage.getItem('theme');
      return value === 'light' || value === 'dark' ? value : null;
    } catch (e) {
      return null;
    }
  }

  function currentTheme() {
    const theme = document.documentElement.dataset.theme;
    if (theme === 'light' || theme === 'dark') return theme;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  function applyTheme(theme) {
    const root = document.documentElement;
    root.dataset.theme = theme;
    root.style.colorScheme = theme;
    const darkLink = document.getElementById('highlight-dark');
    if (darkLink) darkLink.disabled = theme !== 'dark';
    document.querySelectorAll('.theme-toggle i').forEach(icon => {
      icon.className = theme === 'dark' ? 'fa fa-sun' : 'fa fa-moon';
    });
  }

  function registerToggle() {
    const button = document.querySelector('.site-nav-right .theme-toggle');
    if (!button || button.dataset.bound) return;
    button.dataset.bound = '1';
    button.addEventListener('click', () => {
      const next = currentTheme() === 'dark' ? 'light' : 'dark';
      applyTheme(next);
      try {
        localStorage.setItem('theme', next);
      } catch (e) {
        // ignore (private mode / storage disabled)
      }
    });
  }

  function openDrawer() {
    const drawer = document.querySelector('.toc-drawer');
    if (!drawer) return;
    // Reserve the scrollbar width before locking the body, like the search UI.
    if (window.NexT && NexT.utils && typeof NexT.utils.setGutter === 'function') {
      NexT.utils.setGutter();
    }
    drawer.classList.add('toc-open');
    drawer.setAttribute('aria-hidden', 'false');
    drawer.removeAttribute('inert');
    const dimmer = document.querySelector('.toc-dimmer');
    if (dimmer) dimmer.classList.add('toc-open');
    document.body.classList.add('toc-open');
    document.querySelectorAll('.toc-fab').forEach(el => el.setAttribute('aria-expanded', 'true'));
    const close = drawer.querySelector('.toc-drawer-close');
    if (close) close.focus();
  }

  function closeDrawer(options) {
    const restoreFocus = Boolean(options && options.restoreFocus);
    const open = document.querySelector('.toc-drawer.toc-open');
    const hadFocus = Boolean(open && open.contains(document.activeElement));
    document.querySelectorAll('.toc-drawer.toc-open').forEach(el => {
      el.classList.remove('toc-open');
      el.setAttribute('aria-hidden', 'true');
      el.setAttribute('inert', '');
    });
    document.querySelectorAll('.toc-dimmer.toc-open').forEach(el => {
      el.classList.remove('toc-open');
    });
    document.querySelectorAll('.toc-fab').forEach(el => el.setAttribute('aria-expanded', 'false'));
    document.body.classList.remove('toc-open');
    if (restoreFocus && hadFocus) {
      const fab = document.querySelector('.toc-fab');
      if (fab) fab.focus();
    }
  }

  document.addEventListener('click', event => {
    const target = event.target;
    if (!target || !target.closest) return;
    if (target.closest('.toc-fab')) {
      openDrawer();
    } else if (target.closest('.toc-drawer-close') || target.closest('.toc-dimmer')) {
      closeDrawer({ restoreFocus: true });
    } else if (target.closest('.toc-drawer a')) {
      // Jump to the heading, then get out of the way (leave focus alone).
      closeDrawer();
    }
  });

  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') closeDrawer({ restoreFocus: true });
  });

  // Follow OS theme changes unless the visitor picked a theme manually.
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', event => {
    if (storedTheme() === null) applyTheme(event.matches ? 'dark' : 'light');
  });

  function init() {
    registerToggle();
    applyTheme(currentTheme());
    closeDrawer();
  }

  document.addEventListener('page:loaded', init);
})();
