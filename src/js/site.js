import { animateEntrance, initPageMotion } from './motion.js';
import { initLanguages, t } from '../i18n/index.js';

function initNavigation() {
  const button = document.getElementById('mobile-menu-btn');
  const menu = document.getElementById('mobile-menu');
  const header = document.getElementById('navbar');
  if (!button || !menu || !header) return;

  const desktop = window.matchMedia('(min-width: 1280px)');
  const setOpen = (open, restoreFocus = false) => {
    menu.hidden = !open;
    button.setAttribute('aria-expanded', String(open));
    button.setAttribute('aria-label', t(open ? 'Close navigation' : 'Open navigation'));
    if (open) animateEntrance(menu, 0, 180);
    if (restoreFocus) button.focus();
  };

  button.addEventListener('click', () => setOpen(menu.hidden));
  window.addEventListener('hotwire:languagechange', () => button.setAttribute('aria-label', t(menu.hidden ? 'Open navigation' : 'Close navigation')));
  menu.addEventListener('click', (event) => {
    if (event.target.closest('a')) setOpen(false);
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && !menu.hidden) {
      setOpen(false, true);
    }
  });
  document.addEventListener('click', (event) => {
    if (!menu.hidden && !header.contains(event.target)) setOpen(false);
  });
  document.addEventListener('focusin', (event) => {
    if (!menu.hidden && !header.contains(event.target)) setOpen(false);
  });
  desktop.addEventListener('change', () => {
    const focusInMenu = menu.contains(document.activeElement);
    setOpen(false);
    if (focusInMenu && desktop.matches) {
      header.querySelector('nav[aria-label="Primary navigation"] a')?.focus();
    }
  });

  setOpen(false);
  button.hidden = false;
  document.documentElement.classList.add('site-ready');
}

export function initSite() {
  initLanguages();
  initNavigation();
  initPageMotion();
  document.querySelectorAll('[data-year]').forEach((item) => {
    item.textContent = String(new Date().getFullYear());
  });
}
