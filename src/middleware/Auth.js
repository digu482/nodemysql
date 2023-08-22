const express = require('express');
const mysql = require('mysql');
const pool = require("../config/db")
const jwt = require("jsonwebtoken")
const msg = require("../utils/ResponseMessage.json")
const { key_Token,adminkey_Token } = process.env;

const userverifyToken = (req, res, next) => {
  const token = req.body.token || req.query.token || req.headers["token"];

  if (!token) {
    return res.status(403).json({Msg: msg.AUTH});
  }
  try {
    const decodeToken = jwt.verify(token, key_Token);
    req.currentUser = decodeToken.id;

  } catch (error) {
    return res.status(401).json({Msg: "Invalid token"});
  }
  return next()
}


const adminverifyToken = (req, res, next) => {
  const admintoken = req.body.token || req.query.token || req.headers["token"];

  if (!admintoken) {
    return res.status(403).json({Msg: msg.AUTH});
  }
  try {
    const decodeToken = jwt.verify(admintoken, adminkey_Token);
    req.currentadmin = decodeToken.id;
  } catch (error) {
    return res.status(401).json({Msg:"Invalid token" });
  }
  return next()
}

module.exports = {
  userverifyToken,
  adminverifyToken
}