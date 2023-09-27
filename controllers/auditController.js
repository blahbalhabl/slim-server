const Audit = require('../models/aduitTrailModel');

const getAudits = async (req, res) => {
  try {
    const audits = await Audit.find({}).sort({ createdAt: -1 });
    return res.status(200).json({ audits });
  } catch (err) {
    return res.status(500).json({ err, message: 'Internal Server Error' });
  }
};

const getAudit = async (req, res) => {
  try {
    const audit = await Audit.find({ userId: req.id});
    return res.status(200).json(audit);
  } catch (err) {
    return res.status(500).json({ err, message: 'Internal Server Error' });
  }
};

module.exports = { 
  getAudits,
  getAudit,
};
