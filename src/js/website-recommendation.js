export const WEBSITE_QUESTIONS = [
  {
    id: 'goal', label: 'Main goal', title: 'What should the website mainly do?',
    help: 'Choose the most important job. Other features can be part of the brief later.',
    options: [
      { value: 'leads', label: 'Introduce my business and get inquiries', detail: 'Explain services and help people contact me.' },
      { value: 'portfolio', label: 'Show my work', detail: 'Projects, photographs, case studies, or creative work.' },
      { value: 'shop', label: 'Sell products online', detail: 'Let customers browse, pay, and place an order.' },
      { value: 'bookings', label: 'Take appointments or reservations', detail: 'Show availability and let people book.' },
      { value: 'publishing', label: 'Publish articles or resources', detail: 'Give people useful content to read and find again.' },
      { value: 'app', label: 'Offer accounts or an online tool', detail: 'A portal, dashboard, or something visitors actively use.' },
    ],
  },
  {
    id: 'size', label: 'Content', title: 'How much do you need to put online?',
    help: 'Think about the content you have now, not everything you might add one day.',
    options: [
      { value: 'focused', label: 'One clear offer', detail: 'A focused introduction, a small launch, or a single service.' },
      { value: 'several', label: 'A handful of pages', detail: 'A few services, projects, products, or useful sections.' },
      { value: 'growing', label: 'Lots to browse', detail: 'A growing catalogue, project library, or collection of content.' },
    ],
  },
  {
    id: 'updates', label: 'Editing', title: 'How will the content change?',
    help: 'This helps decide whether you need a content editor and how much control it should offer.',
    options: [
      { value: 'occasional', label: 'A few times a year', detail: 'Mostly occasional changes to details or existing pages.' },
      { value: 'regular', label: 'Often, and I want to edit it', detail: 'I’ll add text, projects, products, or articles myself.' },
      { value: 'team', label: 'Several people will update it', detail: 'Different editors and a way to review changes.' },
    ],
  },
  {
    id: 'priority', label: 'Launch priority', title: 'What matters most for the first version?',
    help: 'There’s no wrong answer. This sets the starting scope, not a price or delivery date.',
    options: [
      { value: 'lean', label: 'Keep it small and useful', detail: 'Get the essentials working, then add more when needed.' },
      { value: 'presentation', label: 'Give the work room to shine', detail: 'Spend time on the content, imagery, and presentation.' },
      { value: 'growth', label: 'Plan for a bigger site', detail: 'Make space for more content, features, or integrations.' },
    ],
  },
];

const TYPES = {
  landing: {
    title: 'A focused landing page',
    summary: 'One well-structured page that explains your offer and makes the next step obvious.',
    reason: 'You want inquiries around one clear offer, so visitors can get the essentials without navigating a larger site.',
    structure: ['Your offer and who it is for', 'Useful details, examples, and common questions', 'A clear contact or inquiry action'],
  },
  business: {
    title: 'A business website',
    summary: 'A small multi-page site that helps people understand your services and decide whether to get in touch.',
    reason: 'Getting inquiries is the main goal, and your content needs more space than one focused introduction.',
    structure: ['Home and an overview of what you do', 'A page for each main service', 'About, real examples where available, and contact'],
  },
  portfolio: {
    title: 'A portfolio website',
    summary: 'A home for your work, with enough context to show how you approach a project.',
    reason: 'Your work is what visitors need to see before choosing to contact you.',
    structure: ['A selection of your strongest work', 'Project pages with images and useful context', 'About, services, and a direct contact route'],
  },
  ecommerce: {
    title: 'An online shop',
    summary: 'A product catalogue with checkout and the behind-the-scenes tools needed to manage orders.',
    reason: 'You need visitors to buy products, so payment, order handling, and customer information are essential.',
    structure: ['Product pages and a clear catalogue', 'Cart, payment, and order confirmation', 'Delivery or download details, returns, and support'],
  },
  booking: {
    title: 'A booking website',
    summary: 'A service website that lets visitors choose an appointment or reservation and understand what they’re booking.',
    reason: 'Booking is the main action, so availability and confirmations should be part of the core experience.',
    structure: ['Services, duration, pricing information, and location', 'Availability and a booking flow', 'Confirmations, cancellation information, and contact'],
  },
  editorial: {
    title: 'A content-led website',
    summary: 'A site organised around articles or resources, with a content management system for publishing.',
    reason: 'Publishing is the main job, so readers need an easy way to discover and return to your content.',
    structure: ['A readable article or resource template', 'Topic pages and a browsable archive', 'About the publisher and contact information'],
  },
  webapp: {
    title: 'A custom web application',
    summary: 'A purpose-built tool or portal. Start with the task people need to complete, then plan the screens and data behind it.',
    reason: 'Accounts or interactive workflows need more than a collection of public information pages.',
    structure: ['The main user task and its screens', 'Sign-in, permissions, and account recovery where needed', 'Data handling, helpful errors, and an administration workflow'],
  },
};

