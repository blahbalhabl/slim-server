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
const members = require('./routes/memberRoutes');
const forgot = require('./routes/forgotEmailRoutes');
const proceeding = require('./routes/proceedingRoutes');

const app = express();
const PORT = process.env.PORT || 3500;

app.use(cors({ origin: process.env.ORIGIN, credentials: true }));
app.use(cookieParser());
app.use(bodyParser.json());
app.use(express.json());

// MongoDB Connection
const conn = mongoose
  .connect(process.env.DB_URI)
  .then(() => console.log("Connected to DB"))
  .catch((err) => console.log(err));

//API Route
app.use("/api", 
  public,
  forgot,
  user, 
  ordinance, 
  email, 
  uploads, 
  minutes, 
  audit,
  members,
  proceeding,
);
app.listen(PORT, () => console.log(`Server running on ${PORT}`));

module.exports = conn;