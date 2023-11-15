const fs = require('fs');
const path = require('path');
const Minutes = require('../models/minutesModel');
const Municipal = require('../models/ordinancesModel');
const Barangay = require('../models/brgyOrdModel');

const getAllMinutes = async (req, res) => {
	try {
		const level = req.level;
		let model;

		level === 'Barangay'
			? model = Barangay
			: model = Municipal

		const minutes = await Minutes.find({
			status: { $in: ['pending', 'ongoing'] }
		}).lean().exec();

		const ordIds = minutes.map((minute) => minute.ordinanceId);

		const title = await model.find({
			_id: { $in: ordIds }
		}).select('title').lean().exec();

		res.status(200).json({minutes, title});
	} catch (err) {
		res.status(500).json({err, message: 'Internal Server Error'});
	}
};

const getMinutes = async (req, res) => {
  try {
		const ordinanceId = req.params;
		const minutes = await Minutes.find(ordinanceId).exec();
		res.status(200).json(minutes);
	} catch(err) {
		res.status(500).json({err, message: 'Internal Server Error'});
	}
};

const postMinutes = async (req, res) => {
	try {
		const { 
			date,
			agenda, 
			description, 
			speaker, 
			series } = req.body;
		const level = req.level;
		const { ordinanceId } = req.query;

		if (!req.file) {
			return res.status(400).json({message: 'No file Selected'});
		}
		const file = req.file.filename;

		await Minutes.create({ordinanceId: ordinanceId, date, agenda, description, speaker, series, level, file: file});
		return res.status(200).json({message: 'Uploaded Minutes of the Meeting'});
	} catch (err) {
		return res.status(500).json({err, message: 'Internal Server Error'});
	}
};

const updateMinutes = async (req, res) => {
  try {
    const updateData = req.body;
    const level = req.level;
    const { series, id, fileName, type } = req.query;
    let updateFile = fileName;

    console.log('updateData:', updateData);
    console.log('series:', series);
    console.log('id:', id);
    console.log('filename:', fileName);

    if (req.file !== '') {
      updateFile = req.file.filename;
      updateData.file = updateFile;
    }

    const exists = await Minutes.findById(id);

    if (!exists) {
      return res.status(400).json({ message: 'Minutes is non-existent.' });
    }

    if (req.file !== '') {
      // Delete the file from the server if there is a file
      const filePath = path.join(__dirname, '..', 'uploads', 'files', type, level, series, fileName);

      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }

      // Set the updateFile to the new filename
      updateFile = req.file.filename;
      updateData.file = updateFile;
    }

    await Minutes.findByIdAndUpdate(
      id,
      { $set: updateData, file: updateFile },
      { new: true }
    );

    res.status(200).json({ message: 'Minutes Successfully updated.' });

  } catch (err) {
    res.status(500).json({ err, message: 'Internal Server Error.' });
  }
};

module.exports = {
	getMinutes,
	getAllMinutes,
	postMinutes,
	updateMinutes,
}
