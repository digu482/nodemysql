const transporter = require('../config/Emailconfig');
const otpGenerator = require('otp-generator');
const generateJwt  = require("../utils/jwt");
const {userverifyToken} = require("../middleware/Auth");
const {passwordencrypt} = require('../services/commonservices')
const msg = require('../utils/ResponseMessage.json')
const pool = require("../config/db")
const nodemailer = require('nodemailer');




exports.verifyOTP = async (req, res) => {
    const { email, otp } = req.body;
  
    try {
      const selectQuery = 'SELECT * FROM user WHERE email = ?';
      pool.query(selectQuery, [email], async (selectError, selectResults) => {
        if (selectError) {
          console.log(selectError);
          return res.status(500).json({
            status: 500,
            message: msg.ERROROTP,
          });
        }
  
        if (selectResults.length === 0) {
          return res.status(404).json({
            status: 404,
            message: msg.NOTFOUND,
          });
        } else {
          const user = selectResults[0];
  
          if (otp !== user.otp) {
            return res.status(400).json({
              status: 400,
              message: msg.INVALIDOTP,
            });
          } else {
            const currentDateTime = new Date().toLocaleString("en-IN", {
              timeZone: "Asia/Kolkata",
            });
  
            if (user.otpExpiration < currentDateTime) {
              return res.status(400).json({
                status: 400,
                message: msg.OTPEXPIRED,
              });
            } else {
              const updateQuery = 'UPDATE user SET otp = NULL, otpExpiration = NULL WHERE email = ?';
              pool.query(updateQuery, [email], (updateError) => {
                if (updateError) {
                  console.log(updateError);
                  return res.status(500).json({
                    status: 500,
                    message: msg.ERROROTP,
                  });
                }
  
                return res.status(201).json({
                  status: 201,
                  message: msg.OTPVERYSUCC,
                });
              });
            }
          }
        }
      });
    } catch (error) {
      console.log("Error verifying OTP:", error);
      return res.status(500).json({
        status: 500,
        message: msg.ERROROTP,
      });
    }
};





  exports.adminverifyOTP = async (req, res) => {
    const { email, otp } = req.body;
  
    try {
      const selectQuery = 'SELECT * FROM admin WHERE email = ?';
      pool.query(selectQuery, [email], async (selectError, selectResults) => {
        if (selectError) {
          console.log(selectError);
          return res.status(500).json({
            status: 500,
            message: msg.ERROROTP,
          });
        }
  
        if (selectResults.length === 0) {
          return res.status(404).json({
            status: 404,
            message: msg.NOTFOUND1,
          });
        } else {
          const user = selectResults[0];
  
          if (otp !== user.otp) {
            return res.status(400).json({
              status: 400,
              message: msg.INVALIDOTP,
            });
          } else {
            const currentDateTime = new Date().toLocaleString("en-IN", {
              timeZone: "Asia/Kolkata",
            });
  
            if (user.otpExpiration < currentDateTime) {
              return res.status(400).json({
                status: 400,
                message: msg.OTPEXPIRED,
              });
            } else {
              const updateQuery = 'UPDATE admin SET otp = NULL, otpExpiration = NULL WHERE email = ?';
              pool.query(updateQuery, [email], (updateError) => {
                if (updateError) {
                  console.log(updateError);
                  return res.status(500).json({
                    status: 500,
                    message: msg.ERROROTP,
                  });
                }
  
                return res.status(201).json({
                  status: 201,
                  message: msg.OTPVERYSUCC,
                });
              });
            }
          }
        }
      });
    } catch (error) {
      console.log("Error verifying OTP:", error);
      return res.status(500).json({
        status: 500,
        message: msg.ERROROTP,
      });
    }
  };

