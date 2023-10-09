const { Router } = require("express");
const { sendEmail } = require("../controllers/emailController");
const { forgotPassword } = require("../controllers/userController");
const router = Router();


router.post('/forgot-email', sendEmail);
router.post('/reset-password', forgotPassword);

module.exports = router ;