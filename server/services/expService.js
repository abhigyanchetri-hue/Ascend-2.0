// The heart of Ascend's gamification: EXP, levels, streaks, bonuses.
//
// Design principle from the product spec: keep it transparent.
// The user should always be able to see exactly how much EXP they have
// and how much the next level needs. No hidden mechanics.
const { tasks, users } = require('./dataStore');
const { shiftDate } = require('../utils/dateUtils');

// ── Constants (mirrored in client/src/utils/expCalculator.js) ──────────────
const EXP_PER_TASK = 20;
const ALL_DONE_BONUS = 30; // completing every task in a day
const STREAK_WEEK_BONUS = 50; // hitting a multiple of 7 streak days
const STREAK_MONTH_BONUS = 200; // hitting a multiple of 30 streak days

// EXP required to go from `level` to `level + 1` (100, 150, 225, 337, …).
function expForLevel(level) {
  return Math.floor(100 * Math.pow(1.5, level - 1));
}

// Fun titles shown next to the level number.
function levelTitle(level) {
  if (level >= 50) return 'Legend';
  if (level >= 36) return 'Ascendant';
  if (level >= 21) return 'Achiever';
  if (level >= 11) return 'Climber';
  if (level >= 6) return 'Builder';
  return 'Seedling';
}

// Converts lifetime EXP into { level, currentExp }.
// Example: 475 total EXP → level 4 with 0 current EXP
// (100 to reach L2, +150 for L3, +225 for L4).
function recalculateLevel(totalExp) {
  let level = 1;
  let remaining = totalExp;
  while (remaining >= expForLevel(level)) {
    remaining -= expForLevel(level);
    level += 1;
  }
  return { level, currentExp: remaining };
}

// ── One-time bonus bookkeeping ─────────────────────────────────────────────
// awardedBonusKeys remembers which bonuses a user already earned, so ticking
// a task off and on again can never farm the same bonus twice.
const hasBonusKey = (user, key) => user.awardedBonusKeys.includes(key);
const addBonusKey = (user, key) => {
  if (!hasBonusKey(user, key)) user.awardedBonusKeys.push(key);
};
const removeBonusKey = (user, key) => {
  user.awardedBonusKeys = user.awardedBonusKeys.filter((k) => k !== key);
};

// ── Streaks ────────────────────────────────────────────────────────────────
// A user's streak = consecutive days (ending today, or yesterday if today
// has no completed task yet) with at least one completed task.
async function recomputeStreak(userId, todayIso) {
  const doneTasks = await tasks.find({ userId, completed: true });
  const doneDates = new Set(doneTasks.map((t) => t.date));

  let cursor = todayIso;
  if (!doneDates.has(cursor)) {
    cursor = shiftDate(todayIso, -1);
    if (!doneDates.has(cursor)) return 0; // streak broken
  }

  let streak = 0;
  while (doneDates.has(cursor)) {
    streak += 1;
    cursor = shiftDate(cursor, -1);
  }
  return streak;
}

