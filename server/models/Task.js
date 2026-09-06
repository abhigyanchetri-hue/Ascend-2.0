// Task schema — a single, dated to-do (auto-generated from a plan or manual).
const mongoose = require('mongoose');

// NOTE: `date` is a 'YYYY-MM-DD' STRING, not a Date object.
// Tasks belong to a calendar day; strings make comparisons and timezone
// behaviour dead simple (see server/utils/dateUtils.js).
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

const taskSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    category: {
      type: String,
      enum: ['study', 'workout', 'personal', 'other'],
      default: 'other',
    },
    date: { type: String, required: true, match: DATE_PATTERN },
    completed: { type: Boolean, default: false },
    expReward: { type: Number, default: 20, min: 1, max: 500 },

    // Filled in when the task was generated from a plan.
    planId: { type: mongoose.Schema.Types.ObjectId, ref: 'Plan', default: null },
    planRuleId: { type: String, default: null }, // which rule inside the plan
    planTitle: { type: String, default: null }, // denormalized for display

    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

// The most common query: "all tasks of a user on a day".
taskSchema.index({ userId: 1, date: 1 });

module.exports = mongoose.model('Task', taskSchema);
