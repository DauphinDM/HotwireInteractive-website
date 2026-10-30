import { initSite } from './site.js';
import { getLocale, t } from '../i18n/index.js';
import { LANGUAGES } from '../i18n/config.js';

initSite();

const products = {
  vessel: { name: 'Clay vessel', cents: 3800 },
  bowl: { name: 'Low bowl', cents: 2400 },
  print: { name: 'Line study', cents: 4500 },
};
const quantities = new Map();
const cart = document.getElementById('demo-cart-items');
const status = document.getElementById('demo-cart-status');
const clear = document.getElementById('demo-cart-clear');
const money = (cents) => new Intl.NumberFormat(LANGUAGES[getLocale()].intl, { style: 'currency', currency: 'EUR' }).format(cents / 100);
function renderCart() {
  let total = 0;
  let count = 0;
  cart.replaceChildren(...[...quantities].map(([id, quantity]) => {
    const product = products[id];
    total += product.cents * quantity;
    count += quantity;
    const item = document.createElement('li');
    item.textContent = `${t(product.name)} × ${quantity} — ${money(product.cents * quantity)}`;
    return item;
  }));
  status.textContent = count ? t('{count} demo item(s) — {price} sample total. No payment or order has been made.', { count, price: money(total) }) : t('Your demo basket is empty. Nothing is saved or sent.');
}
if (cart) {
  document.querySelectorAll('[data-add-product]').forEach((button) => {
    button.hidden = false;
    button.addEventListener('click', () => {
      const id = button.dataset.addProduct;
      if (!Object.hasOwn(products, id)) return;
      quantities.set(id, Math.min(99, (quantities.get(id) || 0) + 1));
      renderCart();
    });
  });
  clear.hidden = false;
  clear.addEventListener('click', () => { quantities.clear(); renderCart(); });
  renderCart();
  window.addEventListener('hotwire:languagechange', renderCart);
}
const booking = document.getElementById('demo-booking-form');
if (booking) {
  document.getElementById('demo-booking-submit').hidden = false;
  let previewed = false;
  function renderBookingPreview() {
    const session = booking.querySelector('input[name="session"]:checked').parentElement.textContent.trim();
    const slot = booking.querySelector('input[name="slot"]:checked').parentElement.textContent.trim();
    document.getElementById('demo-booking-status').textContent = t('Demo selection: {session} — {slot}. This is a preview only; no reservation was made and nothing was sent.', { session, slot });
  }
  booking.addEventListener('submit', (event) => {
    event.preventDefault();
    previewed = true;
    renderBookingPreview();
  });
  window.addEventListener('hotwire:languagechange', () => { if (previewed) renderBookingPreview(); });
}
