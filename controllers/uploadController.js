const fs = require('fs');
const path = require('path');
const Ordinance = require('../models/ordinancesModel');
const Barangay = require('../models/brgyOrdModel');

const draftOrdinance = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({err: 'No file found!'})
    }
    
    const level = req.level
    const { number, series, title, status, author, coAuthor } = req.body;
    const file = req.file.filename;
    const size = req.file.size / 1024;
    const rounded = Math.round(size * 100) / 100;
    const mimetype = req.file.mimetype;
    
    let model;

    if (level === 'BARANGAY') {
      model = Barangay;
    } else {
      model = Ordinance;
    }
    const exists = await model.findOne({ number });

    if(exists) {
      return res.status(400).json({message: 'Ordinance is Already Existing.'})
    }
  
    // Create the ordinance in Barangay or Ordinance Schema
    await model.create({ number, title, series, status, file, mimetype, accessLevel: level, size: rounded, author, coAuthor });

    return res.status(200).json({message: 'Successfully Uploaded Ordinance.'});
  } catch (err) {
    res.status(400).json({err, message: 'Internal Server Error.'});
  }
};

const getOrdinances = async (req, res) => {
  try {
    const level = req.level;
    const { status, page, series } = req.query;
    const filters = { status }
    const itemsPerPage = 10;

    const skip = (page - 1) * itemsPerPage;

    if(status === 'all') {
      delete filters.status;
    }

    let model;

    if (level === 'BARANGAY') {
      model = Barangay;
    } else if (level === 'LGU') {
      model = Ordinance;
    } else if (level === 'DILG') {
      model = Ordinance
    }

    let highestSeries;

    if (series) {
      // When a specific series is requested, fetch ordinances for that series
      filters.series = series;
    } else {
      // Determine the highest series value
      highestSeries = await model.aggregate([{ $group: { _id: null, max: { $max: '$series' } } }]).exec();
      if (highestSeries.length > 0) {
        filters.series = highestSeries[0].max;
      }
    };

    const ordinances = await model
      .find(filters)
      .sort({ number: 1 })
      .skip(skip)
      .limit(itemsPerPage)
      .exec();

    const distSeries = await model.find().distinct('series').exec();

    res.status(200).json({ordinances, series: distSeries, highest: highestSeries});
  } catch (err) {
    res.status(400).json({err, message: 'Something went wrong!'});
  }
};

const getOrdinance = async (req, res) => {
  try {
    const level = req.level;
    const { id } = req.query;
    let model;

    level === 'Barangay' ? (model = Barangay) : (model = Ordinance);

    const ordinance = await model.findById(id);

    if(!ordinance) {
      return res.status(400).json({message: 'Ordinance Not Found.'});
    }

    res.status(200).json(ordinance);

  } catch (err) {
    res.status(500).json({err, message: 'Internal Server Error.'});
  }
}

const searchOrdinance = async (req, res) => {
  try {
    const level = req.level;

    let model;

    if (level === 'BARANGAY') {
      model = Barangay;
    } else if (level === 'LGU') {
      model = Ordinance;
    } else if (level === 'DILG') {
      model = Ordinance
    }

    const response = await model
      .find()
      .lean()
      .exec();
    res.status(200).json(response);
  } catch (err) {
    res.status(500).json({message: 'Internal Server Error!'});
  }
};

const getApprovedOrdinances = async (req, res) => {
  try {
    const municipalApproved = await Ordinance.find({ status: 'approved' }).sort({ number: 1 }).exec();
    const municipalEnacted = await Ordinance.find({ status: 'enacted' }).sort({ number: 1 }).exec();
    const barangayApproved = await Barangay.find({ status: 'approved' }).sort({ number: 1 }).exec();
    const barangayEnacted = await Barangay.find({ status: 'enacted' }).sort({ number: 1 }).exec();

    return res.status(200).json({ municipalApproved, municipalEnacted, barangayApproved, barangayEnacted });
  } catch (err) {
    return res.status(500).json({err, message: 'Internal Server Error'});
  }
};

const countOrdinances = async (req, res) => {
  try {
    const level = req.level;
    let response = {};
    let model;

    if (level === 'BARANGAY') {
      model = Barangay;
    } else if (level === 'LGU') {
      model = Ordinance;
    } else if (level === 'DILG') {
      model = Ordinance
    }
    
    response.all = await model.countDocuments().exec();
    response.pending = await model.countDocuments({status: 'pending'}).exec();
    response.vetoed = await model.countDocuments({status: 'vetoed'}).exec();
    response.approved = await model.countDocuments({status: 'approved'}).exec();
    response.draft = await model.countDocuments({status: 'draft'}).exec();
    response.enacted = await model.countDocuments({status: 'enacted'}).exec();
     
    res.status(200).json(response);
  } catch (err) {
    res.satus(400).json({err: 'Something went wrong!'});
  }
};

