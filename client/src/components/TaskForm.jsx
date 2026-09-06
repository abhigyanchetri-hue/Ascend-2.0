// TaskForm — small inline form for adding or editing a task.
// Used directly inside the Home page (no modal popups — keep it calm).
import { useState } from 'react';
import { CATEGORIES } from '../utils/constants';

export default function TaskForm({ initial, onSubmit, onCancel, submitLabel }) {
  const [title, setTitle] = useState(initial ? initial.title : '');
  const [category, setCategory] = useState(initial ? initial.category : 'study');
  const [expReward, setExpReward] = useState(initial ? initial.expReward : 20);
  const [error, setError] = useState('');

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!title.trim()) {
      setError('Give your task a name first.');
      return;
    }
    onSubmit({
      title: title.trim(),
      category,
      expReward: Number(expReward) || 20,
    });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-3 rounded-lg border border-forest/25 bg-forest-light/40 px-4 py-4"
    >
      <div>
        <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-muted">
          Task name
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Solve 20 math problems"
          autoFocus
          className="w-full rounded-md border border-line bg-card px-3 py-2 text-sm outline-none transition-colors duration-150 focus:border-forest"
        />
      </div>

      <div className="flex gap-3">
        <div className="flex-1">
          <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-muted">
            Category
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full rounded-md border border-line bg-card px-3 py-2 text-sm outline-none transition-colors duration-150 focus:border-forest"
          >
            {CATEGORIES.map((cat) => (
              <option key={cat.value} value={cat.value}>
                {cat.emoji} {cat.label}
              </option>
            ))}
          </select>
        </div>

        <div className="w-28">
          <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-muted">
            EXP reward
          </label>
          <input
            type="number"
            min="1"
            max="200"
            value={expReward}
            onChange={(e) => setExpReward(e.target.value)}
            className="w-full rounded-md border border-line bg-card px-3 py-2 text-sm outline-none transition-colors duration-150 focus:border-forest"
          />
        </div>
      </div>

      {error && <p className="text-xs text-danger">{error}</p>}

      <div className="flex gap-2">
        <button
          type="submit"
          className="rounded-md bg-forest px-4 py-2 text-sm font-semibold text-white transition-colors duration-150 hover:bg-forest-dark"
        >
          {submitLabel}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-md px-4 py-2 text-sm text-muted transition-colors duration-150 hover:bg-hoverbg hover:text-ink"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
