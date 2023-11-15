const mongoose = require("mongoose");

const proceedingSchema = new mongoose.Schema({
  proceedingId: {
    type: String,
    required: true,
  },
  level: {
    type: String,
    required: true,
  },
  startTime: {
    type: Date,
    required: true,
  },
  endTime: {
    type: Date,
    required: true,
  },
  attended: [
    {
      name: { 
        type: String,
        required: true,
      },
      isChecked: {
        type: Boolean,
        required: true,
        default: false,
      },
      timePresent: {
        type: Date,
        required: false,
      },
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now(),
  },
});

module.exports = mongoose.model("proceedings", proceedingSchema);