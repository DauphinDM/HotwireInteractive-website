import { initSite } from './site.js';
import { initContactForm } from './contact.js';

<<<<<<< HEAD
initSite();
const contact = initContactForm();
const url = new URL(window.location.href);
if (url.searchParams.get('website-brief') === '1') {
  url.searchParams.delete('website-brief');
  history.replaceState(null, '', url.pathname + url.search + url.hash);
  // Ordinary homepage visits do not need the quiz/recommendation bundle.
  import('./quiz-handoff.js').then(({ takeQuizHandoff }) => {
    const brief = takeQuizHandoff();
    if (brief && contact) {
      contact.attachWebsiteBrief(brief);
      document.getElementById('name').focus();
    } else if (contact) {
      document.getElementById('contact-status').textContent = 'Your quiz brief has expired or is unavailable. Please retake the quiz, or describe your project in the message below.';
    }
  }).catch(() => {
    document.getElementById('contact-status').textContent = 'The website brief could not be loaded. Return to the quiz and use Copy recommendation to include it in your message.';
  });
}
=======
document.addEventListener('DOMContentLoaded', () => {
  // 1. Initialize brutalist spark matrix — always animates
  initCanvasBackground('cyber-canvas');

  // 2. Reveal animations — stagger on load, then intersection-observer as backup
  const revealItems = document.querySelectorAll('[data-reveal]');

  revealItems.forEach((item, index) => {
    const delay = parseInt(item.getAttribute('data-reveal-delay') || '0', 10);
    window.setTimeout(() => {
      item.classList.add('is-visible');
    }, delay * 300);
  });

  if ('IntersectionObserver' in window) {
    const revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px' });

    revealItems.forEach((item) => revealObserver.observe(item));
  }

  // 3. Mobile Menu Toggle
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

  // 4. Contact Form — POST to PHP handler, emails contact@hotwireinteractive.co.uk
  const contactForm = document.getElementById('studio-contact-form');
  const submitBtn = contactForm ? contactForm.querySelector('button[type="submit"]') : null;
  const status = document.getElementById('contact-form-status');

  // 5. Scroll-to buttons (data-scroll-to="#section-id")
  document.querySelectorAll('[data-scroll-to]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const target = document.querySelector(btn.getAttribute('data-scroll-to'));
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

  if (contactForm) {
    contactForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = 'Sending...';
      }
      if (status) {
        status.classList.add('hidden');
        status.textContent = '';
      }

      const formData = new FormData(contactForm);

      try {
        const response = await fetch('contact.php', {
          method: 'POST',
          body: formData,
        });
        const result = await response.json();

        if (response.ok && result.success) {
          contactForm.reset();
          if (status) {
            status.textContent = 'Message sent — we’ll be in touch.';
            status.classList.remove('text-industrial-400');
            status.classList.add('text-hotwire', 'font-bold');
            status.classList.remove('hidden');
          }
        } else {
          if (status) {
            status.textContent = result.error || 'Failed to send. Try again.';
            status.classList.remove('text-hotwire', 'font-bold');
            status.classList.add('text-industrial-400');
            status.classList.remove('hidden');
          }
        }
      } catch (err) {
        if (status) {
          status.textContent = 'Network error. Try emailing us directly.';
          status.classList.remove('text-hotwire', 'font-bold');
          status.classList.add('text-industrial-400');
          status.classList.remove('hidden');
        }
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = 'Send message';
        }
      }
    });
  }
});
>>>>>>> 784a34668a5015fe962023f3e7222e0a6e5677ef
