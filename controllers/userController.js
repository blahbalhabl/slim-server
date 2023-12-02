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
      level: user.level,
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
      level: user.level,
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
      username: user.username,
      email: user.email,
      role: user.role,
      level: user.level,
      isMember: user.isMember,
      position: user?.position,
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

const createUser = async (req, res) => {
  try {
    const avatar = null;
    const { 
      email, 
      username, 
      role, 
      level, 
      isMember, 
      position, 
      startTerm, 
      endTerm } = req.body;

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
      isMember,
      position,
      startTerm,
      endTerm,
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
      return res.status(400).json({message: "Invalid Email."});
    }

    // Compare hash password
    const passMatch = await bcrypt.compare(password, user.password);

    if (!passMatch) {
      return res.status(401).json({message: "Incorrect Password."});
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
        id: user.id,
        avatar: user.avatar,
        username: user.username,
        email: user.email,
        role: user.role,
        level: user.level,
        isMember: user.isMember,
        position: user?.position,
        otp: user.is2faOn,
        token: accessToken,
      });
    }
  } catch (err) {
    return res.status(500).json({ err, message: "User does not exist" });
  }
};

const verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;
    const user = await UserModel.findOne({ email });

    if (!user?.is2faOn) {
      return res.status(400).json("2FA not enabled for this user");
    };

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
        id: user.id,
        avatar: user.avatar,
        username: user.username,
        email: user.email,
        role: user.role,
        level: user.level,
        isMember: user.isMember,
        position: user?.position,
        otp: user.is2faOn,
        token: accessToken,
      });
    } else {
      return res.status(402).json({message: "Invalid OTP"});
    }
  } catch (err) {
    return res.status(500).json({ err, message: "Internal Server Error" });
  }
};

const useOtp = async (req, res) => {
  try {
    const userId = req.id;

    const user = await UserModel.findById(userId);

    if(!user) {
      res.status(400).json({message: 'User does not exist!'});
    }

    user.is2faOn = true;
    await user.save();

    res.status(200).json({user: user, message: 'Two-Factor Authentication Updated.'});
  } catch (err) {
    res.status(500).json({err, message: 'Internal Server Error'});
  }
};

const updateOtp = async (req, res) => {
  try {
    const { otp, secret } = req.body;
    const userId = req.id;

    const user = await UserModel.findById(userId);

    if(!user) {
      res.status(400).json({message: 'User does not exist!'});
    }

    const newSecret = speakeasy.totp.verify({
      secret: secret,
      encoding: "base32",
      token: otp,
    });

    if(!newSecret) {
      return res.status(400).json({message: 'Incorrect Authentication Code'});
    }
    user.secret = secret;
    user.is2faOn = true;
    await user.save();

    res.status(200).json({message: 'Two-Factor Authentication Updated.'});
  } catch (err) {
    res.status(500).json({err, message: 'Internal Server Error'});
  }
};

const disableOtp = async (req, res) => {
  try {
    const userId = req.id;
    const { otp } = req.body;

    const user = await UserModel.findById(userId);

    const isValid = speakeasy.totp.verify({
      secret: user.secret,
      encoding: "base32",
      token: otp,
    });

    if(!isValid) {
      return res.status(400).json({message: 'Incorrect Authentication Code'});
    }

    user.is2faOn = false;
    await user.save();

    res.status(200).json({message: 'Two-Factor Authentication Disabled.'});
  } catch (err) {
    res.status(500).json({message: 'Internal Server Error.'})
  }
}

