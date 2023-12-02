const express = require("express");
const { Router } = require("express");
const {
  getUsers,
  getUser,
  createUser,
  loginUser,
  verifyOTP,
  refreshAccessToken,
  logoutUser,
  changePassword,
  forgotPassword,
  useOtp,
  updateUser,
  checkUser,
  checkPass,
  delUser,
  disableOtp,
  new2FASecret,
  updateOtp,
} = require("../controllers/userController");
const { 
  avatarUpload, 
  getAvatars,
  delAvatar,
} = require('../controllers/avatarController');
const { verify } = require("../middlewares/verifyToken");
const { image } = require('../middlewares/configureMulter')
const router = Router();

// General Routes
router.post('/forgot-password/:email', checkUser);
router.post("/login", loginUser);
router.post("/verify", verifyOTP);
router.post("/refresh", refreshAccessToken);
router.post("/logout", logoutUser);

// Apply the verify middleware to this route
router.use(verify);

// Protected Routes
router.use('/uploads/images', express.static('uploads/images'));
router.get("/users", getUsers);
router.get("/user", getUser);
router.get('/avatars', getAvatars);
router.get('/new-tfa', new2FASecret);
router.put('/enable-2fa', useOtp);
router.put('/disable-2fa', disableOtp);
router.put('/update-2fa', updateOtp);
router.put('/update-user', updateUser);
router.post("/signup", createUser);
router.post("/check-pass", checkPass);
router.post('/change-password', changePassword);
router.post('/avatar-upload', image.single('avatar'), avatarUpload);
router.delete('/delete-avatar/:fileName', delAvatar);
router.delete('/delete-user', delUser);

module.exports = router;
