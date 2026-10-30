import { initSite } from './site.js';
import { paymentSchedule } from './payment-schedule.js';

initSite();
const form = document.getElementById('agreement-form');
const print = document.getElementById('agreement-print');
const status = document.getElementById('agreement-status');
form.hidden = false;
print.hidden = false;
print.addEventListener('click', () => window.print());
form.addEventListener('input', () => {
  print.disabled = true;
  status.textContent = 'Changes have not been applied to the review copy. Choose Prepare review draft before printing.';
});
form.addEventListener('submit', (event) => {
  event.preventDefault();
  const values = new FormData(form);
  const schedule = paymentSchedule(values.get('total'));
  const fields = [...document.querySelectorAll('[data-agreement]')];
  if (!schedule || fields.some((field) => !String(values.get(field.dataset.agreement) || '').trim())) {
    status.textContent = 'Complete every field and enter a valid total of at least €500.';
    return;
  }
  fields.forEach((field) => { field.textContent = String(values.get(field.dataset.agreement)).trim(); });
  const money = new Intl.NumberFormat('en-IE', { style: 'currency', currency: 'EUR' });
  document.querySelectorAll('[data-payment]').forEach((field) => {
    field.textContent = money.format(schedule[field.dataset.payment] / 100);
  });
  status.textContent = 'Review draft prepared locally. It is still not an issued agreement and must not be signed or paid against.';
  print.disabled = false;
  document.getElementById('document-title').focus();
});
