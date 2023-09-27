const express = require('express');
const { Router } = require('express');
const { verify } = require('../middlewares/verifyToken');
const { file } = require('../middlewares/configureMulter');
const { 
  getMinutes,
	postMinutes,
} = require('../controllers/minutesController');
const router = Router();

router.use(verify);

router.get('/minutes/:ordinanceId', getMinutes);
router.post('/upload-minutes', file.single('file'), postMinutes);

module.exports = router;
