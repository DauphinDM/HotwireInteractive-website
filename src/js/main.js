import { initSite } from './site.js';
import { initContactForm } from './contact.js';

initSite();
const contact = initContactForm();
const url = new URL(window.location.href);
// A fixed, allowlisted design ID can prepare an inquiry without storing personal data.
if (url.searchParams.has('template') && url.searchParams.get('website-brief') !== '1') {
  const templateId = url.searchParams.get('template');
  url.searchParams.delete('template');
  history.replaceState(null, '', url.pathname + url.search + url.hash);
  import('./templates.js').then(({ templateBrief }) => {
    const brief = templateBrief(templateId);
    if (brief && contact) {
      contact.attachWebsiteBrief(brief);
      document.getElementById('name').focus();
    }
  }).catch(() => {
    document.getElementById('contact-status').textContent = 'Please include the example design name in your message.';
  });
}
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
