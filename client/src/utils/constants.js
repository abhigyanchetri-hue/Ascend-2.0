// Shared UI constants used across pages and components.

// Task categories in display order (also used by the server).
export const CATEGORIES = [
  { value: 'study', label: 'Study', emoji: '📚' },
  { value: 'workout', label: 'Workout', emoji: '🏋️' },
  { value: 'personal', label: 'Personal', emoji: '🌱' },
  { value: 'other', label: 'Other', emoji: '📌' },
];

export function categoryMeta(value) {
  return CATEGORIES.find((c) => c.value === value) || CATEGORIES[CATEGORIES.length - 1];
}

// Weekdays in Monday-first order (0 = Sunday, matching JS getDay()).
export const WEEKDAYS_MON_FIRST = [
  { value: 1, label: 'Mon' },
  { value: 2, label: 'Tue' },
  { value: 3, label: 'Wed' },
  { value: 4, label: 'Thu' },
  { value: 5, label: 'Fri' },
  { value: 6, label: 'Sat' },
  { value: 0, label: 'Sun' },
];

// Heatmap shades. "empty" follows the theme via a CSS variable so it stays
// subtle in dark mode too; the three greens read well on both themes.
export const HEAT_COLORS = {
  empty: 'var(--c-heat-empty)',
  l1: '#C6E48B',
  l2: '#7BC96F',
  l3: '#239A3B',
};

// Maps completed-task count → heatmap shade.
export function heatLevel(completedCount) {
  if (completedCount >= 5) return 'l3';
  if (completedCount >= 3) return 'l2';
  if (completedCount >= 1) return 'l1';
  return 'empty';
}
