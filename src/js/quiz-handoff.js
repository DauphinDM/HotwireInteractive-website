import { createWebsiteBrief } from './website-recommendation.js';

const STORAGE_KEY = 'hotwire-website-brief';
const MAX_AGE = 10 * 60 * 1000;

// Only the four quiz answers are transferred, after an explicit user action.
// Never store contact details, and consume the transfer once in the same tab.
export function saveQuizHandoff(answers) {
  if (!createWebsiteBrief(answers)) return false;
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ answers, createdAt: Date.now() }));
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
    const { answers, createdAt } = JSON.parse(raw);
    const age = Date.now() - createdAt;
    if (!Number.isFinite(age) || age < 0 || age > MAX_AGE) return '';
    return createWebsiteBrief(answers) || '';
  } catch {
    return '';
  }
}
