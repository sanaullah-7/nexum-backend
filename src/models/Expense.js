const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    amount: { type: Number, required: true, min: 0 },
    date: { type: Date, default: Date.now, index: true },
    note: { type: String, trim: true },
  },
  { timestamps: true },
);

module.exports = mongoose.model('Expense', expenseSchema);
