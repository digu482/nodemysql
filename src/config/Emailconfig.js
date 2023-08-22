const nodemailer = require('nodemailer');
const otpGenerator = require('otp-generator');
const jwt = require('jsonwebtoken');

// Create a transporter for sending emails
const transporter = nodemailer.createTransport({
    host: "sandbox.smtp.mailtrap.io",
    port: 2525,
    auth: {
      user: "e5fb579610d66e",
      pass: "7865d0f7419ac6"
    }
  });

// Secret key for JWT
const secretKey = 'div9ghfjf768cjhgj9'; // Replace with your secret key
module.exports = transporter