const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, index: true },
    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Client',
      required: true,
      index: true,
    },

    status: {
      type: String,
      enum: ['pending', 'processing', 'completed'],
      default: 'pending',
      index: true,
    },

    amount: { type: Number, required: true, min: 0 },

    startDate: { type: Date },
    deadline: { type: Date },
  },
  { timestamps: true },
);

module.exports = mongoose.model('Project', projectSchema);
