// User schema — one document per Ascend account.
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    // Hidden from queries by default; login opts in with `.select('+password')`.
    password: { type: String, required: true, select: false },

    // Gamification state (kept on the user so reading is always O(1)).
    level: { type: Number, default: 1 },
    totalExp: { type: Number, default: 0 }, // lifetime EXP
    currentExp: { type: Number, default: 0 }, // EXP earned inside the current level
    streak: { type: Number, default: 0 }, // consecutive days with ≥1 task done
    longestStreak: { type: Number, default: 0 },

    // Remembers one-time bonuses (day-complete, streak milestones) so they
    // can never be farmed by ticking a task off and on again.
    awardedBonusKeys: { type: [String], default: [] },
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);
