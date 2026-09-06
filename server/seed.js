// Demo seed — creates a sample account with ~70 days of history, two plans,
// and today's tasks partially done. Perfect for demos and screenshots.
//
// Runs automatically on first boot (JSON mode) or manually: `npm run seed`.
//
// Demo login:  rahul@ascend.app  /  demo1234
require('dotenv').config();

const bcrypt = require('bcryptjs');
const store = require('./services/dataStore');
const jsonStore = require('./services/jsonStore');
const { rebuildUserStatsFromTasks } = require('./services/expService');
const { todayISO, shiftDate, weekdayOf } = require('./utils/dateUtils');
const { generateTasksForPlan } = require('./services/taskGenerator');

const DEMO_EMAIL = 'rahul@ascend.app';
const DEMO_PASSWORD = 'demo1234';
const HISTORY_DAYS = 70;

// Deterministic pseudo-random (0..1) so the demo data looks the same
// every single time — curated, not chaotic.
function pseudoRandom(seed) {
  const x = Math.sin(seed * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

// Is a plan rule due on this date? (mirrors taskGenerator.isRuleDueOn)
function isRuleDueOn(rule, dateIso) {
  if (rule.startDate && dateIso < rule.startDate) return false;
  if (rule.endDate && dateIso > rule.endDate) return false;
  const weekday = weekdayOf(dateIso);
  if (rule.frequency === 'daily') return true;
  if (rule.frequency === 'specific-days') return rule.daysOfWeek.includes(weekday);
  if (rule.frequency === 'weekly') return rule.daysOfWeek.length > 0 && rule.daysOfWeek[0] === weekday;
  return false;
}

async function seedDemoData() {
  const today = todayISO();
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);

  // ── 1. Demo user ─────────────────────────────────────────────────────────
  const user = await store.users.create({
    name: 'Rahul Sharma',
    email: DEMO_EMAIL,
    password: passwordHash,
    level: 1,
    totalExp: 0,
    currentExp: 0,
    streak: 0,
    longestStreak: 0,
    awardedBonusKeys: [],
  });
  const userId = user._id;

  // ── 2. Two sample plans ──────────────────────────────────────────────────
  const gateStart = shiftDate(today, -HISTORY_DAYS);
  const gatePlan = await store.plans.create({
    title: 'GATE 2027 Preparation',
    goal: 'Crack GATE CSE with a top-100 rank',
    description: 'Maths every day, core subjects on alternating days, weekly revision.',
    startDate: gateStart,
    endDate: shiftDate(today, 160),
    isActive: true,
    status: 'active',
    userId,
    rules: [
      { rid: 'r1', title: 'Solve 20 math problems', description: '', category: 'study', frequency: 'daily', daysOfWeek: [], expReward: 20, startDate: gateStart, endDate: '' },
      { rid: 'r2', title: 'Read one OS chapter', description: '', category: 'study', frequency: 'specific-days', daysOfWeek: [1, 3, 5], expReward: 20, startDate: gateStart, endDate: '' },
      { rid: 'r3', title: 'Weekly revision of weak topics', description: '', category: 'study', frequency: 'weekly', daysOfWeek: [0], expReward: 25, startDate: gateStart, endDate: '' },
    ],
  });

  const fitStart = shiftDate(today, -45);
  const fitnessPlan = await store.plans.create({
    title: 'Fitness Journey',
    goal: 'Build a consistent workout habit',
    description: 'A run every day, strength training three times a week.',
    startDate: fitStart,
    endDate: '',
    isActive: true,
    status: 'active',
    userId,
    rules: [
      { rid: 'r1', title: '30 min morning run', description: '', category: 'workout', frequency: 'daily', daysOfWeek: [], expReward: 20, startDate: fitStart, endDate: '' },
      { rid: 'r2', title: 'Strength training', description: '', category: 'workout', frequency: 'specific-days', daysOfWeek: [2, 4, 6], expReward: 25, startDate: fitStart, endDate: '' },
    ],
  });

  const allRules = [
    ...gatePlan.rules.map((r) => ({ ...r, plan: gatePlan })),
    ...fitnessPlan.rules.map((r) => ({ ...r, plan: fitnessPlan })),
  ];

  // ── 3. History: expand the plan rules across the last N days ─────────────
  for (let daysAgo = HISTORY_DAYS; daysAgo >= 1; daysAgo -= 1) {
    const date = shiftDate(today, -daysAgo);
    const weekday = weekdayOf(date);

    // Occasional rest day (never inside the current 12-day streak window).
    if (daysAgo > 14 && pseudoRandom(daysAgo * 7 + 3) < 0.08) continue;

    for (let i = 0; i < allRules.length; i += 1) {
      const rule = allRules[i];
      if (date < rule.plan.startDate) continue;
      if (!isRuleDueOn(rule, date)) continue;

      // Complete ~75% of tasks (a bit more on weekends). Inside the last
      // 12 days, always complete — that's the live streak.
      const threshold = weekday === 0 || weekday === 6 ? 0.85 : 0.75;
      const completed = daysAgo <= 12 || pseudoRandom(daysAgo * 13 + i * 7 + 1) < threshold;

      await store.tasks.create({
        title: rule.title,
        description: '',
        category: rule.category,
        date,
        completed,
        expReward: rule.expReward,
        planId: rule.plan._id,
        planRuleId: rule.rid,
        planTitle: rule.plan.title,
        userId,
      });
    }

    // A small personal task now and then, for variety in the calendar.
    if (pseudoRandom(daysAgo * 3 + 5) < 0.25) {
      await store.tasks.create({
        title: 'Plan tomorrow in journal',
        description: '',
        category: 'personal',
        date,
        completed: pseudoRandom(daysAgo * 17 + 2) < 0.8,
        expReward: 15,
        planId: null,
        planRuleId: null,
        planTitle: null,
        userId,
      });
    }
  }

  // ── 4. Today + the next 30 days from the plans (rolling window) ──────────
  await generateTasksForPlan(gatePlan, today, shiftDate(today, 30));
  await generateTasksForPlan(fitnessPlan, today, shiftDate(today, 30));

  // One manual personal task so the Home page shows all category types.
  await store.tasks.create({
    title: 'Read 20 pages of Atomic Habits',
    description: '',
    category: 'personal',
    date: today,
    completed: false,
    expReward: 15,
    planId: null,
    planRuleId: null,
    planTitle: null,
    userId,
  });

  // And a quick workout so today mirrors the spec's sample layout (3/5 done).
  await store.tasks.create({
    title: '15 min stretching',
    description: '',
    category: 'workout',
    date: today,
    completed: false,
    expReward: 20,
    planId: null,
    planRuleId: null,
    planTitle: null,
    userId,
  });

  // Today starts half-done: tick off the first few, leave the rest for the demo.
  const todayTasks = await store.tasks.find({ userId, date: today });
  const completeCount = Math.min(3, Math.max(0, todayTasks.length - 2));
  for (const task of todayTasks.slice(0, completeCount)) {
    await store.tasks.updateById(task._id, { completed: true });
  }

  // ── 5. Derive honest stats (level, streak, EXP) from everything above ────
  const stats = await rebuildUserStatsFromTasks(userId, today);
  await store.users.updateById(userId, stats);

  if (store.mode === 'json') jsonStore.saveNow();

  const taskCount = await store.tasks.countWhere({ userId });
  console.log('[seed] Demo account ready → rahul@ascend.app / demo1234');
  console.log(`[seed] Created ${taskCount} tasks across ${HISTORY_DAYS} days of history + upcoming plan tasks.`);
}

// Only seed when the database has no users yet.
async function seedIfEmpty() {
  const existingUsers = await store.users.countWhere({});
  if (existingUsers > 0) {
    console.log('[seed] Existing data found — skipping demo seed.');
    return;
  }
  console.log('[seed] Empty database — creating demo account…');
  await seedDemoData();
}

module.exports = { seedIfEmpty, seedDemoData };

// Allow `npm run seed` as a standalone command.
if (require.main === module) {
  const { connectDatabase } = require('./config/db');
  connectDatabase()
    .then(async () => {
      if (store.mode === 'json') jsonStore.load();
      await seedDemoData();
      process.exit(0);
    })
    .catch((err) => {
      console.error('[seed] Failed:', err.message);
      process.exit(1);
    });
}
