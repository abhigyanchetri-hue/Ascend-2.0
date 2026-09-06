// PlanCard — one plan in the Plans page: progress bar, status chip,
// actions (view tasks / edit / pause / complete / delete) and an
// expandable preview of upcoming generated tasks.
import { useState } from 'react';
import {
  ChevronDown,
  Pencil,
  Trash2,
  Pause,
  Play,
  CheckCircle2,
  Check,
} from 'lucide-react';
import { api } from '../utils/api';
import { todayISO, shiftDate, prettyDateWithWeekday, dateRangeLabel } from '../utils/dateHelpers';
import { categoryMeta } from '../utils/constants';

const STATUS_CHIPS = {
  active: { label: 'Active', className: 'bg-forest-light text-forest' },
  paused: { label: 'Paused', className: 'bg-warm-light text-warm-dark' },
  completed: { label: 'Completed', className: 'bg-hoverbg text-muted' },
};

export default function PlanCard({ plan, onEdit, onStatus, onDelete }) {
  const [showTasks, setShowTasks] = useState(false);
  const [upcoming, setUpcoming] = useState(null); // date → tasks map
  const [loadingTasks, setLoadingTasks] = useState(false);

  const emoji = plan.rules && plan.rules.length > 0 ? categoryMeta(plan.rules[0].category).emoji : '🎯';
  const chip = STATUS_CHIPS[plan.status] || STATUS_CHIPS.active;
  const percent = plan.totalTasks > 0 ? Math.round((plan.completedTasks / plan.totalTasks) * 100) : 0;

  // Fetch the next two weeks of generated tasks the first time it expands.
  const toggleTasks = async () => {
    if (!showTasks && upcoming === null) {
      setLoadingTasks(true);
      try {
        const from = todayISO();
        const to = shiftDate(from, 13);
        const data = await api.get(`/tasks?planId=${plan._id}&from=${from}&to=${to}`);
        const byDate = {};
        data.tasks.forEach((task) => {
          (byDate[task.date] = byDate[task.date] || []).push(task);
        });
        setUpcoming(byDate);
      } catch {
        setUpcoming({});
      } finally {
        setLoadingTasks(false);
      }
    }
    setShowTasks((v) => !v);
  };

  return (
    <div className="rounded-lg border border-line bg-card p-5 shadow-card">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate text-[15px] font-semibold">
            <span className="mr-1.5">{emoji}</span>
            {plan.title}
          </h3>
          {plan.goal && <p className="mt-0.5 truncate text-sm text-muted">{plan.goal}</p>}
          <p className="mt-1 text-xs text-muted">{dateRangeLabel(plan.startDate, plan.endDate)}</p>
        </div>
        <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold ${chip.className}`}>
          {chip.label}
        </span>
      </div>

      {/* Progress */}
      <div className="mt-4">
        <div className="mb-1 flex justify-between text-xs text-muted">
          <span>
            {plan.completedTasks}/{plan.totalTasks} tasks completed
          </span>
          <span>{percent}%</span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-track">
          <div
            className="exp-bar-fill h-full rounded-full bg-forest"
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>

      {/* Actions */}
      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={toggleTasks}
          className="flex items-center gap-1.5 rounded-md border border-line px-3 py-1.5 text-xs font-medium text-ink transition-colors duration-150 hover:bg-hoverbg"
        >
          View Tasks
          <ChevronDown
            size={13}
            className={`transition-transform duration-150 ${showTasks ? 'rotate-180' : ''}`}
          />
        </button>
        <button
          type="button"
          onClick={onEdit}
          className="flex items-center gap-1.5 rounded-md border border-line px-3 py-1.5 text-xs font-medium text-ink transition-colors duration-150 hover:bg-hoverbg"
        >
          <Pencil size={12} /> Edit
        </button>

        {plan.status === 'active' && (
          <button
            type="button"
            onClick={() => onStatus('pause')}
            className="flex items-center gap-1.5 rounded-md border border-line px-3 py-1.5 text-xs font-medium text-ink transition-colors duration-150 hover:bg-hoverbg"
          >
            <Pause size={12} /> Pause
          </button>
        )}
        {plan.status === 'paused' && (
          <button
            type="button"
            onClick={() => onStatus('resume')}
            className="flex items-center gap-1.5 rounded-md border border-forest/40 px-3 py-1.5 text-xs font-medium text-forest transition-colors duration-150 hover:bg-forest-light"
          >
            <Play size={12} /> Resume
          </button>
        )}
        {plan.status === 'active' && (
          <button
            type="button"
            onClick={() => onStatus('complete')}
            className="flex items-center gap-1.5 rounded-md border border-forest/40 px-3 py-1.5 text-xs font-medium text-forest transition-colors duration-150 hover:bg-forest-light"
          >
            <CheckCircle2 size={12} /> Mark Complete
          </button>
        )}
        <button
          type="button"
          onClick={onDelete}
          className="flex items-center gap-1.5 rounded-md border border-line px-3 py-1.5 text-xs font-medium text-danger transition-colors duration-150 hover:bg-danger-soft"
        >
          <Trash2 size={12} /> Delete
        </button>
      </div>

      {/* Expandable upcoming tasks (next 14 days) */}
      {showTasks && (
        <div className="mt-4 rounded-md bg-background p-3">
          {loadingTasks && <p className="text-xs text-muted">Loading tasks…</p>}
          {!loadingTasks && upcoming && Object.keys(upcoming).length === 0 && (
            <p className="text-xs text-muted">
              No upcoming tasks. {plan.status === 'paused' ? 'Resume the plan to regenerate them.' : 'Try "Resume" or edit the plan.'}
            </p>
          )}
          {!loadingTasks &&
            upcoming &&
            Object.keys(upcoming)
              .sort()
              .map((dateIso) => (
                <div key={dateIso} className="mb-2 last:mb-0">
                  <p className="text-[11px] font-semibold text-muted">
                    {prettyDateWithWeekday(dateIso)}
                  </p>
                  <ul className="mt-1 space-y-1">
                    {upcoming[dateIso].map((task) => (
                      <li key={task._id} className="flex items-center gap-1.5 text-xs">
                        {task.completed ? (
                          <Check size={12} className="shrink-0 text-forest" strokeWidth={3} />
                        ) : (
                          <span className="h-3 w-3 shrink-0 rounded-sm border border-field" />
                        )}
                        <span className={task.completed ? 'text-muted line-through' : 'text-ink'}>
                          {task.title}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
        </div>
      )}
    </div>
  );
}
