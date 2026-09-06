// Plan controller: create/edit/pause/resume/complete plans and manage
// the recurring tasks they generate.
const store = require('../services/dataStore');
const { generateTasksForPlan } = require('../services/taskGenerator');
const { todayISO, shiftDate } = require('../utils/dateUtils');
const { sameId, clampExp } = require('../utils/serializers');
const asyncHandler = require('../utils/asyncHandler');

const CATEGORIES = ['study', 'workout', 'personal', 'other'];
const FREQUENCIES = ['daily', 'specific-days', 'weekly'];
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

// How many days ahead tasks are generated in one go (rolling window).
// Keeps open-ended plans light; POST /:id/generate can always extend it.
const GENERATION_HORIZON_DAYS = 90;

// ── Normalization helpers ──────────────────────────────────────────────────
function normalizeRule(raw, index) {
  const days = Array.isArray(raw.daysOfWeek)
    ? [...new Set(raw.daysOfWeek.map(Number).filter((n) => n >= 0 && n <= 6))].sort()
    : [];
  return {
    rid: raw.rid || `r${index + 1}`,
    title: String(raw.title || '').trim(),
    description: String(raw.description || ''),
    category: CATEGORIES.includes(raw.category) ? raw.category : 'other',
    frequency: FREQUENCIES.includes(raw.frequency) ? raw.frequency : 'daily',
    daysOfWeek: days,
    expReward: clampExp(raw.expReward),
    startDate: DATE_PATTERN.test(raw.startDate || '') ? raw.startDate : '',
    endDate: DATE_PATTERN.test(raw.endDate || '') ? raw.endDate : '',
  };
}

function normalizePlanFields(body) {
  return {
    title: String(body.title || '').trim(),
    goal: String(body.goal || '').trim(),
    description: String(body.description || ''),
    startDate: DATE_PATTERN.test(body.startDate || '') ? body.startDate : todayISO(),
    endDate: body.endDate && DATE_PATTERN.test(body.endDate) ? body.endDate : '',
  };
}

// The window [from, to] in which tasks get generated right now.
function generationWindow(plan, todayIso) {
  const horizon = shiftDate(todayIso, GENERATION_HORIZON_DAYS);
  const from = plan.startDate && plan.startDate > todayIso ? plan.startDate : todayIso;
  const to = plan.endDate && plan.endDate < horizon ? plan.endDate : horizon;
  return { from, to: from <= to ? to : from };
}

// Attaches progress numbers (total/completed tasks) for the plan cards.
async function attachStats(plan) {
  const [totalTasks, completedTasks] = await Promise.all([
    store.tasks.countWhere({ planId: plan._id }),
    store.tasks.countWhere({ planId: plan._id, completed: true }),
  ]);
  return { ...plan, totalTasks, completedTasks };
}

async function findOwnPlan(req, res) {
  const plan = await store.plans.findById(req.params.id);
  if (!plan || !sameId(plan.userId, req.user._id)) {
    res.status(404).json({ message: 'Plan not found.' });
    return null;
  }
  return plan;
}

// ── Routes ─────────────────────────────────────────────────────────────────

// GET /api/plans
const getPlans = asyncHandler(async (req, res) => {
  const userPlans = await store.plans.find({ userId: req.user._id });
  const withStats = await Promise.all(userPlans.map(attachStats));
  res.json({ plans: withStats });
});

// GET /api/plans/:id
const getPlan = asyncHandler(async (req, res) => {
  const plan = await findOwnPlan(req, res);
  if (!plan) return;
  res.json({ plan: await attachStats(plan) });
});

// POST /api/plans — creates the plan AND generates its first tasks.
const createPlan = asyncHandler(async (req, res) => {
  const fields = normalizePlanFields(req.body);
  if (!fields.title) return res.status(400).json({ message: 'Plan title is required.' });

  const rules = (Array.isArray(req.body.rules) ? req.body.rules : [])
    .map(normalizeRule)
    .filter((r) => r.title);

  const plan = await store.plans.create({
    ...fields,
    rules,
    isActive: true,
    status: 'active',
    userId: req.user._id,
  });

  const { from, to } = generationWindow(plan, todayISO());
  const tasksCreated = await generateTasksForPlan(plan, from, to);

  res.status(201).json({ plan: await attachStats(plan), tasksCreated });
});

