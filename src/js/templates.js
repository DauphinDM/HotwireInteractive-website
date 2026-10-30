export const WEBSITE_TEMPLATES = [
  { id: 'local', name: 'Fieldwork — local services', goal: 'leads', tier: 'Starter', price: 500 },
  { id: 'portfolio', name: 'Forma — creative portfolio', goal: 'portfolio', tier: 'Growth', price: 1200 },
  { id: 'shop', name: 'Objects — independent shop', goal: 'shop', tier: 'Scale', price: 3000 },
  { id: 'booking', name: 'Still — appointment studio', goal: 'bookings', tier: 'Scale', price: 3000 },
];

export function getTemplate(id) {
  return WEBSITE_TEMPLATES.find((template) => template.id === id) || null;
}

export function templateBrief(id) {
  const template = getTemplate(id);
  return template ? `Preferred design direction: ${template.name}\nPreview: https://hotwireinteractive.co.uk/websites/examples/${template.id}/\nThis is a fictional design demonstration, not a live customer site or a fixed specification. Please confirm scope, total price, and ongoing costs before any agreement.` : '';
}
