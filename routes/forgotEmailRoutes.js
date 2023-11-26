const { Router } = require("express");
const { forgotEmail } = require("../controllers/emailController");
const { forgotPassword } = require("../controllers/userController");
const router = Router();


router.post('/forgot-email', forgotEmail);
router.post('/reset-password', forgotPassword);

module.exports = router ;