// PUT /api/plans/:id
// Handles two kinds of updates:
//   1. Status actions: { action: 'pause' | 'resume' | 'complete' }
//   2. Full edits: plan fields + rules + how far the edit should reach
//      (applyTo: 'future' [default, safe] or 'all').
//
// Completed tasks are NEVER touched — history is sacred.
const updatePlan = asyncHandler(async (req, res) => {
  const plan = await findOwnPlan(req, res);
  if (!plan) return;

  // The client tells us its "today" so timezone differences can't cause
  // today's tasks to be treated as past or future.
  const cutoff = DATE_PATTERN.test((req.body || {}).clientToday || '')
    ? req.body.clientToday
    : todayISO();

  const { action } = req.body;

  if (action === 'pause' || action === 'resume' || action === 'complete') {
    if (action === 'pause') {
      await store.plans.updateById(plan._id, { isActive: false, status: 'paused' });
      // A paused plan stops generating tasks; upcoming uncompleted ones go away.
      await store.tasks.deleteWhere({ planId: plan._id, completed: false, date: { $gte: cutoff } });
    } else if (action === 'resume') {
      const updated = await store.plans.updateById(plan._id, { isActive: true, status: 'active' });
      const { from, to } = generationWindow(updated, cutoff);
      await generateTasksForPlan(updated, from, to);
    } else {
      await store.plans.updateById(plan._id, { isActive: false, status: 'completed' });
      await store.tasks.deleteWhere({ planId: plan._id, completed: false, date: { $gte: cutoff } });
    }
    const fresh = await store.plans.findById(plan._id);
    return res.json({ plan: await attachStats(fresh) });
  }

  // ── Full edit ──
  const fields = normalizePlanFields(req.body);
  if (!fields.title) return res.status(400).json({ message: 'Plan title is required.' });

  const applyTo = req.body.applyTo === 'all' ? 'all' : 'future';

  // Remove unfinished generated tasks, then regenerate from the new rules.
  const deleteQuery = { planId: plan._id, completed: false };
  if (applyTo === 'future') deleteQuery.date = { $gte: cutoff };
  const tasksDeleted = await store.tasks.deleteWhere(deleteQuery);

  const rawRules = Array.isArray(req.body.rules) ? req.body.rules : plan.rules;
  const rules = rawRules.map(normalizeRule).filter((r) => r.title);
  const updated = await store.plans.updateById(plan._id, { ...fields, rules });

  const { from, to } = generationWindow(updated, cutoff);
  const tasksCreated = await generateTasksForPlan(updated, from, to);

  res.json({ plan: await attachStats(updated), tasksDeleted, tasksCreated, applyTo });
});

// DELETE /api/plans/:id
const deletePlan = asyncHandler(async (req, res) => {
  const plan = await findOwnPlan(req, res);
  if (!plan) return;

  // Upcoming & unfinished tasks go with the plan…
  await store.tasks.deleteWhere({ planId: plan._id, completed: false });
  // …but completed tasks stay as history (detached from the deleted plan).
  await store.tasks.updateWhere({ planId: plan._id }, { planId: null, planRuleId: null });
  await store.plans.deleteById(plan._id);

  res.json({ message: 'Plan deleted.' });
});

// POST /api/plans/:id/generate — top up the rolling window with fresh tasks.
const regeneratePlan = asyncHandler(async (req, res) => {
  const plan = await findOwnPlan(req, res);
  if (!plan) return;
  if (plan.status === 'paused') {
    return res.status(400).json({ message: 'Resume the plan before generating tasks.' });
  }

  const { from, to } = generationWindow(plan, todayISO());
  const tasksCreated = await generateTasksForPlan(plan, from, to);
  res.json({ plan: await attachStats(plan), tasksCreated });
});

module.exports = { getPlans, getPlan, createPlan, updatePlan, deletePlan, regeneratePlan };
