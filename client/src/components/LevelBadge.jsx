// LevelBadge — "Level 4 · Climber" chip plus the EXP progress bar.
// Used on the Home page header area.
import { useLevel } from '../hooks/useLevel';

export default function LevelBadge({ user }) {
  const level = useLevel(user);
  if (!level) return null;

  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between gap-3">
        <span className="rounded-full bg-forest-light px-2.5 py-1 text-xs font-semibold text-forest">
          Level {level.level} · {level.title}
        </span>
        <span className="text-xs text-muted">
          {level.currentExp} / {level.expForNext} EXP to Level {level.level + 1}
        </span>
      </div>

      {/* Progress bar — fills smoothly when EXP changes */}
      <div className="h-2 overflow-hidden rounded-full bg-track">
        <div
          className="exp-bar-fill h-full rounded-full bg-forest"
          style={{ width: `${level.percent}%` }}
        />
      </div>
    </div>
  );
}
