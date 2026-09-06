// Small date helpers used across the server.
//
// IMPORTANT DESIGN CHOICE: task dates are stored as 'YYYY-MM-DD' strings
// (not JS Date objects). A task simply "belongs to a day", and plain strings
// avoid classic timezone off-by-one bugs when comparing days.

function toISODate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function todayISO() {
  return toISODate(new Date());
}

// Returns a new 'YYYY-MM-DD' string shifted by N days (negative = into the past).
function shiftDate(dateIso, days) {
  const [year, month, day] = dateIso.split('-').map(Number);
  const shifted = new Date(year, month - 1, day + days);
  return toISODate(shifted);
}

// Day of week for a date string: 0 = Sunday … 6 = Saturday.
function weekdayOf(dateIso) {
  const [year, month, day] = dateIso.split('-').map(Number);
  return new Date(year, month - 1, day).getDay();
}

module.exports = { toISODate, todayISO, shiftDate, weekdayOf };