//  Delete both file and Ordinance in Database
const delOrdinance = async (req, res) => {
  try {
    const level = req.level;
    const { series, type } = req.query;
    const fileName = req.params.fileName;

    // Delete the file from the server
    const filePath = path.join(__dirname, '..', 'uploads', 'files', type, level, series, fileName);
    await fs.promises.unlink(filePath);

    let model;

    if(level === 'BARANGAY') {
      model = Barangay;
    } else {
      model = Ordinance;
    }
    // Delete the corresponding database object
    const deletedFile = await model.findOneAndDelete({ file: fileName });

    if (!deletedFile) {
      return res.status(400).json({ message: 'File not found in the database' })
    }

    return res.status(200).json({message: 'File and database entry deleted successfully'})
  } catch (err) {
    res.status(500).json({err, message: 'Internal Server Error!'});
  }
};

// Delete just the file when user is updating the file
const updateOrdinance = async (req, res) => {
  try {
    const updateData = req.body;
    const level = req.level
    const { series, type } = req.query;
    const fileName = req.params.fileName;
    let updateFile = fileName;

    if (req.file) {
      updateFile = req.file.filename;
      updateData.file = updateFile;
    }

    let model;

    if (level === 'BARANGAY') {
      model = Barangay;
    } else {
      model = Ordinance;
    }
    
    const exists = await model.findOneAndUpdate(
      { file: fileName },
      { $set: updateData, file: updateFile},
      { new: true }
    );

     // Check if exists contains the updated document
     if (!exists) {
      return res.status(404).json({ message: 'File not found in the database' });
    }

    if(req.file) {
      // Delete the file from the server
      const filePath = path.join(__dirname, '..', 'uploads', 'files', type, level, series, fileName);
      fs.unlinkSync(filePath);
    }

    return res.status(200).json({ message: 'Ordinance file updated successfully' });
  } catch (err) {
    console.error('Error updating ordinance file:', err);
    res.status(500).json({err, message: 'Internal Server Error' });
  }
};

const getProceeding = async (req, res) => {
  try {
    const level = req.level;
    const { id } = req.query;
    let model;

    level === 'Barangay' ? (model = Barangay) : (model = Ordinance);

    const proceedings = await model
      .findById(id)
      .lean()
      .exec();

    if(proceedings.length === 0) {
      return res.status(400).json({message: 'No Proceeding with this ID'});
    };

    return res.status(200).json(proceedings);

  } catch(err) {
    res.status(500).json({err, message: 'Internal Server Error'});
  }
};

const getProceedings = async (req, res) => {
  try {
    const level = req.level;
    let model;

    level === 'Barangay' ? (model = Barangay) : (model = Ordinance);

    // const today = new Date();
    const proceedings = await model
      // .find({proceedings: { $gte: today }})
      .find()
      .sort({ proceedings: -1 })
      .select('number series title proceedings endTime status')
      .lean()
      .exec();

    if(proceedings.length === 0) {
      return res.status(400).json({message: 'No Proceedings Exists!'});
    }

    return res.status(200).json(proceedings);
  } catch (err) {
    res.status(500).json({message: 'Interal Server Error'})
  }
};

const updateProceedings = async (req, res) => {
  try {
    const { proceeding, endTime } = req.body;
    const fileName = req.params.filename;
    const level = req.level;

    let model;

    if (level === 'BARANGAY') {
      model = Barangay;
    } else {
      model = Ordinance;
    }

    await model.findOneAndUpdate(
      { file: fileName },
      { $set: { proceedings: proceeding, endTime }},
      { new: true }
    );
    
    return res.status(200).json({ message: 'New Proceedings Schedule Updated' });
  } catch (err) {
    return res.status(500).json({err, message: 'Internal Server Error'});
  }
};

const downloadOrdinance = (req, res) => {
  try {
    const level = req.level;
    const { series, type, acl } = req.query;
    const fileName = req.params.fileName;
    let filePath;
    if (level !== 'DILG') {
      filePath = path.join(__dirname, '..', 'uploads', 'files', type, level, series, fileName);
    } else {
      filePath = path.join(__dirname, '..', 'uploads', 'files', type, acl, series, fileName);
    }
    
    // Use res.download to trigger the file download
    res.download(filePath, (err) => {
      if (err) {
        console.error('Error downloading file:', err);
        res.status(500).json({ message: 'Internal Server Error' });
      }
    });
  } catch (err) {
    console.error('Error in downloadOrdinance:', err);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

const viewOrdinance = (req, res) => {
  try {
    const level = req.level;
    const { series, type, acl } = req.query;
    const fileName = req.params.fileName;
    let filePath;
    if (level !== 'DILG') {
      filePath = path.join(__dirname, '..', 'uploads', 'files', type, level, series, fileName);
    } else {
      filePath = path.join(__dirname, '..', 'uploads', 'files', type, acl, series, fileName);
    }
    
    // Use res.download to trigger the file download
    res.download(filePath, (err) => {
      if (err) {
        console.error('Error downloading file:', err);
        res.status(500).json({ message: 'Internal Server Error' });
      }
    });
  } catch (err) {
    console.error('Error in downloadOrdinance:', err);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

module.exports = {
  draftOrdinance,
  getOrdinances,
  getOrdinance,
  countOrdinances,
  delOrdinance,
  updateOrdinance,
  updateOrdinance,
  downloadOrdinance,
  viewOrdinance,
  updateProceedings,
  getApprovedOrdinances,
  searchOrdinance,
  getProceedings,
  getProceeding,
}
