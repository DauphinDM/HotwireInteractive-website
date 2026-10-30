import { initSite } from './site.js';
import { paymentSchedule } from './payment-schedule.js';
import { getLocale, t } from '../i18n/index.js';
import { LANGUAGES } from '../i18n/config.js';

initSite();
const form = document.getElementById('agreement-form');
const print = document.getElementById('agreement-print');
const status = document.getElementById('agreement-status');
let preparedSchedule;
let statusSource = '';
const setStatus = (text) => { statusSource = text; status.textContent = t(text); };
function renderPayments() {
  if (!preparedSchedule) return;
  const money = new Intl.NumberFormat(LANGUAGES[getLocale()].intl, { style: 'currency', currency: 'EUR' });
  document.querySelectorAll('[data-payment]').forEach((field) => {
    field.removeAttribute('data-i18n');
    field.textContent = money.format(preparedSchedule[field.dataset.payment] / 100);
  });
}
form.hidden = false;
print.hidden = false;
print.addEventListener('click', () => window.print());
form.addEventListener('input', () => {
  print.disabled = true;
  setStatus('Changes have not been applied to the review copy. Choose Prepare review draft before printing.');
});
form.addEventListener('submit', (event) => {
  event.preventDefault();
  const values = new FormData(form);
  const schedule = paymentSchedule(values.get('total'));
  const fields = [...document.querySelectorAll('[data-agreement]')];
  if (!schedule || fields.some((field) => !String(values.get(field.dataset.agreement) || '').trim())) {
    setStatus('Complete every field and enter a valid total of at least €500.');
    return;
  }
  fields.forEach((field) => { field.removeAttribute('data-i18n'); field.setAttribute('translate', 'no'); field.textContent = String(values.get(field.dataset.agreement)).trim(); });
  preparedSchedule = schedule;
  renderPayments();
  setStatus('Review draft prepared locally. It is still not an issued agreement and must not be signed or paid against.');
  print.disabled = false;
  document.getElementById('document-title').focus();
});
window.addEventListener('hotwire:languagechange', () => { renderPayments(); if (statusSource) setStatus(statusSource); });
