const express = require("express")
const pool = require("../config/db")
const mysql = require('mysql');
const bcrypt = require("bcrypt")
require("dotenv").config();
const { passwordencrypt } = require("../services/commonservices")
const { passwordvalidation } = require("../services/commonservices")
const msg = require("../utils/ResponseMessage.json")
const jwt = require('jsonwebtoken');
const { generateJwt } = require("../utils/jwt")
const { userverifyToken } = require("../middleware/Auth")
const transporter = require("../config/Emailconfig")
const nodemailer = require('nodemailer');
const otpGenerator = require('otp-generator');
const uploadFile = require("../middleware/upload")
const frontEndUrl = '';




//signing user
exports.createuser = async (req, res) => {
  try {
    let {
      username,
      firstName,
      lastName,
      email,
      mobile,
      password
    } = req.body;

    const selectQuery = 'SELECT * FROM user WHERE email = ? OR mobile = ?';
    pool.query(selectQuery, [email, mobile], async (selectError, selectResults) => {
      if (selectError) {
        console.log(selectError);
        return res.status(400).json({
          status: 400,
          message: selectError.message,
        });
      }

      if (selectResults.length > 0) {
        return res.status(400).json({
          status: 400,
          message: msg.ALLREADY,
        });
      }

      if (!firstName || !lastName || !email || firstName.includes(' ') || lastName.includes(' ') || email.includes(' ')) {
        return res.status(400).json({
          status: 400,
          message: msg.REQUIREDNOSPACES,
        });
      }

      if (!passwordvalidation(password)) {
        return res.status(400).json({
          status: 400,
          message: msg.PASSWORDVALID,
        });
      }

      username = (firstName + lastName).toLowerCase() + Math.floor(Math.random().toFixed(4) * 9999);
      const hashedPassword = await passwordencrypt(password);
      email = email.toLowerCase();

      const profile = req.profileUrl || "";
      const insertQuery = 'INSERT INTO user (username, firstName, lastName, profile, email, mobile, password) VALUES (?, ?, ?, ?, ?, ?, ?)';
      pool.query(insertQuery, [username, firstName, lastName, profile, email, mobile, hashedPassword], (insertError, insertResults) => {
        if (insertError) {
          console.log(insertError);
          return res.status(400).json({
            status: 400,
            message: insertError.message,
          });
        }

        const selectCreatedUserQuery = 'SELECT * FROM user WHERE id = ?';
        pool.query(selectCreatedUserQuery, [insertResults.insertId], (selectCreatedError, createdResults) => {
          if (selectCreatedError) {
            console.log(selectCreatedError);
            return res.status(400).json({
              status: 400,
              message: selectCreatedError.message,
            });
          }

          const createdUser = createdResults[0];
          return res.status(201).json({
            status: 201,
            message: msg.CREATE,
            data: createdUser,
          });
        });
      });
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      status: 500,
      message: msg.ERROR,
    });
  }
};




//Find User
exports.finduser = (req, res) => {
  try {
    const id = req.currentUser;
    const selectQuery = 'SELECT * FROM user WHERE id = ?';

    pool.query(selectQuery, [id], (error, results) => {
      if (error) {
        console.error('Error fetching user:', error);
        res.status(500).json({
          status: 500, 
          message: msg.ERROR 
        });
      } else {
        console.log('User fetched successfully');
        res.status(200).json(results);
      }
    });
  } catch (error) {
    console.error('An error occurred:', error);
    res.status(500).json({
      status: 500,
      message: msg.ERROR
    });
  }
};




