// Turns Plans into real, dated task documents.
//
// A plan holds "rules" like "Study Maths — daily, +20 EXP". This module
// expands each rule into individual tasks on the correct days, so the Home
// page always has fresh tasks waiting.
//
// Safety rails:
//   - Generation happens in a rolling window (see planController), so an
//     open-ended plan never creates thousands of tasks at once.
//   - Existing tasks are never duplicated (we skip dates that already have
//     that rule's task), so it is always safe to run generation again.
const { tasks } = require('./dataStore');
const { shiftDate, weekdayOf } = require('../utils/dateUtils');

const MAX_TASKS_PER_GENERATION = 400;

// Is this recurring-task rule scheduled on the given day?
function isRuleDueOn(rule, dateIso) {
  if (rule.startDate && dateIso < rule.startDate) return false;
  if (rule.endDate && dateIso > rule.endDate) return false;

  const weekday = weekdayOf(dateIso); // 0 = Sunday … 6 = Saturday
  if (rule.frequency === 'daily') return true;
  if (rule.frequency === 'specific-days') return rule.daysOfWeek.includes(weekday);
  if (rule.frequency === 'weekly') {
    return rule.daysOfWeek.length > 0 && rule.daysOfWeek[0] === weekday;
  }
  return false;
}

// Creates the task documents for a plan between fromIso and toIso (inclusive).
// Returns how many tasks were created.
async function generateTasksForPlan(plan, fromIso, toIso) {
  let created = 0;

  for (const rule of plan.rules || []) {
    // Respect each rule's own start/end window on top of the plan window.
    let cursor = fromIso;
    if (rule.startDate && rule.startDate > fromIso) cursor = rule.startDate;

    while (cursor <= toIso && created < MAX_TASKS_PER_GENERATION) {
      if (isRuleDueOn(rule, cursor)) {
        const existing = await tasks.findOne({
          userId: plan.userId,
          planId: plan._id,
          planRuleId: rule.rid,
          date: cursor,
        });
        if (!existing) {
          await tasks.create({
            title: rule.title,
            description: rule.description || '',
            category: rule.category,
            date: cursor,
            completed: false,
            expReward: rule.expReward,
            planId: plan._id,
            planRuleId: rule.rid,
            planTitle: plan.title,
            userId: plan.userId,
          });
          created += 1;
        }
      }
      cursor = shiftDate(cursor, 1);
    }
  }

  return created;
}

module.exports = { generateTasksForPlan, isRuleDueOn };
