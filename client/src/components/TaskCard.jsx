// TaskCard — one task row: checkbox, title, EXP, edit/delete actions.
// Ticking the box shows a quiet floating "+20 EXP" — no confetti, we promise.
import { useState } from 'react';
import { Check, Pencil, Trash2 } from 'lucide-react';

export default function TaskCard({ task, onToggle, onEdit, onDelete }) {
  // Little "+20 EXP" puffs; each disappears after its animation ends.
  const [floats, setFloats] = useState([]);

  const handleCheck = () => {
    if (!task.completed) {
      const floatId = Date.now() + Math.random();
      setFloats((prev) => [...prev, floatId]);
      setTimeout(() => {
        setFloats((prev) => prev.filter((id) => id !== floatId));
      }, 1000);
    }
    onToggle(task._id);
  };

  return (
    <li className="group flex items-center gap-3 px-4 py-3 transition-colors duration-150 hover:bg-hoverbg">
      {/* Checkbox with a smooth fill */}
      <button
        type="button"
        onClick={handleCheck}
        aria-label={task.completed ? 'Mark as not done' : 'Mark as done'}
        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border transition-all duration-150 ${
          task.completed ? 'border-forest bg-forest' : 'border-field bg-card hover:border-forest'
        }`}
      >
        {task.completed && <Check size={13} strokeWidth={3} className="text-white" />}
      </button>

      <div className="min-w-0 flex-1">
        <p
          className={`truncate text-sm transition-colors duration-150 ${
            task.completed ? 'text-muted line-through' : 'text-ink'
          }`}
        >
          {task.title}
        </p>
        {task.planTitle && (
          <p className="truncate text-[11px] text-muted">{task.planTitle}</p>
        )}
      </div>

      {/* Right side: floating EXP puffs, the reward label, and row actions */}
      <div className="relative flex shrink-0 items-center gap-1">
        {floats.map((floatId) => (
          <span
            key={floatId}
            className="exp-float pointer-events-none absolute -top-1 right-16 whitespace-nowrap text-xs font-semibold text-forest"
          >
            +{task.expReward} EXP
          </span>
        ))}

        <span className={`w-10 text-right text-xs ${task.completed ? 'text-forest' : 'text-muted'}`}>
          +{task.expReward}
        </span>

        <button
          type="button"
          onClick={onEdit}
          aria-label="Edit task"
          className="rounded p-1 text-muted transition-colors duration-150 hover:bg-hoverbg hover:text-ink md:opacity-0 md:group-hover:opacity-100"
        >
          <Pencil size={14} />
        </button>
        <button
          type="button"
          onClick={onDelete}
          aria-label="Delete task"
          className="rounded p-1 text-muted transition-colors duration-150 hover:bg-danger-soft hover:text-danger md:opacity-0 md:group-hover:opacity-100"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </li>
  );
}
