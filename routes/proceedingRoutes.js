const { Router } = require("express");
const { verify } = require("../middlewares/verifyToken");
const { getProceedings, postProceeding } = require('../controllers/proceedingController');

const router = Router();
router.use(verify);

router.get('/past-proceedings', getProceedings);
router.post('/attendance', postProceeding);

module.exports = router;
