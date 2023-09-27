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
router.get('/forgot-password', forgotPassword);
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
router.put('/update-2fa', useOtp);
router.post("/signup", createUser);
router.post('/change-password', changePassword);
router.post('/avatar-upload', image.single('avatar'), avatarUpload);
router.delete('/delete-avatar/:fileName', delAvatar);


module.exports = router;
