// MongoDB backend (used when MONGODB_URI is set).
//
// Wraps the Mongoose models so they expose the exact same tiny API as the
// JSON store in jsonStore.js. Controllers never know which one is running.
//
//   create, findById, findOne, find, countWhere, updateById, updateWhere,
//   deleteById, deleteWhere
const User = require('../models/User');
const Task = require('../models/Task');
const Plan = require('../models/Plan');

function modelApi(Model) {
  return {
    async create(fields) {
      const doc = await Model.create(fields);
      return doc.toObject();
    },
    async findById(id) {
      return Model.findById(id).lean();
    },
    async findOne(query) {
      return Model.findOne(query).lean();
    },
    async find(query = {}, { sort = 'createdAt' } = {}) {
      return Model.find(query).sort({ [sort]: 1, createdAt: 1 }).lean();
    },
    async countWhere(query = {}) {
      return Model.countDocuments(query);
    },
    async updateById(id, patch) {
      return Model.findByIdAndUpdate(id, { $set: patch }, { new: true }).lean();
    },
    async updateWhere(query, patch) {
      const result = await Model.updateMany(query, { $set: patch });
      return result.modifiedCount;
    },
    async deleteById(id) {
      const doc = await Model.findByIdAndDelete(id);
      return Boolean(doc);
    },
    async deleteWhere(query) {
      const result = await Model.deleteMany(query);
      return result.deletedCount;
    },
  };
}

// The User schema hides the password by default (select: false);
// login needs it, so this helper opts back in.
const users = {
  ...modelApi(User),
  async findByEmailWithPassword(email) {
    return User.findOne({ email }).select('+password').lean();
  },
};

module.exports = { users, tasks: modelApi(Task), plans: modelApi(Plan) };
