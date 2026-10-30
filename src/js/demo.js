import { initSite } from './site.js';

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
const money = (cents) => new Intl.NumberFormat('en-IE', { style: 'currency', currency: 'EUR' }).format(cents / 100);
function renderCart() {
  let total = 0;
  let count = 0;
  cart.replaceChildren(...[...quantities].map(([id, quantity]) => {
    const product = products[id];
    total += product.cents * quantity;
    count += quantity;
    const item = document.createElement('li');
    item.textContent = `${product.name} × ${quantity} — ${money(product.cents * quantity)}`;
    return item;
  }));
  status.textContent = count ? `${count} demo item${count === 1 ? '' : 's'} — ${money(total)} sample total. No payment or order has been made.` : 'Your demo basket is empty. Nothing is saved or sent.';
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
}
const booking = document.getElementById('demo-booking-form');
if (booking) {
  document.getElementById('demo-booking-submit').hidden = false;
  booking.addEventListener('submit', (event) => {
    event.preventDefault();
    const data = new FormData(booking);
    document.getElementById('demo-booking-status').textContent = `Demo selection: ${data.get('session')} — ${data.get('slot')}. This is a preview only; no reservation was made and nothing was sent.`;
  });
}
