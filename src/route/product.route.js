const express = require('express');
const mysql = require('mysql');
const router = express.Router();
const pool = require('../config/db');
const controller = require("../controller/product.controller")
const {adminverifyToken} = require("../middleware/Auth")
const uploadFile = require("../middleware/upload")


router.post("/addproduct",adminverifyToken,uploadFile,controller.addproduct)
router.get("/findallproduct",controller.findall);
router.get("/productfind/:id",controller.productfind);
router.patch("/updateproduct/:id",adminverifyToken,controller.updateproduct);
router.delete("/productdelete/:id",adminverifyToken,controller.productdelete)


module.exports = router;