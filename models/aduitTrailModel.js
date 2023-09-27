const mongoose = require("mongoose");

const auditSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
  },
	request: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    required: true,
  },
  url: {
    type: String,
    required: true,
  },
	role: {
		type: String,
		requried: true,
	},
  createdAt: {
    type: Date,
    default: Date.now(),
  },
});

module.exports = mongoose.model("audit-trail", auditSchema);
