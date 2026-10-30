// Brand names, identities, and identifiers are not translation targets.
export const PROTECTED_TEXT = new Set([
  'HOTWIRE', 'INTERACTIVE', 'Hotwire Interactive', 'Hotwire',
  'Dauphin de Moulin', 'Liam van Looveren', 'Dauphin', 'Liam', 'Belgium.',
  'Starter', 'Growth', 'Scale', 'Enterprise', 'Webhero', 'JouwWeb', 'Webflux',
  'Fieldwork', 'FIELDWORK /', 'Forma', 'forma.', 'Objects', 'objects / everyday',
  'Still', 'still — studio', 'F.', 'a—z', 'Max Hermanelei 55', 'Brasschaat 2930',
  'English', 'Nederlands', 'Français', 'Deutsch', 'EN', 'NL', 'FR', 'DE',
]);

export function isTranslatable(text) {
  return /[A-Za-z]{2}/.test(text) && !PROTECTED_TEXT.has(text) &&
    !/^(?:https?:\/\/|mailto:|tel:|\/|#[\w-]+$)/.test(text) &&
    !/^[\w.+-]+@[\w.-]+\.[A-Za-z]+$/.test(text);
}
