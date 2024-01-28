const { Router } = require("express");
const { forgotEmail, sendEmail } = require("../controllers/emailController");
const { forgotPassword, verifyEmailOtp, confirmNewUserEmail } = require("../controllers/userController");
const router = Router();

router.post('/verify-otp', verifyEmailOtp);
router.post('/forgot-email', forgotEmail);
router.post('/reset-password', forgotPassword);
router.get('/send-new-user-otp', confirmNewUserEmail);
router.post('/new-user-creds', sendEmail);

module.exports = router ;