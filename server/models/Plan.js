// Plan schema — a long-term goal broken into recurring task rules.
const mongoose = require('mongoose');

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

// Each entry in `rules` describes a recurring task ("Study Maths daily").
// The taskGenerator service expands rules into individual dated tasks.
const ruleSchema = new mongoose.Schema(
  {
    rid: { type: String, required: true }, // stable id, used to dedupe tasks
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    category: {
      type: String,
      enum: ['study', 'workout', 'personal', 'other'],
      default: 'other',
    },
    frequency: {
      type: String,
      enum: ['daily', 'specific-days', 'weekly'],
      default: 'daily',
    },
    // Which weekdays this rule runs on. 0 = Sunday … 6 = Saturday.
    // For 'weekly' rules the first entry is the chosen day.
    daysOfWeek: { type: [Number], default: [] },
    expReward: { type: Number, default: 20, min: 1, max: 500 },
    startDate: { type: String, default: '', match: [DATE_PATTERN, 'Use YYYY-MM-DD'] },
    endDate: { type: String, default: '', match: [DATE_PATTERN, 'Use YYYY-MM-DD'] },
  },
  { _id: false }
);

const planSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    goal: { type: String, default: '', trim: true }, // "Crack GATE CSE with AIR < 100"
    description: { type: String, default: '' },
    startDate: { type: String, required: true, match: DATE_PATTERN },
    endDate: { type: String, default: '' }, // '' = open-ended ("Ongoing")

    // status gives the UI a simple label; isActive drives generation.
    isActive: { type: Boolean, default: true },
    status: {
      type: String,
      enum: ['active', 'paused', 'completed'],
      default: 'active',
    },

    rules: { type: [ruleSchema], default: [] },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Plan', planSchema);
