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

const postProceeding = async (req, res) => {
  try {
    const level = req.level;
    const { proceedingId, attended } = req.body;

    console.log(proceedingId)
    console.log(attended)

    if (!level || !attended) {
      return res.status(400).json({ message: 'Invalid or missing data in the request.' });
    }

    await Proceeding.create({proceedingId, attended, level})

    res.status(200).json({message: 'Uploading Proceeding Success'});

  } catch (err) {
    res.status(500).json({err, message: 'Internal Server Error.'});
  }
};

module.exports = {
  getProceedings,
  postProceeding,
};