// Update User
exports.updateuser = async (req, res) => {
  try {
    const userId = req.currentUser;

    const selectQuery = 'SELECT * FROM user WHERE id = ?';
    pool.query(selectQuery, [userId], async (selectError, selectResults) => {
      if (selectError) {
        console.log(selectError);
        return res.status(400).json({
          status: 400,
          message: selectError.message,
        });
      }

      if (selectResults.length === 0) {
        return res.status(404).json({
          status: 404,
          message: msg.NOTFOUND,
        });
      }

      const user = selectResults[0];

      const { firstName, lastName, email, mobile } = req.body;

      const updateFields = [];
      const updateValues = [];

      if (firstName) {
        updateFields.push('firstName = ?');
        updateValues.push(firstName);
      }
      if (lastName) {
        updateFields.push('lastName = ?');
        updateValues.push(lastName);
      }
      if (email) {
        updateFields.push('email = ?');
        updateValues.push(email);
      }
      if (mobile) {
        const mobileCheckQuery = 'SELECT id FROM user WHERE mobile = ? AND id != ?';
        const mobileCheckResults = await pool.query(mobileCheckQuery, [mobile, userId]);

        if (mobileCheckResults.length > 0) {
          return res.status(400).json({
            status: 400,
            message: msg.EXISTMOBILE,
          });
        }

        updateFields.push('mobile = ?');
        updateValues.push(mobile);
      }

      if (updateFields.length === 0) {
        return res.status(400).json({
          status: 400,
          message: msg.NOVALID,
        });
      }

      const updateQuery = `UPDATE user SET ${updateFields.join(', ')} WHERE id = ?`;
      const updateParams = [...updateValues, userId];

      pool.query(updateQuery, updateParams, (updateError) => {
        if (updateError) {
          console.log(updateError);
          return res.status(400).json({
            status: 400,
            message: updateError.message,
          });
        }

        return res.status(200).json({
          status: 200,
          message: msg.USERUPDSUCC,
        });
      });
    });
  } catch (error) {
    console.log(error);
    return res.status(400).json({
      status: 400,
      message: error.message,
    });
  }
};




// Change Password
exports.changepassword = async (req, res) => {
  const { email, currentPassword, newPassword, confirmPassword } = req.body;
  try {
    const selectQuery = 'SELECT * FROM user WHERE email = ?';
    pool.query(selectQuery, [email], async (selectError, selectResults) => {
      if (selectError) {
        console.log(selectError);
        return res.status(400).json({
          status: 400,
          message: selectError.message,
        });
      }

      if (selectResults.length === 0) {
        return res.status(404).json({
          status: 404,
          message: msg.NOTFOUND,
        });
      }

      const user = selectResults[0];

      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch) {
        return res.status(400).json({
          status: 400,
          message: msg.INCORRECT,
        });
      }

      if (!passwordvalidation(newPassword)) {
        return res.status(400).json({
          status: 400,
          message: msg.PASSWORDVALID,
        });
      }

      const isSamePassword = await bcrypt.compare(newPassword, user.password);
      if (isSamePassword) {
        return res.status(400).json({
          status: 400,
          message: msg.NEWDIFFERENTOLD,
        });
      }

      if (newPassword !== confirmPassword) {
        return res.status(400).json({
          status: 400,
          message: msg.NEWCOMMATCH,
        });
      }

      const hashedPassword = await passwordencrypt(newPassword);
      const updateQuery = 'UPDATE user SET password = ? WHERE email = ?';
      pool.query(updateQuery, [hashedPassword, email], (updateError) => {
        if (updateError) {
          console.log(updateError);
          return res.status(400).json({
            status: 400,
            message: updateError.message,
          });
        }

        return res.status(200).json({
          status: 200,
          message: msg.PSSWORDCHANGESUCC,
        });
      });
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      status: 500,
      message: msg.ERROR,
    });
  }
};




// soft delete
exports.deleteuser = async (req, res) => {
  try {
    let userId = req.currentUser;

    const selectdata = "SELECT * FROM user WHERE id = ?";
    pool.query(selectdata, [userId], async (error, results) => {
      if (error) {
        return res.status(404).json({
          status: 404,
          message: msg.NOTFOUND,
        });
      } else {
        const user = results[0];
        const updatedata = "UPDATE user SET isdelete = true WHERE id = ?";
        pool.query(updatedata, [userId], (error) => {
          if (error) {
            return res.status(404).json({
              status: 404,
              message: msg.NOTFOUND,
            });
          } else {
            return res.status(200).json({
              status: 200,
              user,
              message: msg.DELETE,
            });
          }
        });
      }
    });
  } catch (error) {
    return res.status(500).json({
      status: 500,
      message: msg.ERROR,
    });
  }
};




