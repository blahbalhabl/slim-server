const { Router } = require('express');
const { getApprovedOrdinances } = require('../controllers/uploadController');
const router = Router();

//Public Route for Public Client
router.get('/public-ordinances', getApprovedOrdinances);

module.exports = router;
