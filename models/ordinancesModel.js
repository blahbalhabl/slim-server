const mongoose = require("mongoose");
const Minutes = require('./minutesModel');

const ordinanceSchema = new mongoose.Schema({
  number: {
    type: String,
    required: true,
    unique: true,
  },
  series: {
    type: Number,
    required: true,
  },
  title: {
    type: String,
    required: true,
    unique: true,
  },
  status: {
    type: String,
    required: true,
  },
  file: {
    type: String,
    required: true,
  },
  mimetype: {
    type: String,
    required: true,
  },
  accessLevel: {
    type: String,
    required: true,
  },
  size: {
    type: Number,
    required: true,
  },
  author: {
    type: String,
    required: true,
  },
  proceedings: {
    type: Date,
    required: false,
    default: Date.now(),
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

ordinanceSchema.pre("save", function (next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model("Ordinances-LGU", ordinanceSchema);