// User Login
exports.userlogin = async (req, res) => {
  try {
    const { username, email, mobile, password, id } = req.body;

    const selectdata =
      'SELECT * FROM user WHERE email = ? ';
    pool.query(selectdata, [email], async (err, results) => {
      if (err) {
        return res.status(404).json({
          status: 404,
          message: msg.NOTFOUND,
        });
      }

      if (!results || results.length === 0) {
        return res.status(404).json({
          status: 404,
          error: true,
          message: msg.NOTFOUND,
        });
      } else {
        const userLogin = results[0];
        console.log(userLogin);
        if (userLogin.isdelete) {
          return res.status(401).json({
            status: 401,
            message: msg.ISDELETE,
          });
        } else {
          const isvalid = await bcrypt.compare(password, userLogin.password);

          if (!isvalid) {
            return res.status(404).json({
              status: 404,
              error: true,
              message: msg.NOTMATCH,
            });
          } else {
            const { error, token } = await generateJwt(userLogin.id);
            if (error) {
              return res.status(400).json({
                status: 400,
                error: true,
                message: msg.TOKEN,
              });
            } else {
              const queryUpdateToken = 'UPDATE user SET token = ? WHERE id = ?';
              pool.query(queryUpdateToken, [token, userLogin.id], (updateError) => {
                if (updateError) {
                  console.error('Error updating token:', updateError);
                }
              });
              return res.status(201).json({
                status: 201,
                userLogin: userLogin.email,
                mobile: userLogin.mobile,
                success: true,
                token: token,
                message: msg.SUCCESS,
              });
            }
          }
        }
      }
    });

  } catch (error) {
    return res.status(500).json({
      status: 500,
      message: msg.ERROR,
    });
  }
};




//User Logout
exports.logout = async (req, res) => {
  const userId = req.currentUser;

  try {
    const results = await new Promise((resolve, reject) => {
      pool.query('SELECT * FROM user WHERE id = ?', [userId], (error, results) => {
        if (error) {
          return reject(error);
        }
        resolve(results);
      });
    });

    if (results.length === 0) {
      return res.status(404).json({
        status: 404,
        message: msg.NOTFOUND,
      });
    }

    await new Promise((resolve, reject) => {
      pool.query('UPDATE user SET token = ? WHERE id = ?', ['', userId], (updateError) => {
        if (updateError) {
          return reject(updateError);
        }
        resolve();
      });
    });

    return res.status(200).json({
      status: 200,
      message: msg.LOGOUT,
    });
  } catch (error) {
    console.error('An error occurred:', error);
    return res.status(500).json({
      status: 500,
      message: msg.ERROR,
    });
  }
};




//forgot password
exports.forgotpassword = async (req, res) => {
  const { email } = req.body;
  try {
    const otp = Math.floor(Math.random() * 10000);
    const otpExpiration = new Date(Date.now() + 2 * 60 * 1000);
    const otpExpirationIST = otpExpiration.toLocaleString("en-IN", {
      timeZone: "Asia/Kolkata",
    });

    const updateQuery = 'UPDATE user SET otp = ?, otpExpiration = ? WHERE email = ?';
    const updateParams = [otp, otpExpirationIST, email];

    pool.query(updateQuery, updateParams, async (updateError, updateResults) => {
      if (updateError) {
        console.log(updateError);
        return res.status(500).json({
          status: 500,
          message: updateError.message,
        });
      }

      if (updateResults.affectedRows === 0) {
        return res.status(404).json({
          status: 404,
          message: msg.NOTFOUND,
        });
      } else {
        const transporter = nodemailer.createTransport({
          host: "smtp.mailtrap.io",
          port: 2525,
          auth: {
            user: "your_mailtrap_user",
            pass: "your_mailtrap_password",
          },
        });

        const mailOptions = {
          from: "your_mailtrap_user",
          to: email,
          subject: "Reset Password",
          text: `Your OTP for password reset is: ${otp}`,
        };
        transporter.sendMail(mailOptions, (mailError) => {
          if (mailError) {
            console.log("Error sending OTP:", mailError);
            return res.status(500).json({
              status: 500,
              message: msg.INTERROR,
            });
          }

          return res.status(200).json({
            status: 200,
            message: msg.MAILSEND,
          });
        });
      }
    });
  } catch (error) {
    console.log("Error sending OTP:", error);
    return res.status(500).json({
      status: 500,
      message: msg.ERROR,
    });
  }
};




