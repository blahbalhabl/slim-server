const { Router } = require("express");
const { verify } = require("../middlewares/verifyToken");
const {  
  sendEmail, 
  forgotEmail, } = require("../controllers/emailController");
const router = Router();

router.use(verify);

router.post('/send-email', sendEmail);
router.post('/send-forgot-password', forgotEmail);

module.exports = router ;