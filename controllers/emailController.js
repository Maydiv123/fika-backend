const nodemailer = require('nodemailer');
require('dotenv').config();

// Create transporter for sending emails
const createTransporter = () => {
  console.log('Using Gmail account:', process.env.GMAIL_USER);
  
  // Create reusable transporter object using Gmail SMTP
  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD
    }
  });

  return transporter;
};

// Send verification email
const sendVerificationEmail = async (req, res) => {
  const { email, code } = req.body;
  console.log('Attempting to send verification code to:', email);

  try {
    const transporter = createTransporter();

    // Send mail with defined transport object
    const info = await transporter.sendMail({
      from: `"Fika Support" <${process.env.GMAIL_USER}>`,
      to: email,
      subject: 'Email Verification Code',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2874f0;">Verify Your Email</h2>
          <p>Hello,</p>
          <p>Your verification code is:</p>
          <h1 style="color: #2874f0; font-size: 32px; letter-spacing: 5px; margin: 20px 0;">${code}</h1>
          <p>This code will expire in 10 minutes.</p>
          <p>If you didn't request this code, please ignore this email.</p>
          <p>Best regards,<br>Fika Team</p>
        </div>
      `,
    });

    console.log('Email sent successfully!');
    res.status(200).json({
      success: true,
      message: 'Verification email sent successfully'
    });
  } catch (error) {
    console.error('Error sending email:', {
      error: error.message,
      code: error.code,
      command: error.command
    });
    res.status(500).json({
      success: false,
      message: 'Failed to send verification email',
      error: error.message
    });
  }
};

module.exports = {
  sendVerificationEmail,
}; 