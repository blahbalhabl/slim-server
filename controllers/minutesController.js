const fs = require('fs');
const Minutes = require('../models/minutesModel');

const getMinutes = async (req, res) => {
  try {
		const ordinanceId = req.params
		const minutes = await Minutes.find(ordinanceId).exec();
		res.status(200).json(minutes);
	} catch(err) {
		res.status(500).json({err, message: 'Internal Server Error'});
	}
}

const postMinutes = async (req, res) => {
	try {
		const {date, agenda, description, speaker, series } = req.body;
		const ordinanceId = req.query.ordinanceId;

		if (!req.file) {
			return res.status(400).json({message: 'No file Selected'});
		}
		const file = req.file.filename;

		await Minutes.create({ordinanceId: ordinanceId, date, agenda, description, speaker, series, file: file});
		return res.status(200).json({message: 'Uploaded Minutes of the Meeting'});
	} catch (err) {
		return res.status(500).json({err, message: 'Internal Server Error'});
	}
}


module.exports = {
	getMinutes,
	postMinutes,
}
