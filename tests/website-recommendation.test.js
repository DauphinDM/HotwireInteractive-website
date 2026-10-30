import test from 'node:test';
import assert from 'node:assert/strict';
import { WEBSITE_QUESTIONS, recommendWebsite, createWebsiteBrief, createWebsiteDescription } from '../src/js/website-recommendation.js';
import { createEmailDraft } from '../src/js/contact.js';

const baseline = { goal: 'leads', size: 'focused', updates: 'occasional', priority: 'lean', commerce: 'no', bookings: 'no', accounts: 'no', content: 'ready', timeline: 'normal', budget: 'unsure' };

test('maps real goals to the appropriate type, including a landing page versus a business site', () => {
  for (const [goal, type] of Object.entries({ leads: 'landing', portfolio: 'portfolio', shop: 'ecommerce', bookings: 'booking', publishing: 'editorial', app: 'webapp' })) {
    assert.equal(recommendWebsite({ ...baseline, goal }).type, type);
  }
  assert.equal(recommendWebsite({ ...baseline, size: 'several' }).type, 'business');
  assert.equal(recommendWebsite({ ...baseline, size: 'growing' }).type, 'business');
});

test('a small launch retains essential commerce, booking, and application functionality', () => {
  const shop = recommendWebsite({ ...baseline, goal: 'shop' });
  assert.match(shop.launch, /complete checkout/);
  assert.match(shop.editing, /management tools/);
  const bookings = recommendWebsite({ ...baseline, goal: 'bookings' });
  assert.match(bookings.launch, /Availability, confirmations/);
  const app = recommendWebsite({ ...baseline, goal: 'app' });
  assert.match(app.launch, /permissions, data protection/);
});

test('content scale, editing needs, and launch priority each change the plan', () => {
  const simple = recommendWebsite({ ...baseline, goal: 'portfolio' });
  const library = recommendWebsite({ ...baseline, goal: 'portfolio', size: 'growing' });
  assert.ok(library.structure.length > simple.structure.length);
  assert.match(recommendWebsite({ ...baseline, updates: 'regular' }).editing, /CMS/);
  assert.match(recommendWebsite({ ...baseline, updates: 'team' }).editing, /individual accounts/);
  assert.match(recommendWebsite({ ...baseline, priority: 'presentation' }).launch, /original imagery/);
  assert.match(recommendWebsite({ ...baseline, priority: 'growth' }).launch, /integrations/);
});

test('incomplete or invalid answers cannot produce a recommendation', () => {
  for (const answers of [null, {}, { ...baseline, goal: 'invalid' }, { ...baseline, updates: '' }, { ...baseline, goal: '__proto__' }]) {
    assert.equal(recommendWebsite(answers), null);
    assert.equal(createWebsiteBrief(answers), '');
  }
});

test('every option and 1,000 mixed combinations produce complete, deterministic briefs', () => {
  const samples = [baseline];
  for (const question of WEBSITE_QUESTIONS) {
    for (const option of question.options) samples.push({ ...baseline, [question.id]: option.value });
  }
  let seed = 73491;
  for (let index = 0; index < 1000; index++) {
    samples.push(Object.fromEntries(WEBSITE_QUESTIONS.map((question) => {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      return [question.id, question.options[seed % question.options.length].value];
    })));
  }
  for (const answers of samples) {
      const result = recommendWebsite(answers);
      const brief = createWebsiteBrief(answers);
      assert.ok(result.title && result.summary && result.editing && result.launch);
      assert.ok(result.structure.length >= 3);
      assert.ok(result.reasons.length >= 2);
      assert.ok(brief.includes(result.title));
      assert.ok(!brief.includes('undefined'));
      assert.equal(createWebsiteBrief(answers), brief);
      const description = createWebsiteDescription(answers);
      assert.ok(description && !description.includes('undefined'));
      assert.notEqual(description, brief);
      assert.match(brief, /Project requirements:/);
      assert.match(description, /Your|You would/);
      assert.ok(result.estimate.from >= 500);
      assert.ok(result.estimate.to >= result.estimate.from);
      assert.ok(brief.includes(result.estimate.label));
      assert.ok(brief.length < 12000);
  }
});

test('a website brief is appended without losing the visitor’s own message', () => {
  const brief = createWebsiteBrief(baseline);
  const draft = createEmailDraft({ name: 'Zoë', email: 'zoe@example.com', category: 'Website project', message: 'Keep my existing domain & email.', brief });
  const body = new URL(draft.url).searchParams.get('body');
  assert.ok(body.includes('Keep my existing domain & email.'));
  assert.ok(body.includes(brief));
  assert.match(draft.text, /Website quiz brief:/);
});
