// Date helpers for the frontend. All dates are handled as local 'YYYY-MM-DD'
// strings — the same format the server stores.

export const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const MONTH_SHORT = MONTH_NAMES.map((m) => m.slice(0, 3));

const WEEKDAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export function toISODate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function todayISO() {
  return toISODate(new Date());
}

export function shiftDate(dateIso, days) {
  const [year, month, day] = dateIso.split('-').map(Number);
  return toISODate(new Date(year, month - 1, day + days));
}

// 0 = Sunday … 6 = Saturday
export function weekdayOf(dateIso) {
  const [year, month, day] = dateIso.split('-').map(Number);
  return new Date(year, month - 1, day).getDay();
}

export function monthIndexOf(dateIso) {
  return Number(dateIso.slice(5, 7)) - 1;
}

// "Sep 15, 2026"
export function prettyDate(dateIso) {
  const [year, month, day] = dateIso.split('-').map(Number);
  return `${MONTH_SHORT[month - 1]} ${day}, ${year}`;
}

// "Monday, Sep 15"
export function prettyDateWithWeekday(dateIso) {
  const [year, month, day] = dateIso.split('-').map(Number);
  const weekday = WEEKDAY_NAMES[new Date(year, month - 1, day).getDay()];
  return `${weekday}, ${MONTH_SHORT[month - 1]} ${day}`;
}

// First and last day of a month as ISO strings.
export function monthRange(year, monthIndex) {
  const lastDay = new Date(year, monthIndex + 1, 0).getDate();
  const pad = (n) => String(n).padStart(2, '0');
  return {
    first: `${year}-${pad(monthIndex + 1)}-01`,
    last: `${year}-${pad(monthIndex + 1)}-${pad(lastDay)}`,
  };
}

// A month as 6 rows × 7 cols (Monday-first) of ISO date strings;
// cells outside the month are null.
export function getMonthMatrix(year, monthIndex) {
  const offset = (new Date(year, monthIndex, 1).getDay() + 6) % 7; // days since Monday
  const rows = [];
  for (let row = 0; row < 6; row += 1) {
    const week = [];
    for (let col = 0; col < 7; col += 1) {
      const cellDate = new Date(year, monthIndex, 1 - offset + row * 7 + col);
      const iso = toISODate(cellDate);
      week.push(Number(iso.slice(5, 7)) - 1 === monthIndex ? iso : null);
    }
    rows.push(week);
  }
  return rows;
}

// "Sep 2026 → Feb 2027", or "Ongoing" when there is no end date.
export function dateRangeLabel(startIso, endIso) {
  const label = (iso) => {
    const [year, month] = iso.split('-').map(Number);
    return `${MONTH_SHORT[month - 1]} ${year}`;
  };
  if (!endIso) return `${label(startIso)} → Ongoing`;
  return `${label(startIso)} → ${label(endIso)}`;
}

// Time-of-day greeting for the Home page.
export function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}
