import { WEBSITE_QUESTIONS, createWebsiteBrief } from './website-recommendation.js';
import { getTemplate, templateBrief } from './templates.js';

const STORAGE_KEY = 'hotwire-website-brief';
const MAX_AGE = 10 * 60 * 1000;

// Only validated quiz choices and an optional design ID transfer after an explicit action.
// Never store contact details, and consume the transfer once in the same tab.
export function saveQuizHandoff(answers, templateId) {
  if (!createWebsiteBrief(answers)) return false;
  try {
    const choices = Object.fromEntries(WEBSITE_QUESTIONS.map(({ id }) => [id, answers[id]]));
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ answers: choices, templateId: getTemplate(templateId)?.id, createdAt: Date.now() }));
    return true;
  } catch {
    return false;
  }
}

export function takeQuizHandoff() {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    sessionStorage.removeItem(STORAGE_KEY);
    if (!raw) return '';
    const { answers, templateId, createdAt } = JSON.parse(raw);
    const age = Date.now() - createdAt;
    if (!Number.isFinite(age) || age < 0 || age > MAX_AGE) return '';
    const brief = createWebsiteBrief(answers);
    return brief ? [brief, templateBrief(templateId)].filter(Boolean).join('\n\n') : '';
  } catch {
    return '';
  }
}
