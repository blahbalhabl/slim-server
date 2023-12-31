const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  avatar: {
    type: String,
    required: false,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  username: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true,
    minlength: 8,
  },
  role: {
    type: String,
    required: true,
  },
  level: {
    type: String,
    required: true,
  },
  refresh: {
    type: String,
    required: false,
  },
  secret: {
    type: String,
    required: false,
  },
  isMember: {
    type: Boolean,
    requred: true,
    default: false,
  },
  position: {
    type: String,
    required: false,
    default: undefined,
  },
  startTerm: {
    type: Date,
    required: false,
  },
  endTerm: {
    type: Date,
    required: false,
  },
  is2faOn: {
    type: Boolean,
    required: true,
    default: true,
  },
  otpCode: {
    type: String,
    required: false,
  },
  otpTimestamp: {
    type: Date,
    required: false,
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

userSchema.pre("save", function (next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model("Users", userSchema);
