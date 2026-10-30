import { getLocale, localizedObject } from '../i18n/index.js';
import { LANGUAGES } from '../i18n/config.js';
// Planning ranges, not binding offers. Keep public package copy in sync.
export const PRICE_TIERS = [
  { id: 'starter', name: 'Starter', label: 'Affordable', from: 500, to: 1200 },
  { id: 'growth', name: 'Growth', label: 'Medium', from: 1200, to: 3000 },
  { id: 'scale', name: 'Scale', label: 'High', from: 3000, to: 6500 },
  { id: 'enterprise', name: 'Enterprise', label: 'Extra high', from: 6500, to: 14000 },
];

export const formatEUR = (amount, locale = getLocale()) => new Intl.NumberFormat(LANGUAGES[locale].intl, {
  style: 'currency', currency: 'EUR', maximumFractionDigits: 0,
}).format(amount);

export function estimateWebsite(answers, locale = getLocale()) {
  let level = 0;
  const drivers = [];
  function minimum(rank, reason) {
    level = Math.max(level, rank);
    drivers.push(reason);
  }
  if (answers.size === 'several') minimum(1, '4–8 pages need a multi-page build.');
  if (answers.size === 'growing') minimum(2, '9–15 pages need more content structure and testing.');
  if (answers.size === 'expansive') minimum(3, '16+ pages or custom screens need detailed scoping.');
  if (answers.updates === 'regular' || answers.goal === 'publishing') minimum(1, 'Self-service publishing needs a CMS and handover.');
  if (answers.updates === 'team') minimum(2, 'Multiple editors need permissions and a review workflow.');
  // Each requirement independently sets a floor. A small budget never removes features.
  if (answers.goal === 'shop' || answers.commerce !== 'no') minimum(2, 'Online selling needs checkout, orders, and payment-provider setup.');
  if (answers.goal === 'bookings' || answers.bookings !== 'no') minimum(2, 'Bookings need availability, confirmations, and cancellation handling.');
  if (answers.goal === 'app' || answers.accounts !== 'no') minimum(3, 'Visitor accounts or custom tools need security and workflow scoping.');
  if ((answers.goal === 'shop' || answers.commerce !== 'no') &&
      (answers.goal === 'bookings' || answers.bookings !== 'no')) minimum(3, 'Combining commerce and bookings needs integration scoping.');
  if (answers.commerce === 'full' || answers.bookings === 'advanced') minimum(3, 'Complex stock or multi-staff booking rules need a tailored specification.');

  const tier = PRICE_TIERS[level];
  const adjustments = [];
  let extra = 0;
  if (answers.content === 'partial') { extra += 250; adjustments.push('Content editing allowance: €250–€500.'); }
  if (answers.content === 'needed') { extra += 750; adjustments.push('Copywriting/content allowance: €750–€1,500.'); }
  const rush = answers.timeline === 'asap';
  if (rush) adjustments.push('Under-four-week request: 20% planning allowance; availability is not guaranteed.');
  const from = Math.ceil((tier.from + extra) * (rush ? 1.2 : 1) / 50) * 50;
  const to = Math.ceil((tier.to + extra * 2) * (rush ? 1.2 : 1) / 50) * 50;
  const budgetMax = { starter: 1200, growth: 3000, scale: 6500, enterprise: Infinity, unsure: Infinity }[answers.budget];
  const budgetWarning = from > budgetMax
    ? 'Your requirements exceed your indicated budget. Reduce scope together or revise the budget; essential features have not been removed.' : '';
  return localizedObject({
    tier, from, to, label: `${formatEUR(from, locale)}–${formatEUR(to, locale)}${level === 3 ? '+' : ''}`,
    drivers: drivers.length ? drivers : ['A supplied-content template with 1–3 pages keeps the initial scope affordable.'],
    adjustments, budgetWarning,
    caveat: 'Indicative build budget, not a quote or price cap. Tax treatment and the total payable must be confirmed in writing before signing. Hosting, domains, subscriptions, transaction fees, translation, and ongoing maintenance are separate unless quoted.',
  }, locale);
}
