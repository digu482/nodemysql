const express = require("express")
const mysql = require('mysql');
const bcrypt = require("bcrypt")


async function passwordencrypt (password) {

    let salt = await bcrypt.genSalt(10);
    let passwordHash = bcrypt.hash(password, salt);
    return passwordHash;

}

function passwordvalidation(password) {
    const passvalid = /^[a-zA-Z0-9@#$&%]+$/;
    // const passvalid = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[@#$&%])(?!.*\s).{6,10}$/;    
    return passvalid.test(password);
}


 module.exports = { passwordencrypt, passwordvalidation }