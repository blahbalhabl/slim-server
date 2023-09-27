require("dotenv").config();
const jwt = require("jsonwebtoken");

const verify = (req, res, next) => {
  // Get Access Token from headers
  const accessHeader = req.headers.authorization;

  if (!accessHeader) {
    return res.status(401).json("No access token found");
  }

  const token = accessHeader.split(" ")[1];

  jwt.verify(token, process.env.ACCESS_SECRET, (err, payload) => {
    if (err) {
      return res.status(401).json("Invalid Token");
    }
    req.id = payload.id;
    next();
  });
};

module.exports = { verify };
