const Sanggunian = require('../models/sanggunianMembers');

const getMembers = async (req, res) => {
  try {
		const members = await Sanggunian.find().lean().exec();

		if (!members) {
			return res.status(400).json({message: 'No Sanggunian Members Found'});
		};

		return res.status(200).json(members);
  } catch(err) {
		return res.status(500).json({err, message: 'Internal Server Error'});
	};
};

const uploadMember = async (req, res) => {
  try {
		const body = req.body;
		const user = await Sanggunian.create(body);

		if (!user) {
			return res.status(400).json({message: 'Unsuccessful at creating new Member'});
		};

		return res.status(200).json({message: `Member ${body.name} is successfully created`});
  } catch(err) {
		return res.status(500).json({err, message: 'Internal Server Error'});
	};
};

const updateMember = async (req, res) => {
  try {
		const body = req.body;
		const memberId = req.query;

		const user = await Sanggunian.findByIdAndUpdate(
			{ _id: memberId }, 
			{ $set: body }, 
			{ $new: true }
		);

		if (!user) {
			return res.status(400).json({message: 'The Member Requested was not Found!'});
		}

		return res.status(200).json({message: 'Successfully Updated Member Information'});
  } catch(err) {
		return res.status(500).json({err, message: 'Internal Server Error'});
	};
};

module.exports = {
	getMembers,
	uploadMember,
	updateMember,
}
