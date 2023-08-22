var mysql = require('mysql');
const pool = require("../config/db")

pool.getConnection(function(err, connection) {
  if (err) {
    throw err;
  }

  console.log('Connected to the database');

  var createTableQuery = `
    CREATE TABLE IF NOT EXISTS user (
      id INT AUTO_INCREMENT PRIMARY KEY,
      username VARCHAR(255),
      firstName VARCHAR(255),
      lastName VARCHAR(255),
      email VARCHAR(255),
      mobile VARCHAR(13),
      password VARCHAR(255)
    ) `;

  connection.query(createTableQuery, function (err, result) {
    connection.release(); // Release the connection back to the pool
    if (err) {
      throw err;
    }
    console.log("Table 'user' created");
  });
});

module.exports = pool;