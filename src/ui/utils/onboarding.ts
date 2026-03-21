const VISITED_KEY = 'chess-gold-visited';
const HINTS_DISMISSED_KEY = 'chess-gold-hints-dismissed';

export function isFirstVisit(): boolean {
  return !localStorage.getItem(VISITED_KEY);
}

export function markVisited(): void {
  localStorage.setItem(VISITED_KEY, '1');
}

export function areHintsDismissed(): boolean {
  return !!localStorage.getItem(HINTS_DISMISSED_KEY);
}

export function dismissHints(): void {
  localStorage.setItem(HINTS_DISMISSED_KEY, '1');
}
