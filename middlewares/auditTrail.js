const Audit = require('../models/aduitTrailModel');

const auditTrail = async (req, res, next) => {
  try {
    const auditData = new Audit({
      userId: req.id,
      username: req.username,
      type: req.method,
      url: req.originalUrl,
      request: JSON.stringify(req.body),
    });

    await auditData.save();
    next();
  } catch (err) {
    return res.status(500).json({ err, message: 'Internal Server Error' });
  }
};

module.exports = { auditTrail };
