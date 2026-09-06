// PlanPage — list, create, edit, pause/resume and complete long-term plans.
// The create/edit form is the two-step flow from the spec: basic info first,
// then the recurring tasks the plan should generate every day.
import { useEffect, useState } from 'react';
import { Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import { api } from '../utils/api';
import { todayISO } from '../utils/dateHelpers';
import { CATEGORIES, WEEKDAYS_MON_FIRST } from '../utils/constants';
import PlanCard from '../components/PlanCard.jsx';

const FREQUENCIES = [
  { value: 'daily', label: 'Daily' },
  { value: 'specific-days', label: 'Specific days' },
  { value: 'weekly', label: 'Weekly' },
];

let ruleKeyCounter = 0;
const nextRuleKey = () => {
  ruleKeyCounter += 1;
  return `rule-${Date.now()}-${ruleKeyCounter}`;
};

const emptyRule = (startDate) => ({
  key: nextRuleKey(),
  rid: null,
  title: '',
  category: 'study',
  frequency: 'daily',
  daysOfWeek: [1],
  expReward: 20,
  startDate,
  endDate: '',
});

// ── The two-step plan form (also used for editing) ──────────────────────────
function PlanForm({ initial, onSave, onCancel, saveLabel }) {
  const [step, setStep] = useState(1);
  const [error, setError] = useState('');
  const [form, setForm] = useState(() =>
    initial
      ? {
          title: initial.title,
          goal: initial.goal || '',
          description: initial.description || '',
          startDate: initial.startDate,
          endDate: initial.endDate || '',
          noEndDate: !initial.endDate,
        }
      : {
          title: '',
          goal: '',
          description: '',
          startDate: todayISO(),
          endDate: '',
          noEndDate: false,
        }
  );
  const [rules, setRules] = useState(() =>
    initial && initial.rules && initial.rules.length > 0
      ? initial.rules.map((rule) => ({ ...rule, key: nextRuleKey() }))
      : [emptyRule(todayISO())]
  );

  const setField = (patch) => setForm((f) => ({ ...f, ...patch }));
  const setRule = (key, patch) =>
    setRules((all) => all.map((rule) => (rule.key === key ? { ...rule, ...patch } : rule)));

  const toggleWeekday = (rule, value) => {
    const has = rule.daysOfWeek.includes(value);
    const next = has
      ? rule.daysOfWeek.filter((d) => d !== value)
      : [...rule.daysOfWeek, value];
    setRule(rule.key, { daysOfWeek: next });
  };

  const goNext = () => {
    if (!form.title.trim()) return setError('Please give your plan a title.');
    if (!form.startDate) return setError('Pick a start date.');
    if (!form.noEndDate && form.endDate && form.endDate < form.startDate) {
      return setError('End date cannot be before the start date.');
    }
    setError('');
    setStep(2);
  };

  const submit = () => {
    for (const rule of rules) {
      if (!rule.title.trim()) return setError('Every task needs a name.');
      if (
        (rule.frequency === 'specific-days' || rule.frequency === 'weekly') &&
        rule.daysOfWeek.length === 0
      ) {
        return setError('Pick at least one day for each scheduled task.');
      }
    }
    setError('');
    onSave({
      title: form.title.trim(),
      goal: form.goal.trim(),
      description: form.description,
      startDate: form.startDate,
      endDate: form.noEndDate ? null : form.endDate || null,
      rules: rules.map(({ key, ...rule }) => ({ ...rule, title: rule.title.trim() })),
    });
  };

  const inputClass =
    'w-full rounded-md border border-line bg-card px-3 py-2 text-sm outline-none transition-colors duration-150 focus:border-forest';
  const labelClass = 'mb-1 block text-[11px] font-semibold uppercase tracking-wide text-muted';

  return (
    <div>
      {/* Step indicator */}
      <div className="mb-4 flex items-center gap-2 text-xs">
        <span className={`rounded-full px-2.5 py-1 font-semibold ${step === 1 ? 'bg-forest text-white' : 'bg-hoverbg text-muted'}`}>
          1 · Basic info
        </span>
        <span className="text-muted">→</span>
        <span className={`rounded-full px-2.5 py-1 font-semibold ${step === 2 ? 'bg-forest text-white' : 'bg-hoverbg text-muted'}`}>
          2 · Tasks
        </span>
      </div>

      {step === 1 && (
        <div className="space-y-3">
          <div>
            <label className={labelClass}>Plan title</label>
            <input className={inputClass} value={form.title} onChange={(e) => setField({ title: e.target.value })} placeholder="GATE 2027 Preparation" />
          </div>
          <div>
            <label className={labelClass}>Goal</label>
            <input className={inputClass} value={form.goal} onChange={(e) => setField({ goal: e.target.value })} placeholder="Crack GATE CSE with a top rank" />
          </div>
          <div className="flex flex-wrap gap-3">
            <div className="min-w-0 flex-1">
              <label className={labelClass}>Start date</label>
              <input type="date" className={inputClass} value={form.startDate} onChange={(e) => setField({ startDate: e.target.value })} />
            </div>
            <div className="min-w-0 flex-1">
              <label className={labelClass}>End date</label>
              <input type="date" className={inputClass} value={form.endDate} disabled={form.noEndDate} onChange={(e) => setField({ endDate: e.target.value })} />
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm text-muted">
            <input type="checkbox" checked={form.noEndDate} onChange={(e) => setField({ noEndDate: e.target.checked })} />
            No end date (open-ended plan)
          </label>
          <div>
            <label className={labelClass}>Description (optional)</label>
            <textarea className={inputClass} rows={2} value={form.description} onChange={(e) => setField({ description: e.target.value })} placeholder="Longer notes about this goal…" />
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-3">
          {rules.map((rule) => (
            <div key={rule.key} className="space-y-2 rounded-md border border-line bg-background p-3">
              <div className="flex gap-2">
                <input
                  className={`${inputClass} min-w-0 flex-1`}
                  value={rule.title}
                  onChange={(e) => setRule(rule.key, { title: e.target.value })}
                  placeholder="Task name, e.g. Study Engineering Mathematics"
                />
                <select
                  className="rounded-md border border-line bg-card px-2 py-2 text-sm outline-none focus:border-forest"
                  value={rule.category}
                  onChange={(e) => setRule(rule.key, { category: e.target.value })}
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat.value} value={cat.value}>{cat.emoji}</option>
                  ))}
                </select>
                {rules.length > 1 && (
                  <button
                    type="button"
                    onClick={() => setRules((all) => all.filter((r) => r.key !== rule.key))}
                    className="rounded-md px-2 text-xs text-danger hover:bg-danger-soft"
                  >
                    ✕
                  </button>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <select
                  className="rounded-md border border-line bg-card px-2 py-1.5 text-xs outline-none focus:border-forest"
                  value={rule.frequency}
                  onChange={(e) => setRule(rule.key, { frequency: e.target.value })}
                >
                  {FREQUENCIES.map((f) => (
                    <option key={f.value} value={f.value}>{f.label}</option>
                  ))}
                </select>

                {(rule.frequency === 'specific-days' || rule.frequency === 'weekly') && (
                  <div className="flex gap-1">
                    {WEEKDAYS_MON_FIRST.map((day) => (
                      <button
                        key={day.value}
                        type="button"
                        onClick={() => toggleWeekday(rule, day.value)}
                        className={`rounded px-2 py-1 text-[11px] font-medium transition-colors duration-150 ${
                          rule.daysOfWeek.includes(day.value)
                            ? 'bg-forest text-white'
                            : 'border border-line text-muted hover:bg-hoverbg'
                        }`}
                      >
                        {day.label}
                      </button>
                    ))}
                  </div>
                )}

                <span className="ml-auto text-[11px] text-muted">EXP</span>
                <input
                  type="number"
                  min="1"
                  max="200"
                  className="w-16 rounded-md border border-line bg-card px-2 py-1.5 text-xs outline-none focus:border-forest"
                  value={rule.expReward}
                  onChange={(e) => setRule(rule.key, { expReward: Number(e.target.value) })}
                />
              </div>

              <div className="flex gap-2 text-[11px] text-muted">
                <span>Runs until (optional):</span>
                <input
                  type="date"
                  className="rounded border border-line px-1.5 py-0.5 text-[11px] outline-none focus:border-forest"
                  value={rule.endDate}
                  onChange={(e) => setRule(rule.key, { endDate: e.target.value })}
                />
              </div>
            </div>
          ))}

          <button
            type="button"
            onClick={() => setRules((all) => [...all, emptyRule(form.startDate)])}
            className="flex items-center gap-1.5 text-xs font-semibold text-forest hover:underline"
          >
            <Plus size={13} /> Add Another Task
          </button>
        </div>
      )}

      {error && <p className="mt-3 text-xs text-danger">{error}</p>}

      <div className="mt-4 flex gap-2">
        {step === 2 && (
          <button type="button" onClick={() => setStep(1)} className="flex items-center gap-1 rounded-md border border-line px-4 py-2 text-sm text-ink transition-colors duration-150 hover:bg-hoverbg">
            <ChevronLeft size={14} /> Back
          </button>
        )}
        {step === 1 ? (
          <button type="button" onClick={goNext} className="flex items-center gap-1 rounded-md bg-forest px-4 py-2 text-sm font-semibold text-white transition-colors duration-150 hover:bg-forest-dark">
            Next <ChevronRight size={14} />
          </button>
        ) : (
          <button type="button" onClick={submit} className="rounded-md bg-forest px-4 py-2 text-sm font-semibold text-white transition-colors duration-150 hover:bg-forest-dark">
            {saveLabel}
          </button>
        )}
        <button type="button" onClick={onCancel} className="rounded-md px-4 py-2 text-sm text-muted transition-colors duration-150 hover:bg-hoverbg hover:text-ink">
          Cancel
        </button>
      </div>
    </div>
  );
}

