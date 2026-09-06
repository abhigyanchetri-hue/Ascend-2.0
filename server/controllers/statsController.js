// Stats controller: powers the calendar heatmap, day popups, and profile.
const store = require('../services/dataStore');
const { publicUser } = require('../utils/serializers');
const { todayISO, shiftDate } = require('../utils/dateUtils');
const asyncHandler = require('../utils/asyncHandler');

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

// GET /api/stats/heatmap — per-day summaries for the last 365 days.
// Only PAST days (up to today) are returned; the client fills the gaps.
const heatmap = asyncHandler(async (req, res) => {
  const today = todayISO();
  const start = shiftDate(today, -364);
  const rows = await store.tasks.find(
    { userId: req.user._id, date: { $gte: start, $lte: today } },
    { sort: 'date' }
  );

  const byDate = {};
  for (const task of rows) {
    if (!byDate[task.date]) {
      byDate[task.date] = { date: task.date, total: 0, completed: 0, expEarned: 0, tasks: [] };
    }
    const day = byDate[task.date];
    day.total += 1;
    if (task.completed) {
      day.completed += 1;
      day.expEarned += task.expReward;
    }
    // Keep a few task titles per day so hover popups are instant (no extra fetch).
    if (day.tasks.length < 6) {
      day.tasks.push({ title: task.title, category: task.category, completed: task.completed });
    }
  }

  const days = Object.values(byDate).sort((a, b) => (a.date < b.date ? -1 : 1));
  res.json({ days });
});

// GET /api/stats/summary — everything the Profile page shows.
const summary = asyncHandler(async (req, res) => {
  const today = todayISO();
  const [totalTasksCompleted, activePlans, todayTasks] = await Promise.all([
    store.tasks.countWhere({ userId: req.user._id, completed: true }),
    store.plans.countWhere({ userId: req.user._id, isActive: true }),
    store.tasks.find({ userId: req.user._id, date: today }),
  ]);

  res.json({
    user: publicUser(req.user),
    totalTasksCompleted,
    activePlans,
    todayTotal: todayTasks.length,
    todayCompleted: todayTasks.filter((t) => t.completed).length,
  });
});

// GET /api/stats/day/:date — full detail for one day (hover/click popups).
const dayDetail = asyncHandler(async (req, res) => {
  const date = req.params.date;
  if (!DATE_PATTERN.test(date)) {
    return res.status(400).json({ message: 'Use the YYYY-MM-DD date format.' });
  }

  const dayTasks = await store.tasks.find({ userId: req.user._id, date }, { sort: 'createdAt' });
  const completedTasks = dayTasks.filter((t) => t.completed);

  res.json({
    date,
    tasks: dayTasks,
    total: dayTasks.length,
    completed: completedTasks.length,
    expEarned: completedTasks.reduce((sum, t) => sum + t.expReward, 0),
  });
});

module.exports = { heatmap, summary, dayDetail };
