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
   searchOrdinance,
   getProceedings,
   getProceeding,
   viewOrdinance,
   getOrdinance,
   confirmUpdateOrdinance,
} = require('../controllers/uploadController');
const { uploadLogo } = require('../controllers/avatarController');

const router = Router();

// Apply the verify middleware to this route
router.use(verify);

// Serve the uploaded files from the 'uploads' directory
router.use('/uploads/files', express.static('uploads/files'));
router.get('/ordinances', getOrdinances);
router.get('/ordinance', getOrdinance);
router.get('/count-ordinances', countOrdinances);
router.get('/search-ordinances', searchOrdinance); // Search Function
router.get('/download/:fileName', auditTrail, downloadOrdinance);
router.get('/view/:fileName', viewOrdinance);
router.get('/proceedings', getProceedings);
router.get('/proceeding', getProceeding);
router.post('/update-proceedings/:filename', updateProceedings);
router.post('/upload/ordinance/draft', file.single('file'), auditTrail, draftOrdinance);
router.post('/update-ordinance/:fileName', file.single('file'), auditTrail, updateOrdinance);
router.post('/upload-logo', image.single('file'), auditTrail, uploadLogo);
router.post('/confirm-update', confirmUpdateOrdinance);
router.delete('/delete-ordinance/:fileName', auditTrail, delOrdinance);

module.exports = router;
