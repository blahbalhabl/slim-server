const express = require('express');
const { Router } = require('express');
const { verify } = require('../middlewares/verifyToken');
const { file, image } = require('../middlewares/configureMulter');
const { auditTrail } = require('../middlewares/auditTrail');
const {
   draftOrdinance, 
   getOrdinances,
   delOrdinance,
   updateOrdinance,
   countOrdinances,
   downloadOrdinance,
   updateProceedings,
} = require('../controllers/uploadController');
const { uploadLogo } = require('../controllers/avatarController');

const router = Router();

// Apply the verify middleware to this route
router.use(verify);

// Serve the uploaded files from the 'uploads' directory
router.use('/uploads/files', express.static('uploads/files'));
router.get('/ordinances', getOrdinances);
router.get('/count-ordinances', countOrdinances);
router.get('/download/:fileName', auditTrail, downloadOrdinance);
router.post('/update-proceedings/:filename', auditTrail, updateProceedings);
router.post('/upload/ordinance/draft', file.single('file'), auditTrail, draftOrdinance);
router.put('/update-ordinance/:fileName', file.single('file'), auditTrail, updateOrdinance);
router.post('/upload-logo', image.single('file'), auditTrail, uploadLogo);
router.delete('/delete-ordinance/:fileName', auditTrail, delOrdinance);

module.exports = router;
