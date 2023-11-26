require("dotenv").config();
const nodemailer = require('nodemailer');
const User = require('../models/userModel');

const sendEmail = async (req, res) => {
  const {email, subject, html} = req.body;
  try {
    const transport = nodemailer.createTransport({
      host: process.env.HOST,
      port: 465,
      secure: true,
      auth: {
        user: process.env.EMAIL,
        pass: process.env.PASS
      }
    });

    const mailOptions = {
      from: `SLIM <${process.env.EMAIL}>`,
      to: email,
      subject: subject,
      html: html,
    }

    const result = await transport.sendMail(mailOptions);
    return res.status(200).json(result);
  } catch (err) {
    return res.status(500).json({err, message: 'Internal Server Error'});
  }
};

const forgotEmail = async (req, res) => {
  const {email, subject} = req.body;
  try {
    const transport = nodemailer.createTransport({
      host: process.env.HOST,
      port: 465,
      secure: true,
      auth: {
        user: process.env.EMAIL,
        pass: process.env.PASS
      }
    });

    const user = await User.findOne({email: email});

    if (!user || !user.otpCode || !user.otpTimestamp) {
      return res.status(400).json({ message: "Invalid request." });
    };

    const currentTime = Date.now();
    const otpExpirationTime = user.otpTimestamp + 300000;

    if (currentTime > otpExpirationTime) {
      return res.status(400).json({ message: "OTP has expired." });
    }

    const mailOptions = {
      from: `SLIM <${process.env.EMAIL}>`,
      to: email,
      subject: subject,
      html: `
      <h1>Verification Code:</h1> 
      <h3>Verify this code if you requested the forgot password</h3>
      </br>
      </br>
      <h2>${user.otpCode}</h2>
      <p>This code will only be valid for 5 minutes</p>
      <p>If you did not make this request please contact support.</p>`,
    }

    const result = await transport.sendMail(mailOptions);
    return res.status(200).json(result);
  } catch (err) {
    return res.status(500).json({err, message: 'Internal Server Error'});
  }
};

module.exports = { 
  sendEmail,
  forgotEmail,
};
