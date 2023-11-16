const { Router } = require('express');
const { getApprovedOrdinances, downloadPublicOrdinance } = require('../controllers/uploadController');
const router = Router();

//Public Route for Public Client
router.get('/public-ordinances', getApprovedOrdinances);
router.get('/public-download/:fileName', downloadPublicOrdinance);

module.exports = router;
