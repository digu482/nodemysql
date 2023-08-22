var mysql = require('mysql');
const pool = require("../config/db")

pool.getConnection(function(err, connection) {
  if (err) {
    throw err;
  }

  console.log('Connected to the database');

  var createTableQuery = `
    CREATE TABLE IF NOT EXISTS product (
      id INT AUTO_INCREMENT PRIMARY KEY,
      productcode VARCHAR(255),
      productName VARCHAR(255),
      price DECIMAL(10, 2),
      category VARCHAR(255),
      quantity INT,
      productImages JSON,
      isdelete BOOLEAN DEFAULT 0
    ) `;

  connection.query(createTableQuery, function (err, result) {
    connection.release(); // Release the connection back to the pool
    if (err) {
      throw err;
    }
    console.log("Table 'product' created");
  });
});

module.exports = pool;
