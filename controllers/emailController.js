require("dotenv").config();
const nodemailer = require('nodemailer');
const { google } = require('googleapis');

const oAuth2Client = new google.auth.OAuth2( 
  process.env.CLIENT_ID, 
  process.env.CLIENT_SECRET, 
  process.env.REDIRECT_URI
)
oAuth2Client.setCredentials({ refresh_token: process.env.REFRESH_TOKEN});

const sendEmail = async (req, res) => {
  const {email, subject, html} = req.body;
  try {
    const accessToken = await oAuth2Client.getAccessToken();

    const transport = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        type: 'OAuth2',
        user: process.env.G_MAIL,
        clientId: process.env.CLIENT_ID,
        clientSecret: process.env.CLIENT_SECRET,
        refreshToken: process.env.REFRESH_TOKEN,
        accessToken: accessToken,
      },
    });

    const mailOptions = {
      from: `ACCOUNT CREATION <${process.env.G_MAIL}>`,
      to: email,
      subject: subject,
      html: html,
    }

    const result = await transport.sendMail(mailOptions)
    return res.status(200).json(result);
  } catch (err) {
    return res.status(500).json({err, message: 'Internal Server Error'});
  }
}

const forgotEmail = async (req, res) => {
  try {
    const {email, subject, html} = req.body;
    const accessToken = await oAuth2Client.getAccessToken();

    const transport = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        type: 'OAuth2',
        user: process.env.G_MAIL,
        clientId: process.env.CLIENT_ID,
        clientSecret: process.env.CLIENT_SECRET,
        refreshToken: process.env.REFRESH_TOKEN,
        accessToken: accessToken,
      },
    });

    const mailOptions = {
      from: `FORGOT PASSWORD? <${process.env.G_MAIL}>`,
      to: email,
      subject: subject,
      html: html,
    }

    const result = await transport.sendMail(mailOptions)
    return res.status(200).json(result);
  } catch (err) {
    return res.status(500).json({err, message: 'Internal Server Error'});
  }
}

module.exports = { 
  sendEmail, 
  forgotEmail,
};
