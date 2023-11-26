const { Router } = require("express");
const { forgotEmail } = require("../controllers/emailController");
const { forgotPassword, verifyEmailOtp } = require("../controllers/userController");
const router = Router();

router.post('/verify-otp', verifyEmailOtp);
router.post('/forgot-email', forgotEmail);
router.post('/reset-password', forgotPassword);

module.exports = router ;