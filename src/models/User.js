const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true },
    email: { type: String, trim: true, lowercase: true, index: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);
