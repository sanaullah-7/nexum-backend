const mongoose = require('mongoose');

const salaryTransactionSchema = new mongoose.Schema(
  {
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: true,
      index: true,
    },
    amount: { type: Number, required: true, min: 0 },
    date: { type: Date, default: Date.now },
    note: { type: String, trim: true },
  },
  { timestamps: true },
);

module.exports = mongoose.model('SalaryTransaction', salaryTransactionSchema);
