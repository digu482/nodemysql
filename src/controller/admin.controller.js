const express = require("express")
const pool =require("../config/db")
const mysql = require('mysql');
const bcrypt =require("bcrypt")
require("dotenv").config();
const {passwordencrypt} = require("../services/commonservices")
const {passwordvalidation} = require("../services/commonservices")
const msg = require("../utils/ResponseMessage.json")
const jwt = require('jsonwebtoken');
const {admingenerateJwt} =require("../utils/jwt")
const {adminverifyToken} = require("../middleware/Auth")
const transporter = require("../config/Emailconfig")
const nodemailer = require('nodemailer');
const otpGenerator = require('otp-generator');


//admin create
exports.admincreate = async (req, res) => {
  try {
    const checkAdminQuery = 'SELECT COUNT(*) AS adminCount FROM admin';
    pool.query(checkAdminQuery, async (checkAdminError, checkAdminResults) => {
      if (checkAdminError) {
        console.log(checkAdminError);
        return res.status(400).json({
          status: 400,
          message: checkAdminError.message,
        });
      }

      const adminCount = checkAdminResults[0].adminCount;

      if (adminCount > 0) {
        return res.status(400).json({
          status: 400,
          message: msg.EXIST1,
        });
      }

      const { adminName, email, mobile, password } = req.body;

      const hashedPassword = await passwordencrypt(password);

      const insertQuery = 'INSERT INTO admin (adminName, email, mobile, password) VALUES (?, ?, ?, ?)';
      pool.query(insertQuery, [adminName, email, mobile, hashedPassword], (insertError, insertResults) => {
        if (insertError) {
          console.log(insertError);
          return res.status(400).json({
            status: 400,
            message: insertError.message,
          });
        }

        return res.status(201).json({
          status: 201,
          message: msg.CREATE1,
          data: {
            id: insertResults.insertId,
            adminName,
            email,
            mobile,
          },
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




//admin login
exports.adminLogin = async (req, res) => {
    try {
      const { email, mobile, password } = req.body;
  
      const selectdata =
          'SELECT * FROM admin WHERE email = ? ';
        pool.query(selectdata, [email], async (err, results) => {
          if (err) {
            return res.status(404).json({
              status: 404,
              message: msg.NOTFOUND1,
            });
          }
  
          if (!results || results.length === 0) {
            return res.status(404).json({
              status: 404,
              error: true,
              message: msg.NOTFOUND1,
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
                const { error, token } = await admingenerateJwt(userLogin.id);
                if (error) {
                  return res.status(400).json({
                    status: 400,
                    error: true,
                    message: msg.TOKEN,
                  });
                } else {
                  const queryUpdateToken = 'UPDATE admin SET token = ? WHERE id = ?';
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
                    message: msg.SUCCESS1,
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




//admin Logout
exports.logout = (req, res) => {
    const userId = req.currentadmin;
    
    pool.query('SELECT * FROM admin WHERE id = ?', [userId], (error, results) => {
      if (error) {
        console.log(error);
        return res.status(400).json({
          status: 400,
          message: error.message,
        });
      }
      
      if (results.length === 0) {
        return res.status(404).json({
          status: 404,
          message: msg.NOTFOUND1,
        });
      }
      
      pool.query('UPDATE admin SET token = ? WHERE id = ?', ['', userId], (updateError) => {
        if (updateError) {
          console.log(updateError);
          return res.status(500).json({
            status: 500,
            message: msg.ERROR,
          });
        }
        
        return res.status(200).json({
          status: 200,
          message: msg.LOGOUT1,
        });
      });
    });
};





// Change Password
exports.adminchangepassword = async (req, res) => {
    const { email, currentPassword, newPassword, confirmPassword } = req.body;
    try {
      const selectQuery = 'SELECT * FROM admin WHERE email = ?';
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
            message: msg.NOTFOUND1,
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
        const updateQuery = 'UPDATE admin SET password = ? WHERE email = ?';
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





//forgot password
exports.adminforgotpassword = async (req, res) => {
  const { email } = req.body;
  try {
    const otp = Math.floor(Math.random() * 10000);
    const otpExpiration = new Date(Date.now() + 2 * 60 * 1000);
    const otpExpirationIST = otpExpiration.toLocaleString("en-IN", {
      timeZone: "Asia/Kolkata",
    });

    const updateQuery = 'UPDATE admin SET otp = ?, otpExpiration = ? WHERE email = ?';
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
          from: "your_mailtrap_admin",
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





//Reset passwod
exports.adminResetpassword = async (req, res) => {
  const { email, password, confirmPassword } = req.body;

  if (!passwordvalidation(password)) {
    return res.status(400).json({
      status: 400,
      message: msg.PASSWORDVALID,
    });
  } else {
    try {
      const selectQuery = 'SELECT * FROM admin WHERE email = ?';
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
          } else if (user.otpExpiration < new Date().toLocaleString("en-IN", {timeZone: "Asia/Kolkata",})) {
            return res.status(400).json({
              status: 400,
              message: msg.SESSONOUT,
            });
          } else {
            const hashedPassword = await passwordencrypt(password);

            const updateQuery = 'UPDATE admin SET password = ? WHERE email = ?';
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





//admin create user
exports.admincreateuser = async (req, res) => {
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

      const insertQuery = 'INSERT INTO user (username, firstName, lastName, email, mobile, password) VALUES (?, ?, ?, ?, ?, ?)';
      pool.query(insertQuery, [username, firstName, lastName, email, mobile, hashedPassword], (insertError, insertResults) => {
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




//admin find all user
exports.adminfindalluser = async (req, res) => {
  try {
    const selectQuery = 'SELECT * FROM user';
    pool.query(selectQuery, (selectError, userData) => {
      if (selectError) {
        console.log(selectError);
        return res.status(400).json({
          status: 400,
          message: selectError.message,
        });
      }

      if (userData.length === 0) {
        return res.status(400).json({
          status: 400,
          error: true,
          message: msg.NOTFOUND,
        });
      } else {
        res.status(200).json({
          status: 200,
          userdata: userData,
          Msg: msg.LOGIN,
        });
      }
    });
  } catch (error) {
    console.log(error);
    return res.status(400).json({
      status: 400,
      message: error.message,
    });
  }
};





//admin delete user
exports.admindeleteuser = async (req, res) => {
  try {
    const {id} = req.body;

    const selectQuery = 'SELECT * FROM user WHERE id = ?';
    pool.query(selectQuery, [id], async (selectError, user) => {
      if (selectError) {
        console.log(selectError);
        return res.status(400).json({
          status: 400,
          message: msg.ERROR1,
        });
      }

      if (user.length === 0) {
        return res.status(404).json({
          status: 404,
          message: msg.NOTFOUND,
        });
      } else {
        const updateQuery = 'UPDATE user SET isdelete = ? WHERE id = ?';
        pool.query(updateQuery, [true, id], (updateError, updateResult) => {
          if (updateError) {
            console.log(updateError);
            return res.status(400).json({
              status: 400,
              message: msg.ERROR1,
            });
          }

          return res.status(200).json({
            status: 200,
            message: msg.DELETE,
          });
        });
      }
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      status: 500,
      message: msg.ERROR1,
    });
  }
};






//admin retrive user
exports.adminreactivateuser = async (req, res) => {
  try {
    const {id} = req.body;

    const selectQuery = 'SELECT * FROM user WHERE id = ?';
    pool.query(selectQuery, [id], async (selectError, user) => {
      if (selectError) {
        console.log(selectError);
        return res.status(400).json({
          status: 400,
          message: msg.ERROR1,
        });
      }

      if (user.length === 0) {
        return res.status(404).json({
          status: 404,
          message: msg.NOTFOUND,
        });
      } else {
        const updateQuery = 'UPDATE user SET isdelete = ? WHERE id = ?';
        pool.query(updateQuery, [false, id], (updateError, updateResult) => {
          if (updateError) {
            console.log(updateError);
            return res.status(400).json({
              status: 400,
              message: msg.ERROR1,
            });
          }

          return res.status(200).json({
            status: 200,
            message: msg.REACTIVATE,
          });
        });
      }
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      status: 500,
      message: msg.ERROR1,
    });
  }
};





//admin update user
exports.adminupdateuser = async (req, res) => {
  try {
    const id = req.params.id;

    const selectQuery = 'SELECT * FROM user WHERE id = ?';
    pool.query(selectQuery, [id], (selectError, selectResults) => {
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
      const updateParams = [...updateValues, id];

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
    return res.status(500).json({
      status: 500,
      message: error.message,
    });
  }
};