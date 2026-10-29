const active = new Set();

export function animateEntrance(element, delay = 0, duration = 600) {
  if (!element?.animate || element.contains(document.activeElement) || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const animation = element.animate([
    { opacity: 0, transform: 'translateY(18px)' },
    { opacity: 1, transform: 'translateY(0)' },
  ], { duration, delay, easing: 'cubic-bezier(0.2, 0.7, 0.2, 1)', fill: 'backwards' });
  active.add(animation);
  animation.finished.catch(() => {}).finally(() => { active.delete(animation); animation.cancel(); });
}

export function initPageMotion() {
  const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
  preference.addEventListener('change', () => {
    if (preference.matches) active.forEach((animation) => animation.cancel());
  });
  // Tabbing into a section should never leave its focused control invisible.
  document.addEventListener('focusin', (event) => {
    active.forEach((animation) => {
      if (animation.effect?.target?.contains(event.target)) animation.cancel();
    });
  });
  if (!('IntersectionObserver' in window)) return;
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      observer.unobserve(entry.target);
      animateEntrance(entry.target, entry.target.matches('.website-note') ? 100 : 0);
    });
  }, { threshold: 0.08 });
  document.querySelectorAll('.hero-layout > *, .page-intro .page-shell, .service-row, .studio-layout > *, .team-card, .profile-facts > div, .profile-bio, .contact-layout > *, .quiz-introduction, .quiz-panel').forEach((element) => observer.observe(element));
  // Content is never hidden in CSS; missing JavaScript/observer support stays readable.
}