const LEAN_LAUNCH = {
  landing: 'Launch the offer, essential questions, and contact route first. Add pages only when there is a clear need.',
  business: 'Start with your core services and a clear contact route. Secondary pages can follow once the main content is ready.',
  portfolio: 'Start with a small selection of strong projects. A few well-explained examples are more useful than an unfinished archive.',
  ecommerce: 'Start with a small catalogue and a complete checkout. Payment, order confirmations, and fulfilment details still need to work.',
  booking: 'Start with one service or booking flow. Availability, confirmations, and cancellation rules still need to work.',
  editorial: 'Start with a clear article template, a few useful pieces, and a simple archive. Expand the topics as you publish.',
  webapp: 'Build one complete user workflow first. Include the permissions, data protection, and recovery paths it needs.',
};

export function recommendWebsite(answers) {
  if (!answers || WEBSITE_QUESTIONS.some((question) =>
    !question.options.some((option) => option.value === answers[question.id]))) return null;

  const goalTypes = { portfolio: 'portfolio', shop: 'ecommerce', bookings: 'booking', publishing: 'editorial', app: 'webapp' };
  const type = answers.goal === 'leads'
    ? (answers.size === 'focused' ? 'landing' : 'business')
    : goalTypes[answers.goal];
  const base = TYPES[type];
  const structure = [...base.structure];
  const reasons = [base.reason];

  if (answers.size === 'growing') {
    structure.push(type === 'webapp'
      ? 'Navigation and search for a growing set of records or tools'
      : 'Categories, clear navigation, and search or filters where useful');
    reasons.push('You have plenty of content to organise, so navigation and findability deserve attention from the start.');
  } else if (answers.size === 'focused') {
    reasons.push('Your initial content is focused. Keep the scope small while retaining the features needed for your main goal.');
  } else {
    reasons.push('A handful of pages or sections gives each part of your offer enough room without a sprawling launch.');
  }

  let editing;
  if (answers.updates === 'team') {
    editing = 'Plan a shared editing system with individual accounts, suitable permissions, and a review process. Decide who can publish and who maintains the site.';
  } else if (answers.updates === 'regular') {
    editing = 'Include a content management system (CMS) or suitable admin tools so you can update content yourself, with reusable layouts and a clear handover.';
  } else if (['ecommerce', 'booking', 'editorial', 'webapp'].includes(type)) {
    editing = 'Even with infrequent page edits, this site needs management tools for its content, orders, availability, or users. Plan who will look after them.';
  } else {
    editing = 'A lightweight site may be enough. Agree who makes occasional edits and handles upkeep; add a CMS if you want to manage those changes yourself.';
  }

  const launch = answers.priority === 'lean' ? LEAN_LAUNCH[type]
    : answers.priority === 'presentation'
      ? 'Put time into clear writing, original imagery, and a consistent visual direction. Design those around the core functionality, then check the result on mobile.'
      : 'Plan reusable page layouts, a clear content structure, and the integrations you expect to need. Build the essential workflow first, with room to extend it.';

  return { type, title: base.title, summary: base.summary, reasons, structure, editing, launch };
}

export function createWebsiteBrief(answers) {
  const result = recommendWebsite(answers);
  if (!result) return '';
  const choices = WEBSITE_QUESTIONS.map((question) => {
    const option = question.options.find((item) => item.value === answers[question.id]);
    return `${question.label}: ${option.label}`;
  });
  return [
    'Website project inquiry', '',
    `Suggested website: ${result.title}`, '',
    'I would like to discuss a website based on the following brief.', '',
    'Project requirements:', ...choices, '',
    'Suggested pages and workflows:', ...result.structure.map((item) => `- ${item}`), '',
    `Content management and handover: ${result.editing}`, '', `Initial scope: ${result.launch}`, '',
    'Please help me confirm the scope, any integrations, and a quote.', '',
    'A planning recommendation; scope and quote to be discussed.',
  ].join('\n');
}

// The visitor's plain-language description is deliberately separate from the studio brief.
export function createWebsiteDescription(answers) {
  const result = recommendWebsite(answers);
  if (!result) return '';
  const content = {
    focused: 'Your first version would stay focused on one clear offer, with the essential features working from day one.',
    several: 'Your content would be organised into a handful of clear pages or sections so visitors can find what they need.',
    growing: 'Your growing collection would have clear categories and navigation so it stays easy to browse as you add more.',
  };
  const editing = {
    occasional: 'You would only need occasional content changes. We would agree who looks after updates and day-to-day management.',
    regular: 'You would have a way to update your own text, images, and content without needing to edit code.',
    team: 'Your team would be able to update content with individual accounts and a way to review changes before publishing.',
  };
  const launch = {
    lean: 'We would start with a small, complete version and leave non-essential extras for later.',
    presentation: 'The first version would give extra attention to your writing, images, and the presentation of your work.',
    growth: 'The structure would leave room for the extra content, features, and connections you expect to add later.',
  };
  return [result.summary, content[answers.size], editing[answers.updates], launch[answers.priority]].join('\n\n');
}
