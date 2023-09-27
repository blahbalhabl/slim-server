require("dotenv").config();
const UserModel = require("../models/userModel");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const speakeasy = require("speakeasy");
const qrcode = require('qrcode');

const createAccessToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      name: user.username,
      role: user.role,
    },
    process.env.ACCESS_SECRET,
    { expiresIn: `${process.env.ACCESS_EXPIRES}s` }
  );
};

const createRefreshToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      name: user.username,
      role: user.role,
    },
    process.env.REFRESH_SECRET,
    { expiresIn: `${process.env.REFRESH_EXPIRES}s` }
  );
};

// Refresh the existing Access Token
const refreshAccessToken = async (req, res) => {
  const refreshToken = req.cookies.refresh;

  if (!refreshToken) {
    return res.status(403).json({ msg: "Refresh token missing" });
  }

  try {
    const decoded = jwt.verify(refreshToken, process.env.REFRESH_SECRET);
    const user = await UserModel.findById(decoded.id);

    if (!user) {
      return res.status(400).json({ msg: "User not found" });
    }

    // Generate a new access token
    const newAccessToken = createAccessToken(user);

    return res.status(200).json({
      id: user.id,
      avatar: user.avatar,
      name: user.username, 
      role: user.role,
      level: user.level,
      otp: user.is2faOn,
      token: newAccessToken });
  } catch (err) {
    return res.status(400).json({ msg: "Invalid refresh token" });
  }
};

const generateDefaultPassword = (email) => {
  // Take the first 4 characters of the email
  const emailPrefix = email.slice(0, 4);
  
  // Generate 4 random digits
  const randomDigits = Math.floor(1000 + Math.random() * 9000).toString();
  
  // Combine the email prefix and random digits
  return `${emailPrefix}${randomDigits}`;
};

const forgotPassword = (req, res) => {
  const randomDigits = Math.floor(1000 + Math.random() * 9000).toString();
  return res.status(200).json({auth: randomDigits});
}

const createUser = async (req, res) => {
  try {
    const avatar = null;
    const { email, username, role, level } = req.body;

    // Check if Email Already Exists
    const isExisting = await UserModel.findOne({ email });
    if (isExisting) {
      return res.status(400).json("User Already Exists!");
    }

    // Generate a secret key
    const secret = speakeasy.generateSecret({ length: 20 });

    // Store the base32 secret in the database
    const base32Secret = secret.base32;

    // Generate Default Password
    const defaultPassword = generateDefaultPassword(email);

    // Hash Password with Bcrypt
    const hash = await bcrypt.hash(defaultPassword, 10);

    // If No Existing Email is found, continue with signup
    const user = await UserModel.create({
      avatar,
      email,
      username,
      password: hash,
      role,
      level,
      secret: base32Secret,
    });

    // Generate the OTP authentication URL using the stored base32 secret
      const label = email;
      const issuer = 'SLIM';
  
    const otpAuthUrl = `otpauth://totp/${encodeURIComponent(issuer)}:${encodeURIComponent(label)}?secret=${base32Secret}&issuer=${encodeURIComponent(issuer)}`;

    const qrCodeUrl = await new Promise((resolve, reject) => {
      qrcode.toDataURL(otpAuthUrl, (err, url) => {
        if (err) {
          reject(err);
        } else {
          resolve(url);
        }
      });
    });

    res.status(200).json({ user, defaultPassword, qrCode: qrCodeUrl, secret: base32Secret });
  } catch (err) {
    res.status(500).json(`${err}: Something went wrong!`);
  }
};


const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    // Find User in DB
    const user = await UserModel.findOne({ email });

    if (!user) {
      return res.status(400).json({message: "User does not exist!"});
    }

    // Compare hash password
    const passMatch = await bcrypt.compare(password, user.password);

    if (!passMatch) {
      return res.status(400).json({message: "Invalid Credentials"});
    }

    if (user.is2faOn) {
      // If the user has 2FA enabled, return a flag indicating that 2FA is required
      return res.status(201).json({ otpRequired: true, message: 'Enter Google Authenticator Code' });
    } else {
      // If 2FA is not required, generate JWT Access Token and Refresh Token
      const accessToken = createAccessToken(user);
      const refreshToken = createRefreshToken(user);

      // Save Refresh Token in Database
      user.refresh = refreshToken;
      await user.save();

      // Send Refresh Token through httpOnly cookie
      res.cookie("refresh", refreshToken, {
        path: "/api",
        expires: new Date(Date.now() + 1000 * process.env.REFRESH_EXPIRES),
        httpOnly: true,
        sameSite: "lax",
      });

      return res.status(200).json({
        id: user._id,
        avatar: user.avatar,
        name: user.username,
        role: user.role,
        level: user.level,
        otp: user.is2faOn,
        token: accessToken,
      });
    }
  } catch (err) {
    return res.status(400).json({ err, message: "User does not exist" });
  }
};

const verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;
    const user = await UserModel.findOne({ email });

    if (!user) {
      return res.status(400).json("User does not exist!");
    }

    if (!user.is2faOn) {
      return res.status(400).json("2FA not enabled for this user");
    }

    const isValid = speakeasy.totp.verify({
      secret: user.secret,
      encoding: "base32",
      token: otp,
    });

    if (isValid) {
      // If OTP verification is successful, generate JWT Access Token and Refresh Token
      const accessToken = createAccessToken(user);
      const refreshToken = createRefreshToken(user);

      // Save Refresh Token in Database
      user.refresh = refreshToken;
      await user.save();

      // Send Refresh Token through httpOnly cookie
      res.cookie("refresh", refreshToken, {
        path: "/api",
        expires: new Date(Date.now() + 1000 * process.env.REFRESH_EXPIRES),
        httpOnly: true,
        sameSite: "lax",
      });

      return res.status(200).json({
        id: user._id,
        avatar: user.avatar,
        name: user.username,
        role: user.role,
        level: user.level,
        token: accessToken,
      });
    } else {
      return res.status(400).json({message: "Invalid OTP"});
    }
  } catch (err) {
    return res.status(500).json({ err, msg: "Internal Server Error" });
  }
};

const useOtp = async (req, res) => {
  try {
    const userId = req.id;
    const { is2faOn } = req.body;

    const user = await UserModel.findById(userId);

    if(!user) {
      res.status(400).json({message: 'User does not exist!'});
    }

    user.is2faOn = is2faOn;
    await user.save();

    res.status(200).json({user: user, message: '2FA Updated!'});
  } catch (err) {
    res.status(500).json({err, message: 'Internal Server Error'});
  }
}

const getUsers = async (req, res) => {
  try {
    const users = await UserModel.find().lean().exec();
    const lgu = await UserModel.countDocuments({level: 'LGU'}).lean().exec();
    const dilg = await UserModel.countDocuments({level: 'DILG'}).lean().exec();
    const brgy = await UserModel.countDocuments({level: 'BARANGAY'}).lean().exec();
    res.status(200).json({ users, lgu, dilg, brgy });
  } catch (err) {
    res.status(400).json({err: err});
  }
};

const getUser = async (req, res) => {
  const userId = req.id;
  try {
    const user = await UserModel.findById(userId);
    res.status(201).json({
      avatar: user.avatar,
      id: user.id,
      name: user.username,
      role: user.role,
      level: user.level,
      otp: user.is2faOn,
    });
  } catch (err) {
    res.status(400).json({err: err});
  }
};

const logoutUser = async (req, res) => {

  const refresh = req.cookies.refresh;
  if(!refresh) return res.status(200).json({msg: "No Cookies Found"});

  const foundUser = await UserModel.findOne({ refresh }).exec();
  if( !foundUser ) {
    res.clearCookie('refresh', {httpOnly: true, sameSite: "lax"})
    return res.status(200).json({msg: "No refresh Token Found"});
  }

  // Delete Refresh Token in DB
  try {
    foundUser.refresh = '';
    const result = await foundUser.save();
    // Clear http Only refresh cookie
    res.clearCookie('refresh', {path: '/api', httpOnly: true, sameSite: 'lax'});
    res.status(200).json({ msg: "Logged Out" });
  } catch (err) {
    res.status(400).json(err);
  }
};

const changePassword = async (req, res) => {
  const userId = req.id;
  const { oldpass, newpass, confirm } = req.body;

  try {
    const user = await UserModel.findById(userId);
    const passMatch = await bcrypt.compare(oldpass, user.password);

    if(!user) {
      return res.status(400).json({message: 'User does not exist!'});
    }

    if(!passMatch) {
      return res.status(400).json({message: 'Wrong Old Password!'});
    }

    if(newpass === confirm) {
      const hash = await bcrypt.hash(newpass, 10);
      await UserModel.findByIdAndUpdate( userId,
        { $set: {password: hash }},
        { new: true }
      )
      return res.status(200).json({message: 'Password Changed!'});
    }
  } catch (err) {
    return res.status(500).json({err, message: 'Internal Server Error'});
  }
}

// const forgotPassword = async (req, res) => {
//   const userId = req.id;
//   const { newpass, confirm } = req.body;

//   try {
//     const user = await UserModel.findById(userId);

//     if(!user) {
//       return res.status(400).json({message: 'User does not exist!'});
//     }
  
//     await UserModel.findByIdAndUpdate( userId,
//       { $set: {password: hash }},
//       { new: true })

//     if(newpass === confirm) {
//       const hash = await bcrypt.hash(newpass, 10);
//       await UserModel.findByIdAndUpdate( userId,
//         { $set: {password: hash }},
//         { new: true }
//       )

//     const randomDigits = Math.floor(1000 + Math.random() * 9000).toString();
  
//       return res.status(200).json({auth: randomDigits, message: 'Password Changed!'});
//     }
//   } catch (err) {
//     return res.status(500).json({err, message: 'Internal Server Error'});
//   }
// }

module.exports = {
  getUsers,
  getUser,
  createUser,
  loginUser,
  verifyOTP,
  useOtp,
  refreshAccessToken,
  logoutUser,
  changePassword,
  forgotPassword,
};
