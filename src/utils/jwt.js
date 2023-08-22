const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const pool = require("../config/db")
const mysql = require('mysql');

const {key_Token,adminkey_Token} = process.env;
const options = {
 
    expiresIn: "24h",
  };
  
  async function generateJwt( id ) {
    try {
      const payload = { id };
      const token = jwt.sign(payload, key_Token, options);
      return { error: false, token: token };
    } catch (error) {
      return { error: true };
    }
  }



  async function admingenerateJwt( id ) {
    try {
      const payload = { id };
      const token = jwt.sign(payload, adminkey_Token, options);
      return { error: false, token: token };
    } catch (error) {
      return { error: true };
    }
  }


module.exports = {generateJwt,admingenerateJwt};






  
  
  
  
  
  