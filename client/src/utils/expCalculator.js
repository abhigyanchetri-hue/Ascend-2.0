// EXP & level math — a mirror of the server's rules (server/services/expService.js).
// The server is the source of truth; this copy exists only so the UI can
// display instant, consistent progress without extra API calls.

export const EXP_PER_TASK = 20;
export const ALL_DONE_BONUS = 30;
export const STREAK_WEEK_BONUS = 50;
export const STREAK_MONTH_BONUS = 200;

// EXP needed to go from `level` to the next one: 100, 150, 225, 337, 506…
export function expForLevel(level) {
  return Math.floor(100 * Math.pow(1.5, level - 1));
}

export function levelTitle(level) {
  if (level >= 50) return 'Legend';
  if (level >= 36) return 'Ascendant';
  if (level >= 21) return 'Achiever';
  if (level >= 11) return 'Climber';
  if (level >= 6) return 'Builder';
  return 'Seedling';
}

// Everything a level badge needs, derived from the user object.
export function levelProgress(user) {
  const expForNext = user.expForNextLevel || expForLevel(user.level);
  const percent = Math.min(100, Math.round((user.currentExp / expForNext) * 100));
  return {
    level: user.level,
    title: user.levelTitle || levelTitle(user.level),
    currentExp: user.currentExp,
    expForNext,
    percent,
  };
}
