import '../css/style.css';
import { initCanvasBackground } from './canvas-bg.js';

document.addEventListener('DOMContentLoaded', () => {
  // 1. Initialize brutalist spark matrix
  initCanvasBackground('cyber-canvas');

  const revealItems = document.querySelectorAll('[data-reveal]');
  const revealItem = (item) => item.classList.add('is-visible');

  if ('IntersectionObserver' in window) {
    const revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        revealItem(entry.target);
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px' });

    revealItems.forEach((item) => revealObserver.observe(item));
  } else {
    revealItems.forEach(revealItem);
  }

  // 2. Mobile Menu Toggle
  const mobileMenuBtn = document.getElementById('mobile-menu-btn');
  const mobileMenu = document.getElementById('mobile-menu');
  const mobileLinks = document.querySelectorAll('.mobile-nav-link');

  if (mobileMenuBtn && mobileMenu) {
    mobileMenuBtn.addEventListener('click', () => {
      const isExpanded = mobileMenuBtn.getAttribute('aria-expanded') === 'true';
      mobileMenuBtn.setAttribute('aria-expanded', !isExpanded);
      mobileMenu.classList.toggle('hidden');
    });

    mobileLinks.forEach((link) => {
      link.addEventListener('click', () => {
        mobileMenu.classList.add('hidden');
        mobileMenuBtn.setAttribute('aria-expanded', 'false');
      });
    });
  }

  // 3. Contact Form Interactive Handler
  const contactForm = document.getElementById('studio-contact-form');
  const toast = document.getElementById('cyber-toast');

  if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
      e.preventDefault();

      const submitBtn = contactForm.querySelector('button[type="submit"]');
      const originalText = submitBtn.innerHTML;
      const formData = new FormData(contactForm);
      const category = contactForm.querySelector('#category');
      const categoryLabel = category.options[category.selectedIndex].text;
      const subject = `${categoryLabel} from ${formData.get('name')}`;
      const body = [
        `Name / studio: ${formData.get('name')}`,
        `Email: ${formData.get('email')}`,
        `Inquiry type: ${categoryLabel}`,
        '',
        formData.get('message'),
      ].join('\n');

      submitBtn.disabled = true;
      submitBtn.innerHTML = 'Preparing email...';

      window.location.href = `mailto:contact@hotwireinteractive.co.uk?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      contactForm.reset();
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalText;

      if (toast) {
        toast.classList.remove('hidden');
        window.setTimeout(() => toast.classList.add('hidden'), 6000);
      }
    });
  }
});
