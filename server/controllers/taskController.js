// Task controller: CRUD + the completion toggle (where EXP is awarded).
const store = require('../services/dataStore');
const { applyTaskToggleEffects } = require('../services/expService');
const { publicUser, sameId, clampExp } = require('../utils/serializers');
const { todayISO } = require('../utils/dateUtils');
const asyncHandler = require('../utils/asyncHandler');

const CATEGORIES = ['study', 'workout', 'personal', 'other'];
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

// GET /api/tasks?date=2026-09-06
// Also supports ?from=&to= (calendar page) and ?planId= (plan task preview).
const listTasks = asyncHandler(async (req, res) => {
  const query = { userId: req.user._id };
  const { date, from, to, planId } = req.query;

  if (date) {
    query.date = date;
  } else if (from || to) {
    query.date = {};
    if (from) query.date.$gte = from;
    if (to) query.date.$lte = to;
  }
  if (planId) query.planId = planId;

  const found = await store.tasks.find(query, { sort: 'date' });
  res.json({ tasks: found });
});

// POST /api/tasks
const createTask = asyncHandler(async (req, res) => {
  const { title, description = '', category = 'other', date, expReward = 20 } = req.body;

  if (!title || !String(title).trim()) {
    return res.status(400).json({ message: 'Task title is required.' });
  }
  if (!date || !DATE_PATTERN.test(date)) {
    return res.status(400).json({ message: 'A valid date (YYYY-MM-DD) is required.' });
  }
  if (!CATEGORIES.includes(category)) {
    return res.status(400).json({ message: 'Unknown category.' });
  }

  const task = await store.tasks.create({
    title: String(title).trim(),
    description: String(description),
    category,
    date,
    completed: false,
    expReward: clampExp(expReward),
    planId: null,
    planRuleId: null,
    planTitle: null,
    userId: req.user._id,
  });

  res.status(201).json({ task });
});

// Helper used by update/delete/toggle: fetch the task and check ownership.
async function findOwnTask(req, res) {
  const task = await store.tasks.findById(req.params.id);
  if (!task || !sameId(task.userId, req.user._id)) {
    res.status(404).json({ message: 'Task not found.' });
    return null;
  }
  return task;
}

// PUT /api/tasks/:id
const updateTask = asyncHandler(async (req, res) => {
  const task = await findOwnTask(req, res);
  if (!task) return;

  const allowed = ['title', 'description', 'category', 'date', 'expReward'];
  const patch = {};
  for (const field of allowed) {
    if (req.body[field] !== undefined) patch[field] = req.body[field];
  }
  if (patch.title !== undefined && !String(patch.title).trim()) {
    return res.status(400).json({ message: 'Task title is required.' });
  }
  if (patch.expReward !== undefined) patch.expReward = clampExp(patch.expReward);

  const updated = await store.tasks.updateById(task._id, patch);
  res.json({ task: updated });
});

// DELETE /api/tasks/:id
const deleteTask = asyncHandler(async (req, res) => {
  const task = await findOwnTask(req, res);
  if (!task) return;

  await store.tasks.deleteById(task._id);
  res.json({ message: 'Task deleted.' });
});

// PATCH /api/tasks/:id/complete — the "tick" endpoint.
// Flips completion, then awards/revokes EXP, bonuses, and updates the streak.
const toggleComplete = asyncHandler(async (req, res) => {
  const task = await findOwnTask(req, res);
  if (!task) return;

  const updatedTask = await store.tasks.updateById(task._id, { completed: !task.completed });

  // The client sends its own "today" so streaks stay correct even if the
  // server sits in a different timezone than the user.
  const today = DATE_PATTERN.test((req.body || {}).today || '') ? req.body.today : todayISO();

  const result = await applyTaskToggleEffects(req.user, updatedTask, today);

  res.json({
    task: updatedTask,
    user: publicUser(result.user),
    expDelta: result.expDelta,
    bonuses: result.bonuses,
    leveledUp: result.leveledUp,
  });
});

module.exports = { listTasks, createTask, updateTask, deleteTask, toggleComplete };
