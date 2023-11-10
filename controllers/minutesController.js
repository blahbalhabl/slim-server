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
}

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
}


module.exports = {
	getMinutes,
	getAllMinutes,
	postMinutes,
}
