const mongoose = require("mongoose");

const minutesSchema = new mongoose.Schema({
  ordinanceId: {
    type: String,
    required: true,
  },
	date: {
    type: Date,
    required: true,
  },
  agenda: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
	speaker: {
		type: String,
		requried: true,
	},
	file: {
		type: String,
		required: true,
	},
  series: {
    type: Number,
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

minutesSchema.pre("save", function (next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model("MinutesOfMeeting", minutesSchema);
