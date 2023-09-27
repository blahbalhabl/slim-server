const multer = require('multer');
const path = require('path');
const fs = require('fs');

const imageStorage = multer.diskStorage({
  destination(req, file, cb) {
    // Create the dynamic subfolder structure
    const uploadPath = path.join(__dirname, '..', 'uploads', 'images');
    // Ensure the directory exists (create it if not)
    fs.mkdirSync(uploadPath, { recursive: true });
    cb(null, uploadPath);
  },
  filename(req, file, cb) {
    const ext = path.extname(file.originalname);
    cb(null, file.originalname + ' - ' + Date.now() + ext);
  },
});

const imageFilter = (req, file, cb) => {
  const allowedFile = ['image/jpeg', 'image/jpg', 'image/png'];
  if (allowedFile.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb("Invalid File Type", false);
  }
};

const fileStorage = multer.diskStorage({
  destination(req, file, cb) {
   // Get Series Year & Level
   const year = req.body.series || 'unknown';
   const level = req.body.level || 'unknown';
   const type = req.query.type || 'unknown';

   // Create the dynamic subfolder structure
   const uploadPath = path.join(__dirname, '..', 'uploads', 'files', type, level, year);

   // Ensure the directory exists (create it if not)
   fs.mkdirSync(uploadPath, { recursive: true });

   cb(null, uploadPath);
  },
  filename(req, file, cb) {
    const ext = path.extname(file.originalname);
    cb(null, file.originalname + ' - ' + Date.now() + ext);
  },
});

const fileFilter = (req, file, cb) => {
  const allowedFile = ['application/pdf', 'application/rtf'];
  if (allowedFile.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb("Invalid File Type", false);
  }
};

const image = multer(
  { 
    storage: imageStorage,
    imageFilter, 
  });

const file = multer(
  {
    storage: fileStorage,
    fileFilter,
  }
)

module.exports = { image, file };
