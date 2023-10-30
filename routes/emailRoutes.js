const { Router } = require("express");
const { verify } = require("../middlewares/verifyToken");
const { sendEmail } = require("../controllers/emailController");
const router = Router();

router.use(verify);

router.post('/send-email', sendEmail);

module.exports = router;