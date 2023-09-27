require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const bodyParser = require('body-parser');

const user = require("./routes/userRoutes");
const ordinance = require('./routes/uploadRoutes');
const email = require('./routes/emailRoutes');
const uploads = require('./routes/uploadRoutes');
const minutes = require('./routes/minutesRoutes');
const public = require('./routes/publicRoutes');
const audit = require('./routes/auditRoutes');

const app = express();
const PORT = process.env.PORT || 3500;
const HOST = process.env.HOST;

app.use(cors({ origin: true, credentials: true }));
app.use(cookieParser());
app.use(bodyParser.json());
app.use(express.json());

// MongoDB Connection
const conn = mongoose
  .connect(process.env.DB_URI)
  .then(() => console.log("Connected to DB"))
  .catch((err) => console.log(err));

//API Route
app.use("/api", public, user, ordinance, email, uploads, minutes, audit);
app.listen(PORT, HOST, () => console.log(`Server running on http://${HOST}:${PORT}`));

module.exports = conn;