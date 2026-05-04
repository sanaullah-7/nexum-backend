const mongoose = require('mongoose');

const employeeSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, index: true },
    contactNumber: { type: String, trim: true },
    email: { type: String, trim: true, lowercase: true },
    cnic: { type: String, trim: true },
    joiningDate: { type: Date },
    position: { type: String, trim: true },

    workMode: {
      type: String,
      enum: ['remote', 'onsite', 'hybrid'],
      default: 'onsite',
      index: true,
    },

    salary: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true },
);

module.exports = mongoose.model('Employee', employeeSchema);
