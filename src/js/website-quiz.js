import { WEBSITE_QUESTIONS, recommendWebsite, createWebsiteDescription } from './website-recommendation.js';
import { saveQuizHandoff } from './quiz-handoff.js';
import { animateEntrance } from './motion.js';
import { getTemplate, templateBrief } from './templates.js';
import { t, localizedObject, localHref } from '../i18n/index.js';

export function initWebsiteQuiz() {
  const root = document.getElementById('website-finder');
  if (!root) return;
  const form = document.getElementById('website-quiz-form');
  const welcome = document.getElementById('quiz-welcome');
  const resultPanel = document.getElementById('quiz-result');
  const questionTitle = document.getElementById('quiz-question');
  const options = document.getElementById('quiz-options');
  const error = document.getElementById('quiz-error');
  const next = document.getElementById('quiz-next');
  const back = document.getElementById('quiz-back');
  const briefText = document.getElementById('quiz-brief-text');
  const copyStatus = document.getElementById('quiz-copy-status');
  const summary = document.getElementById('quiz-summary');
  let answers = {};
  let step = 0;
  let revision = 0;
  const template = getTemplate(new URL(window.location.href).searchParams.get('template'));
  const templateNote = document.getElementById('quiz-template');
  function renderTemplateNote() { if (template) {
    templateNote.textContent = t('Design direction: {design}. Features and pricing are estimated separately.', { design: t(template.name) });
    templateNote.hidden = false;
  } }
  renderTemplateNote();

  function focusPanel(target) {
    root.scrollIntoView({ block: 'start', behavior: 'instant' });
    target.focus({ preventScroll: true });
  }

  function renderQuestion(focus = true) {
    revision += 1;
    welcome.hidden = true;
    resultPanel.hidden = true;
    form.hidden = false;
    error.textContent = '';
    const question = localizedObject(WEBSITE_QUESTIONS[step]);
    const stepText = t('Question {current} of {total}', { current: step + 1, total: WEBSITE_QUESTIONS.length });
    document.getElementById('quiz-step-label').textContent = stepText;
    const progress = document.getElementById('quiz-progress');
    progress.max = WEBSITE_QUESTIONS.length;
    progress.value = step + 1;
    progress.setAttribute('aria-valuetext', stepText);
    questionTitle.textContent = question.title;
    document.getElementById('quiz-question-help').textContent = question.help;
    options.replaceChildren();
    for (const option of question.options) {
      const label = document.createElement('label');
      label.className = 'quiz-option picker-card';
      const radio = document.createElement('input');
      radio.type = 'radio';
      radio.name = question.id;
      radio.value = option.value;
      radio.required = true;
      radio.checked = answers[question.id] === option.value;
      const text = document.createElement('span');
      const title = document.createElement('strong');
      title.textContent = option.label;
      const detail = document.createElement('small');
      detail.id = `quiz-${question.id}-${option.value}-detail`;
      detail.textContent = option.detail;
      radio.setAttribute('aria-describedby', detail.id);
      // Keep the concise option label as its accessible name; detail is a description.
      radio.setAttribute('aria-label', option.label);
      text.append(title, detail);
      label.append(radio, text);
      options.append(label);
    }
    back.hidden = step === 0;
    next.textContent = t(step === WEBSITE_QUESTIONS.length - 1 ? 'See my recommendation' : 'Next question');
    if (focus) focusPanel(questionTitle);
    animateEntrance(options, 0, 240);
  }

  function start(goal) {
    answers = {};
    if (WEBSITE_QUESTIONS[0].options.some((option) => option.value === goal)) answers.goal = goal;
    step = 0;
    copyStatus.textContent = '';
    briefText.value = '';
    summary.open = false;
    renderQuestion();
  }

  function fillList(id, items) {
    document.getElementById(id).replaceChildren(...items.map((text) => {
      const item = document.createElement('li');
      item.textContent = text;
      return item;
    }));
  }

  function renderResult(focus = true) {
    const result = recommendWebsite(answers);
    if (!result) return;
    revision += 1;
    form.hidden = true;
    resultPanel.hidden = false;
    const title = document.getElementById('quiz-result-title');
    title.textContent = result.title;
    document.getElementById('quiz-result-summary').textContent = createWebsiteDescription(answers);
    fillList('quiz-result-reasons', result.reasons);
    fillList('quiz-result-structure', result.structure);
    document.getElementById('quiz-result-editing').textContent = result.editing;
    document.getElementById('quiz-result-launch').textContent = result.launch;
    document.getElementById('quiz-result-tier').textContent = `${result.estimate.tier.name} — ${result.estimate.label}`;
    fillList('quiz-price-drivers', [...result.estimate.drivers, ...result.estimate.adjustments]);
    document.getElementById('quiz-budget-warning').textContent = result.estimate.budgetWarning;
    document.getElementById('quiz-price-caveat').textContent = result.estimate.caveat;
    briefText.value = `${result.title}\n\n${createWebsiteDescription(answers)}\n\n${t('Your starting pages:')}\n${result.structure.map((item) => `- ${item}`).join('\n')}`;
    if (template) briefText.value += `\n\n${templateBrief(template.id)}`;
    copyStatus.textContent = '';
    summary.open = false;
    if (focus) focusPanel(title);
    animateEntrance(document.getElementById('quiz-result-summary'), 0, 400);
  }

  form.addEventListener('change', (event) => {
    const question = WEBSITE_QUESTIONS[step];
    if (event.target.name !== question.id) return;
    answers[question.id] = event.target.value;
    error.textContent = '';
    options.querySelectorAll('input').forEach((input) => input.removeAttribute('aria-invalid'));
  });
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const question = WEBSITE_QUESTIONS[step];
    // Read checked state as well, so browser-restored radio state is respected.
    const selected = options.querySelector('input:checked');
    if (!selected) {
      error.textContent = t('Choose one answer to continue.');
      options.querySelectorAll('input').forEach((input) => input.setAttribute('aria-invalid', 'true'));
      options.querySelector('input').focus();
      return;
    }
    answers[question.id] = selected.value;
    if (step < WEBSITE_QUESTIONS.length - 1) {
      step += 1;
      renderQuestion();
    } else {
      renderResult();
    }
  });
  back.addEventListener('click', () => {
    if (step > 0) { step -= 1; renderQuestion(); }
  });
  document.getElementById('quiz-start').addEventListener('click', () => start());
  document.getElementById('quiz-restart').addEventListener('click', () => start());
  document.getElementById('quiz-retake').addEventListener('click', () => start());
  document.getElementById('quiz-revise').addEventListener('click', () => {
    step = 0;
    renderQuestion();
  });
  document.getElementById('start-quiz').addEventListener('click', (event) => {
    event.preventDefault();
    // Repeated clicks return to the current state instead of discarding answers.
    if (!form.hidden) focusPanel(questionTitle);
    else if (!resultPanel.hidden) focusPanel(document.getElementById('quiz-result-title'));
    else start();
  });
  document.getElementById('quiz-copy').addEventListener('click', async () => {
    const currentRevision = revision;
    try {
      await navigator.clipboard.writeText(briefText.value);
      if (currentRevision === revision) copyStatus.textContent = t('Recommendation copied. Keep it for yourself or include it in a project brief.');
    } catch {
      if (currentRevision !== revision) return;
      summary.open = true;
      briefText.focus();
      briefText.select();
      copyStatus.textContent = t('Automatic copying is unavailable. Your brief is selected below so you can copy it manually.');
    }
  });
  document.getElementById('quiz-contact').addEventListener('click', (event) => {
    event.preventDefault();
    if (saveQuizHandoff(answers, template?.id)) {
      window.location.assign(localHref('/?website-brief=1#contact'));
    } else {
      summary.open = true;
      briefText.focus();
      briefText.select();
      copyStatus.textContent = t('Your browser could not carry the brief to the contact page. Copy the selected brief, then use Contact in the navigation to include it in your message.');
    }
  });

  document.getElementById('quiz-fallback').hidden = true;
  welcome.hidden = false;
  window.addEventListener('hotwire:languagechange', () => {
    renderTemplateNote();
    if (!form.hidden) renderQuestion(false);
    else if (!resultPanel.hidden) renderResult(false);
  });
  const goal = new URL(window.location.href).searchParams.get('goal');
  if (WEBSITE_QUESTIONS[0].options.some((option) => option.value === goal)) {
    // Initial fragment navigation can otherwise steal focus after the module runs.
    if (document.readyState === 'complete') start(goal);
    else window.addEventListener('load', () => requestAnimationFrame(() => start(goal)), { once: true });
  }
}