// ── The page itself ─────────────────────────────────────────────────────────
export default function PlanPage() {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [mode, setMode] = useState('list'); // 'list' | 'create' | 'edit'
  const [editingPlan, setEditingPlan] = useState(null);
  const [pendingSave, setPendingSave] = useState(null); // edit values awaiting "apply to which tasks?"
  const [busy, setBusy] = useState(false);

  const load = async () => {
    try {
      const data = await api.get('/plans');
      setPlans(data.plans);
      setError('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleCreate = async (values) => {
    setBusy(true);
    try {
      await api.post('/plans', values);
      setMode('list');
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  // Editing: first pick how far the change should reach, then save.
  const handleUpdate = async (values, applyTo) => {
    setBusy(true);
    try {
      await api.put(`/plans/${editingPlan._id}`, { ...values, applyTo, clientToday: todayISO() });
      setPendingSave(null);
      setEditingPlan(null);
      setMode('list');
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const handleStatus = async (plan, action) => {
    try {
      await api.put(`/plans/${plan._id}`, { action, clientToday: todayISO() });
      await load();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDelete = async (plan) => {
    if (!window.confirm(`Delete "${plan.title}"? Completed tasks will stay in your history.`)) return;
    try {
      await api.del(`/plans/${plan._id}`);
      await load();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-lg font-semibold">My Plans</h1>
        {mode === 'list' && (
          <button
            type="button"
            onClick={() => setMode('create')}
            className="flex items-center gap-1.5 rounded-md bg-forest px-3.5 py-2 text-sm font-semibold text-white transition-colors duration-150 hover:bg-forest-dark"
          >
            <Plus size={15} /> Create New Plan
          </button>
        )}
      </div>

      {error && <p className="mb-4 text-sm text-danger">{error}</p>}
      {loading && <p className="text-sm text-muted">Loading plans…</p>}

      {/* Create form */}
      {mode === 'create' && (
        <div className="mb-6 rounded-lg border border-line bg-card p-6 shadow-card">
          <h2 className="mb-1 text-[15px] font-semibold">Create a plan</h2>
          <p className="mb-4 text-xs text-muted">
            A plan is a goal with a timeline. Ascend turns its recurring tasks into daily to-dos on
            your Home page.
          </p>
          <PlanForm onSave={handleCreate} onCancel={() => setMode('list')} saveLabel="Create Plan" />
        </div>
      )}

      {/* Edit form + "apply to which tasks?" choice */}
      {mode === 'edit' && editingPlan && (
        <div className="mb-6 rounded-lg border border-line bg-card p-6 shadow-card">
          {pendingSave ? (
            <div>
              <h2 className="text-[15px] font-semibold">Almost there — which tasks should change?</h2>
              <p className="mt-1 text-xs text-muted">
                Completed tasks are never touched. Default keeps your history exactly as it is.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => handleUpdate(pendingSave, 'future')}
                  className="rounded-md bg-forest px-4 py-2 text-sm font-semibold text-white transition-colors duration-150 hover:bg-forest-dark disabled:opacity-60"
                >
                  Apply to future tasks (recommended)
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => handleUpdate(pendingSave, 'all')}
                  className="rounded-md border border-line px-4 py-2 text-sm font-medium text-ink transition-colors duration-150 hover:bg-hoverbg disabled:opacity-60"
                >
                  Apply to all incomplete tasks
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPendingSave(null);
                    setMode('list');
                  }}
                  className="rounded-md px-4 py-2 text-sm text-muted transition-colors duration-150 hover:bg-hoverbg"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <>
              <h2 className="mb-1 text-[15px] font-semibold">Edit plan</h2>
              <p className="mb-4 text-xs text-muted">Change anything — you'll choose what to apply before saving.</p>
              <PlanForm
                initial={editingPlan}
                onSave={(values) => setPendingSave(values)}
                onCancel={() => setMode('list')}
                saveLabel="Save changes"
              />
            </>
          )}
        </div>
      )}

      {/* Plan list */}
      {mode === 'list' && !loading && (
        <div className="space-y-4">
          {plans.length === 0 && (
            <div className="rounded-lg border border-dashed border-line bg-card p-8 text-center">
              <p className="text-3xl">🎯</p>
              <p className="mt-2 text-sm font-semibold">No plans yet</p>
              <p className="mt-1 text-xs text-muted">
                Plans turn big goals into small daily steps. Create your first one above.
              </p>
            </div>
          )}
          {plans.map((plan) => (
            <PlanCard
              key={plan._id}
              plan={plan}
              onEdit={() => {
                setEditingPlan(plan);
                setMode('edit');
              }}
              onStatus={(action) => handleStatus(plan, action)}
              onDelete={() => handleDelete(plan)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
