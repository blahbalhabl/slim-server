const mongoose = require("mongoose");

const memberSchema = new mongoose.Schema({
  avatar: {
    type: String,
    required: false,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  name: {
    type: String,
    required: true,
  },
  position: {
    type: String,
    required: true,
  },
  branch: {
    type: String,
    required: true,
  },
  startTerm: {
    type: Date,
    required: true,
  },
  endTerm: {
    type: Date,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now(),
  },
  updatedAt: {
    type: Date,
    default: null,
  },
});

memberSchema.pre("save", function (next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model("sanggunian-members", memberSchema);