//Reset Password
exports.Resetpassword = async (req, res) => {
  const { email, password, confirmPassword } = req.body;

  if (!passwordvalidation(password)) {
    return res.status(400).json({
      status: 400,
      message: msg.PASSWORDVALID,
    });
  } else {
    try {
      const selectQuery = 'SELECT * FROM user WHERE email = ?';
      pool.query(selectQuery, [email], async (selectError, selectResults) => {
        if (selectError) {
          console.log(selectError);
          return res.status(500).json({
            status: 500,
            message: selectError.message,
          });
        }

        if (selectResults.length === 0) {
          return res.status(404).json({
            status: 404,
            message: msg.NOTFOUND,
          });
        } else {
          const user = selectResults[0];

          if (password !== confirmPassword) {
            return res.status(400).json({
              status: 400,
              message: msg.PASSNOTMATCH,
            });
          } else if (
            user.otpExpiration <
            new Date().toLocaleString("en-IN", {
              timeZone: "Asia/Kolkata",
            })
          ) {
            return res.status(400).json({
              status: 400,
              message: msg.SESSONOUT,
            });
          } else {
            const hashedPassword = await passwordencrypt(password);

            const updateQuery = 'UPDATE user SET password = ? WHERE email = ?';
            const updateParams = [hashedPassword, email];

            pool.query(updateQuery, updateParams, (updateError) => {
              if (updateError) {
                console.log(updateError);
                return res.status(500).json({
                  status: 500,
                  message: updateError.message,
                });
              }

              return res.status(201).json({
                status: 201,
                message: msg.PASSRESTSUCC,
              });
            });
          }
        }
      });
    } catch (error) {
      console.log("Error resetting password:", error);
      return res.status(500).json({
        status: 500,
        message: msg.INTERROR,
      });
    }
  }
};





//update user profile
exports.updateProfile = async (req, res) => {
  try {
    const _id = req.params.id;

    const selectQuery = 'SELECT * FROM user WHERE id = ?';
    pool.query(selectQuery, [_id], async (selectError, selectResults) => {
      if (selectError) {
        console.log(selectError);
        return res.status(400).json({
          status: 400,
          Msg: msg.ERROR2,
        });
      }

      if (selectResults.length === 0) {
        return res.status(400).json({
          status: 400,
          Msg: msg.NOTFOUND,
        });
      } else {
        if (req.files && req.files.profile) {
          const profileUrl = `${frontEndUrl}/profile/${req.files.profile[0].filename}`;

          const updateProfileQuery = 'UPDATE user SET profile = ? WHERE id = ?';
          pool.query(updateProfileQuery, [profileUrl, _id], (updateError) => {
            if (updateError) {
              console.log(updateError);
              return res.status(400).json({
                status: 400,
                Msg: msg.ERROR2,
              });
            }

            return res.status(200).json({
              status: 200,
              Msg: msg.PROUPDSUCC,
              profileUrl,
            });
          });
        } else {
          return res.status(400).json({
            status: 400,
            Msg: msg.UPLOAD,
          });
        }
      }
    });
  } catch (error) {
    console.error("Error updating profile:", error);
    res.status(400).json({
      status: 400,
      Msg: msg.ERROR2,
    });
  }
};