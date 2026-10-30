import test from 'node:test';
import assert from 'node:assert/strict';
import { recommendWebsite, WEBSITE_QUESTIONS } from '../src/js/website-recommendation.js';
import { paymentSchedule } from '../src/js/payment-schedule.js';
import { getTemplate, templateBrief } from '../src/js/templates.js';
import { saveQuizHandoff, takeQuizHandoff } from '../src/js/quiz-handoff.js';

const base = { goal: 'leads', size: 'focused', updates: 'occasional', priority: 'lean', commerce: 'no', bookings: 'no', accounts: 'no', content: 'ready', timeline: 'normal', budget: 'unsure' };
const estimate = (changes = {}) => recommendWebsite({ ...base, ...changes }).estimate;

test('minimum scope starts at €500 and each feature independently enforces its package floor', () => {
  assert.equal(estimate().from, 500);
  for (const [changes, tier] of [
    [{ size: 'several' }, 'growth'], [{ updates: 'regular' }, 'growth'], [{ goal: 'publishing' }, 'growth'],
    [{ size: 'growing' }, 'scale'], [{ commerce: 'small' }, 'scale'], [{ bookings: 'basic' }, 'scale'],
    [{ goal: 'shop' }, 'scale'], [{ goal: 'bookings' }, 'scale'], [{ updates: 'team' }, 'scale'],
    [{ accounts: 'basic' }, 'enterprise'], [{ accounts: 'portal' }, 'enterprise'], [{ goal: 'app' }, 'enterprise'],
    [{ size: 'expansive' }, 'enterprise'], [{ commerce: 'full' }, 'enterprise'], [{ bookings: 'advanced' }, 'enterprise'],
    [{ commerce: 'small', bookings: 'basic' }, 'enterprise'],
  ]) assert.equal(estimate(changes).tier.id, tier, JSON.stringify(changes));
});

test('budget never raises or lowers the calculated scope; mismatch is explained', () => {
  const low = estimate({ accounts: 'portal', budget: 'starter' });
  const high = estimate({ accounts: 'portal', budget: 'enterprise' });
  assert.equal(low.from, high.from);
  assert.equal(low.to, high.to);
  assert.ok(low.budgetWarning);
  assert.equal(high.budgetWarning, '');
  assert.equal(estimate({ budget: 'enterprise' }).from, 500);
});

test('content and rush allowances compose predictably and keep a non-binding range', () => {
  assert.equal(estimate({ content: 'partial' }).from, 750);
  assert.equal(estimate({ content: 'needed' }).from, 1250);
  assert.equal(estimate({ content: 'needed', timeline: 'asap' }).from, 1500);
  assert.equal(estimate({ content: 'needed', timeline: 'asap' }).to, 3250);
  assert.match(estimate().caveat, /not a quote/);
  assert.ok(estimate({ accounts: 'portal' }).label.endsWith('+'));
});

test('invalid or incomplete new answers fail closed', () => {
  for (const { id } of WEBSITE_QUESTIONS) {
    const missing = { ...base }; delete missing[id];
    assert.equal(recommendWebsite(missing), null);
    assert.equal(recommendWebsite({ ...base, [id]: '__proto__' }), null);
  }
});

test('instalments use cents and always sum to the total, including odd-cent totals', () => {
  assert.deepEqual(paymentSchedule('500'), { total: 50000, deposit: 25000, milestone: 12500, final: 12500 });
  for (const value of ['500.01', '500.02', '1200.99', '14000.55']) {
    const split = paymentSchedule(value);
    assert.equal(split.deposit + split.milestone + split.final, split.total);
  }
  for (const value of ['', '499.99', '-500', '1e6', '500.001', 'NaN', '<img>', '10000001', null]) assert.equal(paymentSchedule(value), null);
});

test('only allowlisted design IDs generate brief text', () => {
  assert.ok(getTemplate('local'));
  for (const id of ['__proto__', '<script>', 'unknown', null]) {
    assert.equal(getTemplate(id), null);
    assert.equal(templateBrief(id), '');
  }
});

test('handoff whitelists choices, carries the template, and consumes the transfer once', () => {
  const storage = new Map();
  globalThis.sessionStorage = {
    setItem: (key, value) => storage.set(key, value),
    getItem: (key) => storage.get(key) || null,
    removeItem: (key) => storage.delete(key),
  };
  try {
    assert.equal(saveQuizHandoff({ ...base, email: 'do-not-store@example.com' }, 'local'), true);
    assert.ok(!storage.get('hotwire-website-brief').includes('do-not-store'));
    const brief = takeQuizHandoff();
    assert.match(brief, /Fieldwork/);
    assert.match(brief, /€500/);
    assert.equal(takeQuizHandoff(), '');
  } finally { delete globalThis.sessionStorage; }
});
