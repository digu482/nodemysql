var mysql = require('mysql');
const pool = require("../config/db")

pool.getConnection(function(err, connection) {
  if (err) {
    throw err;
  }

  console.log('Connected to the database');

  var createTableQuery = `
    CREATE TABLE IF NOT EXISTS admin (
      id INT AUTO_INCREMENT PRIMARY KEY,
      adminName VARCHAR(255),
      email VARCHAR(255),
      mobile VARCHAR(13),
      password VARCHAR(255)
    )`;

  connection.query(createTableQuery, function (err, result) {
    connection.release(); 
    if (err) {
      throw err;
    }
    console.log("Table 'admin' created");
  });
});

module.exports = pool;