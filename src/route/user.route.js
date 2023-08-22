const express = require('express');
const mysql = require('mysql');
const router = express.Router();
const pool = require('../config/db');
const controller = require("../controller/user.controller")
const {userverifyToken} = require("../middleware/Auth")
const Emailservices = require("../services/Emailservices")
const uploadFile = require("../middleware/upload")




router.post("/create",uploadFile,controller.createuser)
router.get("/finduser",userverifyToken,controller.finduser)
router.patch("/updateuser",userverifyToken,controller.updateuser)
router.post("/changepassword",userverifyToken,controller.changepassword);
router.delete("/deleteuser",userverifyToken,controller.deleteuser)
router.patch("/updateprofile/:id",userverifyToken,uploadFile,controller.updateProfile)



router.post("/userlogin",controller.userlogin)
router.post("/logout", userverifyToken,controller.logout);



router.post("/forgotpassword",controller.forgotpassword);
router.post("/verifyOTP", Emailservices.verifyOTP);
router.post("/Resetpassword",controller.Resetpassword);



module.exports = router;