const getUsers = async (req, res) => {
  try {
    const users = await UserModel.find().select("-password -is2faOn -refresh").lean().exec();
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

const updateUser = async (req, res) => {
  try {
    const { id, inputs } = req.body;
    const updateData = Object.entries(inputs).reduce((acc, [key, value]) => {
      if (value !== "") {
        acc[key] = value;
      }
      return acc;
    }, {});

    const user = await UserModel.findOneAndUpdate(
      { _id: id }, 
      { $set: updateData }, 
      { new: true }
    );

    if (!user) {
      return res.status(400).json({ message: "User Not Found" });
    }
    return res.status(200).json({ message: `Successfully updated user` });
  } catch (err) {
    return res.status(500).json({ err, message: "Internal Server Error!" });
  }
};

const logoutUser = async (req, res) => {
  const refresh = req.cookies.refresh;
  if(!refresh) return res.status(200).json({msg: "No Cookies Found"});

  const foundUser = await UserModel.findOne({ refresh }).exec();
  if( !foundUser ) {
    res.clearCookie('refresh', {path: '/api', httpOnly: true, sameSite: "lax"})
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
};

const checkUser = async (req, res) => {
  try {
    const user = await UserModel.findOne({ email: req.params.email });

    if (!user) {
      return res.status(400).json({ message: "Invalid Email." });
    }

    const otpCode = Math.floor(1000 + Math.random() * 9000).toString();

    // Save the OTP, user email, and timestamp in the database
    user.otpCode = otpCode;
    user.otpTimestamp = Date.now() + 300000;
    await user.save();

    return res.status(200).json({ message: "User Found!" });
  } catch (err) {
    return res.status(500).json({ err, message: 'Internal Server Error' });
  }
};

const checkPass = async (req, res) => {
  try {
    const userId = req.id;
    const { deletePass } = req.body;
    const user = await UserModel.findById(userId);

    if (!user) {
      return res.status(400).json({ message: "User not Found." });
    }

    const passMatch = await bcrypt.compare(deletePass, user.password);

    if (!passMatch) {
      return res.status(400).json({message: 'Incorrect Password'});
    }

    return res.status(200).json({message: 'Correct'});
    
  } catch (err) {
    res.status(500).json({err, message: 'Internal Server Error'});
  }
};

const forgotPassword = async (req, res) => {
  try {
    const { email, password, confirmPassword } = req.body;
    const user = await UserModel.findOne({ email: email });

    const passMatch = await bcrypt.compare(password, user.password);

    if (passMatch) {
      return res.status(401).json({message: 'New Password cannot be the same as Old Password!'});
    };
  
    if(password === confirmPassword) {
      const hash = await bcrypt.hash(password, 10);
      await UserModel.findOneAndUpdate({email: email},
        { $set: {password: hash }},
        { new: true }
      )
  
      return res.status(200).json({ message: 'Password Changed!'});
    }
  } catch (err) {
    return res.status(500).json({err, message: 'Internal Server Error'});
  }
};

const verifyEmailOtp = async (req, res) => {
  try {
    const {email, otp} = req.body;
    const user = await UserModel.findOne({email: email});
    const date = new Date();

    if((date <= user?.otpTimestamp) && (!user || otp !== user?.otpCode)) {
      return res.status(400).json({message: 'Unauthorized.'});
    };

    user.otpCode = undefined;
    user.otpTimestamp = undefined;
    await user.save();

    res.status(200).json({message: 'OTP correct.'});

  } catch(err) {
    res.status(500).json({message: 'Internal Server Error.'});
  }
};

const new2FASecret = async (req, res) => {
  try {
    const { email } = req.query;

    // Generate a secret key
    const secret = speakeasy.generateSecret({ length: 20 });

    // Store the base32 secret in the database
    const base32Secret = secret.base32;

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

    res.status(200).json({ qrCode: qrCodeUrl, secret: base32Secret });
  } catch(err) {
    res.status(500).json({message: 'Internal Server Error.'});
  }
};

const update2FA = async (req, res) => {
  try {
    
  } catch(err) {
    res.status(500).json({message: 'Internal Server Error.'});
  }
};

const delUser = async (req, res) => {
  try {
    const role = req.role;
    const { id } = req.query;

    if (role !== 'Superadmin') {
      return res.status(403).json({message: 'Forbidden Action.'});
    };

    const deleteUser = await UserModel.findByIdAndDelete(id);

    if (!deleteUser) {
      return res.status(400).json({message: 'No User Found.'});
    }

    res.status(200).json({message: 'Deleted User Success.'})
  } catch(err) {
    res.status(500).json({err, message: 'Interal Server Error.'});
  }
};

module.exports = {
  getUsers,
  getUser,
  createUser,
  loginUser,
  verifyOTP,
  updateUser,
  useOtp,
  updateOtp,
  verifyEmailOtp,
  refreshAccessToken,
  logoutUser,
  changePassword,
  forgotPassword,
  checkUser,
  checkPass,
  delUser,
  disableOtp,
  new2FASecret,
  update2FA,
};
