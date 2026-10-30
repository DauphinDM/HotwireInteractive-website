// Build/review safeguards, not a claim of linguistic or legal certification.
export const PROTECTED_TERMS = [
  'Hotwire Interactive', 'Dauphin de Moulin', 'Liam van Looveren',
  'Fieldwork', 'Forma', 'Objects', 'Still', 'Starter', 'Growth', 'Scale',
  'Enterprise', 'Webhero', 'JouwWeb', 'Google Fonts', 'HttpOnly', 'SameSite=Strict', 'Secure',
];

// These labels genuinely have the same spelling in the source and target.
// A new unchanged message needs an explicit decision, not a silent fallback.
const technical = ['Allow: GET, POST', 'Cache-Control: no-store',
  'Dauphin de Moulin | Hotwire Interactive', 'Hotwire Interactive.',
  'Liam van Looveren | Hotwire Interactive', 'quiz-option picker-card',
  'Referrer-Policy: same-origin', 'Retry-After: 900',
  'X-Content-Type-Options: nosniff', 'X-Frame-Options: DENY'];
export const UNCHANGED_MESSAGES = {
  nl: new Set([...technical, 'Contact', 'Escape', 'Google Fonts:', 'Privacy',
    'Privacy | Hotwire Interactive', 'Studio', 'Team', 'Team | Hotwire Interactive',
    'Type', 'Webhero · webshop', 'Websites', 'Websites | Hotwire Interactive']),
  fr: new Set([...technical, 'Contact', 'Flexible', 'Portfolios', 'Studio', 'Type']),
  de: new Set([...technical, 'Escape', 'Google Fonts:', 'Name', 'Portfolios',
    'Studio', 'Team', 'Team | Hotwire Interactive', 'Websites', 'Websites | Hotwire Interactive']),
};

export function numberTokens(text) {
  return (text.match(/\d+(?:[.,\u00a0\u202f ]\d{3})*(?:[.,]\d{1,2})?/g) || [])
    .map((value) => value.replace(/[\s\u00a0\u202f]/g, '')
      .replace(/[.,](?=\d{3}(?:[.,]|$))/g, '').replace(',', '.'));
}

export function translationIssues(source, value, locale) {
  const issues = [];
  if (JSON.stringify(numberTokens(source)) !== JSON.stringify(numberTokens(value))) issues.push('changed numeric values');
  for (const term of PROTECTED_TERMS) {
    if (source.includes(term) && !value.includes(term)) issues.push(`changed protected term: ${term}`);
  }
  if (source === value && !UNCHANGED_MESSAGES[locale]?.has(source)) issues.push('unreviewed English fallback');
  if (locale === 'nl' && /(?<![\p{L}\p{N}_])(?:u|uw)(?![\p{L}\p{N}_])/iu.test(value)) issues.push('use the agreed je/jouw register');
  if (locale === 'de' && /(?<![\p{L}\p{N}_])(?:du|dich|dir|dein(?:e|en|em|er|es)?|Lass uns)(?![\p{L}\p{N}_])/iu.test(value)) issues.push('use the agreed Sie/Ihr register');
  if (locale === 'fr' && /(?<![\p{L}\p{N}_])(?:tu|toi|ton|ta|tes)(?![\p{L}\p{N}_])/iu.test(value)) issues.push('use the agreed vous/votre register');
  return issues;
}
