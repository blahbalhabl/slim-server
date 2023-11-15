const Proceeding = require('../models/proceedingModel');

const getProceedings = async (req, res) => {
  try {
    const level = req.level;
    const proceedings = await Proceeding.find({level: level}).lean().exec();

    res.status(200).json(proceedings);
  } catch (err) {
    res.status(500).json({err, message: 'Internal Server Error.'});
  }
};

const getProceeding = async (req, res) => {
  try {
    const { id } = req.query;
    const proceedings = await Proceeding.findById(id).lean().exec();

    res.status(200).json(proceedings);
  } catch (err) {
    res.status(500).json({err, message: 'Internal Server Error.'});
  }
};

const postProceeding = async (req, res) => {
  try {
    const level = req.level;
    const { proceedingId, attended, startTime, endTime } = req.body;

    if (!level || !attended) {
      return res.status(400).json({ message: 'Invalid or missing data in the request.' });
    }

    await Proceeding.create({proceedingId, attended, level, startTime, endTime })

    res.status(200).json({message: 'Attendance Successfully Posted.'});

  } catch (err) {
    res.status(500).json({err, message: 'Internal Server Error.'});
  }
};

module.exports = {
  getProceedings,
  getProceeding,
  postProceeding,
};
