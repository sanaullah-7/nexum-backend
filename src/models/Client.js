const mongoose = require('mongoose');

const clientSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, index: true },
    country: { type: String, trim: true },

    totalProjects: { type: Number, default: 0, min: 0 },
    completedProjects: { type: Number, default: 0, min: 0 },
    runningProjects: { type: Number, default: 0, min: 0 },

    totalPayment: { type: Number, default: 0, min: 0 },
    clearedAmount: { type: Number, default: 0, min: 0 },

    contactEmail: { type: String, trim: true, lowercase: true },
    contactPhone: { type: String, trim: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Client', clientSchema);
