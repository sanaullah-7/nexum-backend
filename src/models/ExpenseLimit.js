const mongoose = require('mongoose');

const expenseLimitSchema = new mongoose.Schema(
  {
    monthKey: { type: String, required: true, unique: true, index: true },
    limit: { type: Number, required: true, min: 0 },
  },
  { timestamps: true },
);

module.exports = mongoose.model('ExpenseLimit', expenseLimitSchema);
