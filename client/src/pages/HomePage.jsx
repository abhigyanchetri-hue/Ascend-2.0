// HomePage — today's tasks grouped by category, the EXP bar, and quick stats.
// This is the page users open every morning; it stays calm and focused.
import { useState } from 'react';
import { ChevronDown, Plus, Flame } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTasks } from '../hooks/useTasks';
import { greeting, todayISO } from '../utils/dateHelpers';
import { CATEGORIES, categoryMeta } from '../utils/constants';
import LevelBadge from '../components/LevelBadge.jsx';
import TaskCard from '../components/TaskCard.jsx';
import TaskForm from '../components/TaskForm.jsx';

export default function HomePage() {
  const { user } = useAuth();
  const today = todayISO();
  const { tasks, loading, error, addTask, updateTask, deleteTask, toggleTask } = useTasks(today);

  const [collapsed, setCollapsed] = useState({}); // category → boolean
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [notice, setNotice] = useState(''); // quiet bonus / level-up message

  const firstName = user.name.split(' ')[0];
  const doneCount = tasks.filter((t) => t.completed).length;

  // Called after every tick: shows any earned bonuses as a quiet line of text.
  const handleToggle = async (taskId) => {
    const result = await toggleTask(taskId);
    if (result.leveledUp) {
      setNotice(`Level up! Welcome to Level ${result.user.level} · ${result.user.levelTitle}`);
    } else if (result.bonuses && result.bonuses.length > 0) {
      setNotice(result.bonuses.map((b) => `${b.reason} (+${b.amount} EXP)`).join(' · '));
    } else {
      setNotice('');
    }
    setTimeout(() => setNotice(''), 4000);
  };

  const handleAdd = async (fields) => {
    await addTask(fields);
    setShowAddForm(false);
  };

  const handleEditSave = async (taskId, fields) => {
    await updateTask(taskId, fields);
    setEditingId(null);
  };

  const handleDelete = async (task) => {
    if (!window.confirm(`Delete "${task.title}"?`)) return;
    await deleteTask(task._id);
  };

  return (
    <div>
      {/* Greeting + level card */}
      <div className="rounded-lg border border-line bg-card p-5 shadow-card">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h1 className="text-lg font-semibold">
            {greeting()}, {firstName}
          </h1>
          <span className="flex items-center gap-1 text-sm font-semibold text-warm-dark">
            <Flame size={16} className="text-warm" /> {user.streak}
          </span>
        </div>
        <LevelBadge user={user} />
        {notice && <p className="mt-2 text-xs font-medium text-warm-dark">{notice}</p>}
      </div>

      {/* Loading / error states */}
      {loading && <p className="mt-8 text-center text-sm text-muted">Loading your tasks…</p>}
      {error && (
        <div className="mt-8 text-center">
          <p className="text-sm text-danger">{error}</p>
          <button onClick={() => window.location.reload()} className="mt-2 text-xs text-forest hover:underline">
            Retry
          </button>
        </div>
      )}

      {/* Task groups by category */}
      {!loading && !error && (
        <>
          {CATEGORIES.map((cat) => {
            const items = tasks.filter((t) => t.category === cat.value);
            const done = items.filter((t) => t.completed).length;
            const isCollapsed = collapsed[cat.value];

            return (
              <section key={cat.value} className="mt-6">
                <button
                  type="button"
                  onClick={() => setCollapsed((c) => ({ ...c, [cat.value]: !c[cat.value] }))}
                  className="flex w-full items-center gap-2 px-1 py-2 text-left"
                >
                  <span>{cat.emoji}</span>
                  <span className="text-xs font-semibold uppercase tracking-wide text-muted">
                    {cat.label}
                  </span>
                  <span className="text-xs text-muted">
                    {done}/{items.length}
                  </span>
                  <ChevronDown
                    size={15}
                    className={`ml-auto text-muted transition-transform duration-150 ${
                      isCollapsed ? '-rotate-90' : ''
                    }`}
                  />
                </button>

                {!isCollapsed && (
                  <div className="divide-y divide-line rounded-lg border border-line bg-card shadow-card">
                    {items.length === 0 && (
                      <p className="px-4 py-4 text-sm text-muted">Nothing here yet.</p>
                    )}
                    {items.map((task) =>
                      editingId === task._id ? (
                        <div key={task._id} className="p-3">
                          <TaskForm
                            initial={task}
                            submitLabel="Save changes"
                            onSubmit={(fields) => handleEditSave(task._id, fields)}
                            onCancel={() => setEditingId(null)}
                          />
                        </div>
                      ) : (
                        <TaskCard
                          key={task._id}
                          task={task}
                          onToggle={handleToggle}
                          onEdit={() => setEditingId(task._id)}
                          onDelete={() => handleDelete(task)}
                        />
                      )
                    )}
                  </div>
                )}
              </section>
            );
          })}

          {/* Friendly empty state for brand-new accounts */}
          {tasks.length === 0 && (
            <div className="mt-6 rounded-lg border border-dashed border-line bg-card p-8 text-center">
              <p className="text-3xl">🌱</p>
              <p className="mt-2 text-sm font-semibold">Your first step awaits</p>
              <p className="mt-1 text-xs text-muted">
                Add a task below, or create a Plan to schedule tasks automatically every day.
              </p>
            </div>
          )}

          {/* Add-task form / button */}
          <div className="mt-6">
            {showAddForm ? (
              <TaskForm
                submitLabel="Add Task"
                onSubmit={handleAdd}
                onCancel={() => setShowAddForm(false)}
              />
            ) : (
              <button
                type="button"
                onClick={() => setShowAddForm(true)}
                className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-line py-3 text-sm text-muted transition-colors duration-150 hover:border-forest/40 hover:text-forest"
              >
                <Plus size={16} /> Add Task
              </button>
            )}
          </div>

          {/* Quick stats footer (wraps into two lines on narrow phones) */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-1 border-t border-line pt-4 text-center text-sm text-muted">
            <span>
              Today:{' '}
              <span className="font-semibold text-ink">
                {doneCount}/{tasks.length}
              </span>{' '}
              tasks done
            </span>
            <span className="flex items-center gap-1">
              Streak: <Flame size={14} className="text-warm" />
              <span className="font-semibold text-ink">{user.streak} days</span>
            </span>
          </div>
        </>
      )}
    </div>
  );
}
