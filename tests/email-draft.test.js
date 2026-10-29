import test from 'node:test';
import assert from 'node:assert/strict';
import { createEmailDraft } from '../src/js/contact.js';

test('preserves Unicode and encodes email delimiters without adding recipients or headers', () => {
  const draft = createEmailDraft({
    name: '  Zoë & Co? #1  ',
    email: ' zoe+studio@example.com ',
    category: 'Press & media',
    message: '  Hello Hotwire!\nAn idea: 50% + more & a link?subject=hello#world 🎮  ',
  });
  const url = new URL(draft.url);
  assert.equal(url.protocol, 'mailto:');
  assert.equal(url.pathname, 'contact@hotwireinteractive.co.uk');
  assert.deepEqual([...url.searchParams.keys()], ['subject', 'body']);
  assert.equal(url.searchParams.get('subject'), 'Press & media from Zoë & Co? #1');
  assert.ok(url.searchParams.get('body').includes('Email: zoe+studio@example.com'));
  assert.ok(url.searchParams.get('body').endsWith('An idea: 50% + more & a link?subject=hello#world 🎮'));
  assert.ok(draft.text.startsWith('To: contact@hotwireinteractive.co.uk\r\nSubject: Press & media from Zoë & Co? #1'));
});

test('normalises name line breaks to keep the subject on one line', () => {
  const draft = createEmailDraft({
    name: 'Studio\r\nA', email: 'studio@example.com', category: 'Studio inquiry', message: 'Hello',
  });
  assert.equal(new URL(draft.url).searchParams.get('subject'), 'Studio inquiry from Studio A');
});