// ── The main event: what happens when a task is ticked/unticked ────────────
// Called by the task controller AFTER the task's `completed` flag was flipped.
// Awards EXP, checks the day-complete bonus, updates the streak (with weekly /
// monthly bonuses), recalculates the level, and saves the user.
// Returns everything the client needs for instant, calm feedback.
async function applyTaskToggleEffects(user, task, todayIso) {
  const beforeLevel = user.level;
  const bonuses = [];
  let expDelta = 0;
  const dayKey = `day-${task.date}`;

  // 1. Base EXP for the task itself (+20 when ticked, −20 when unticked).
  if (task.completed) {
    expDelta += task.expReward;

    // 2. "All tasks done today" bonus (+30), only once per day.
    const dayTasks = await tasks.find({ userId: user._id, date: task.date });
    const allDone = dayTasks.length > 0 && dayTasks.every((t) => t.completed);
    if (allDone && !hasBonusKey(user, dayKey)) {
      expDelta += ALL_DONE_BONUS;
      addBonusKey(user, dayKey);
      bonuses.push({ reason: 'All tasks done for the day', amount: ALL_DONE_BONUS });
    }
  } else {
    expDelta -= task.expReward;

    // Unticking can undo the day bonus if the day is no longer complete.
    const dayTasks = await tasks.find({ userId: user._id, date: task.date });
    const stillAllDone = dayTasks.length > 0 && dayTasks.every((t) => t.completed);
    if (!stillAllDone && hasBonusKey(user, dayKey)) {
      expDelta -= ALL_DONE_BONUS;
      removeBonusKey(user, dayKey);
      bonuses.push({ reason: 'Day no longer complete — bonus removed', amount: -ALL_DONE_BONUS });
    }
  }

  // 3. Streak update + streak bonuses.
  const streak = await recomputeStreak(user._id, todayIso);
  if (task.completed && streak > user.streak) {
    if (streak % 7 === 0) {
      const key = `streak7-${streak}-${task.date}`;
      if (!hasBonusKey(user, key)) {
        expDelta += STREAK_WEEK_BONUS;
        addBonusKey(user, key);
        bonuses.push({ reason: `${streak}-day streak!`, amount: STREAK_WEEK_BONUS });
      }
    }
    if (streak % 30 === 0) {
      const key = `streak30-${streak}-${task.date}`;
      if (!hasBonusKey(user, key)) {
        expDelta += STREAK_MONTH_BONUS;
        addBonusKey(user, key);
        bonuses.push({ reason: `${streak}-day streak!`, amount: STREAK_MONTH_BONUS });
      }
    }
  }

  // 4. Save it all: EXP, level, streak.
  user.streak = streak;
  if (streak > user.longestStreak) user.longestStreak = streak;
  user.totalExp = Math.max(0, user.totalExp + expDelta);

  const { level, currentExp } = recalculateLevel(user.totalExp);
  user.level = level;
  user.currentExp = currentExp;

  const updatedUser = await users.updateById(user._id, {
    totalExp: user.totalExp,
    currentExp: user.currentExp,
    level: user.level,
    streak: user.streak,
    longestStreak: user.longestStreak,
    awardedBonusKeys: user.awardedBonusKeys,
  });

  return {
    expDelta,
    bonuses,
    leveledUp: level > beforeLevel,
    user: updatedUser,
  };
}

// ── Used by the seed script ────────────────────────────────────────────────
// Rebuilds a user's stats from scratch based on the tasks that exist.
// This keeps demo data internally consistent (level actually matches history).
async function rebuildUserStatsFromTasks(userId, todayIso) {
  const allTasks = await tasks.find({ userId });
  const completedTasks = allTasks.filter((t) => t.completed);

  let totalExp = completedTasks.reduce((sum, t) => sum + t.expReward, 0);

  const completedByDate = {};
  const allByDate = {};
  for (const t of allTasks) {
    (allByDate[t.date] = allByDate[t.date] || []).push(t);
    if (t.completed) (completedByDate[t.date] = completedByDate[t.date] || []).push(t);
  }

  // +30 for every fully-completed day.
  for (const date of Object.keys(completedByDate)) {
    const dayFullyDone = allByDate[date].every((t) => t.completed);
    if (dayFullyDone) totalExp += ALL_DONE_BONUS;
  }

  // Walk the completed days in order to measure streak runs (+50 per week
  // reached, +200 per month reached) and the longest streak.
  const dates = Object.keys(completedByDate).sort();
  let run = 0;
  let previous = null;
  let longest = 0;
  for (const date of dates) {
    run = previous && shiftDate(previous, 1) === date ? run + 1 : 1;
    if (run % 7 === 0) totalExp += STREAK_WEEK_BONUS;
    if (run % 30 === 0) totalExp += STREAK_MONTH_BONUS;
    if (run > longest) longest = run;
    previous = date;
  }

  // Current streak only counts if the run reaches today or yesterday.
  let streak = 0;
  const lastDate = dates[dates.length - 1];
  if (lastDate === todayIso || lastDate === shiftDate(todayIso, -1)) {
    streak = run;
  }

  const { level, currentExp } = recalculateLevel(totalExp);
  return { totalExp, currentExp, level, streak, longestStreak: Math.max(longest, streak) };
}

module.exports = {
  EXP_PER_TASK,
  ALL_DONE_BONUS,
  STREAK_WEEK_BONUS,
  STREAK_MONTH_BONUS,
  expForLevel,
  levelTitle,
  recalculateLevel,
  applyTaskToggleEffects,
  rebuildUserStatsFromTasks,
};
