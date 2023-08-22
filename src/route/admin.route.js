const express = require('express');
const mysql = require('mysql');
const router = express.Router();
const pool = require('../config/db');
const controller = require("../controller/admin.controller")
const {adminverifyToken} = require("../middleware/Auth")
const Emailservices = require("../services/Emailservices")


router.post("/create",controller.admincreate)
router.post("/login",controller.adminLogin);
router.post("/logout", adminverifyToken,controller.logout);
router.post("/adminchangepassword",adminverifyToken,controller.adminchangepassword);



router.post("/usercreate",adminverifyToken,controller.admincreateuser);
router.get("/adminfindalluser",adminverifyToken,controller.adminfindalluser)
router.delete("/admindeleteuser",adminverifyToken,controller.admindeleteuser)
router.post("/adminreactivateuser",adminverifyToken,controller.adminreactivateuser)
router.patch("/adminupdateuser/:id",adminverifyToken,controller.adminupdateuser)



router.post("/adminforgotpassword",controller.adminforgotpassword)
router.post("/adminverifyOTP", Emailservices.adminverifyOTP);
router.post("/adminResetpassword",controller.adminResetpassword)



module.exports = router;