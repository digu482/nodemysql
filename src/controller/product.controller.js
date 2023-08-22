const express = require("express")
const pool = require("../config/db")
const mysql = require('mysql');
require("dotenv").config();
const msg = require("../utils/ResponseMessage.json")
const {adminverifyToken} = require("../middleware/Auth")
const jwt = require("jsonwebtoken");
const frontEndUrl =  'http://localhost:5000'






//admin add product
exports.addproduct = async (req, res) => {
    try {
      let {
        productcode,
        productName,
        price,
        category,
        quantity
      } = req.body;
  
      const existQuery = 'SELECT * FROM product WHERE productName = ? OR price = ?';
      pool.query(existQuery, [productName, price], async (existError, existResults) => {
        if (existError) {
          console.log(existError);
          return res.status(400).json({
            status: 400,
            message: existError.message,
          });
        }
  
        if (existResults.length > 0) {
          return res.status(400).json({
            status: 400,
            auth: false,
            message: msg.PEXIST,
          });
        } else {
          productcode = Math.floor(Math.random().toFixed(4) * 9999);
  
          const insertQuery = 'INSERT INTO product (productcode, productName, price, category, quantity, productImages) VALUES (?, ?, ?, ?, ?, ?)';
          pool.query(insertQuery, [productcode, productName, price, category, quantity, JSON.stringify(req.productImagesUrls)], (insertError, insertResults) => {
            if (insertError) {
              console.log(insertError);
              return res.status(400).json({
                status: 400,
                message: insertError.message,
              });
            }
  
            const selectCreatedProductQuery = 'SELECT * FROM product WHERE id = ?';
            pool.query(selectCreatedProductQuery, [insertResults.insertId], (selectCreatedError, createdResults) => {
              if (selectCreatedError) {
                console.log(selectCreatedError);
                return res.status(400).json({
                  status: 400,
                  message: selectCreatedError.message,
                });
              }
  
              const createdProduct = createdResults[0];
              return res.status(200).json({
                status: 200,
                message: msg.ADD,
                data: createdProduct,
              });
            });
          });
        }
      });
    } catch (error) {
      console.log(error);
      return res.status(500).json({
        status: 500,
        message: msg.ERROR,
      });
    }
};





//find all product
exports.findall = async (req, res) => {
    try {
      const selectQuery = 'SELECT * FROM product';
      pool.query(selectQuery, (error, results) => {
        if (error) {
          console.log(error);
          return res.status(500).json({
            status: 500,
            error: true,
            message: msg.ERROR,
          });
        }
  
        if (results.length === 0) {
          return res.status(404).json({
            status: 404,
            error: true,
            message: msg.NOTFOUND,
          });
        } else {
          res.status(200).json({
            status: 200,
            productdata: results,
            message: msg.LOGIN,
          });
        }
      });
    } catch (error) {
      console.log(error);
      res.status(500).json({
        status: 500,
        error: true,
        message: msg.ERROR,
      });
    }
};





//product find
exports.productfind = async (req, res) => {
    try {
      const _id = req.params.id;
      const selectQuery = 'SELECT * FROM product WHERE id = ?';
      pool.query(selectQuery, [_id], (error, results) => {
        if (error) {
          console.log(error);
          return res.status(500).json({
            status: 500,
            error: true,
            message: msg.ERROR,
          });
        }
  
        if (results.length === 0) {
          return res.status(404).json({
            status: 404,
            error: true,
            message: msg.NOTFOUND,
          });
        } else {
          const productdata = results[0];
          res.status(200).json({
            status: 200,
            productdata,
            message: msg.LOGIN,
          });
        }
      });
    } catch (error) {
      console.log(error);
      res.status(500).json({
        status: 500,
        error: true,
        message: msg.ERROR,
      });
    }
};





//update product
exports.updateproduct = async (req, res) => {
    try {
      const _id = req.params.id;
      const selectQuery = 'SELECT * FROM product WHERE id = ?';
      pool.query(selectQuery, [_id], async (selectError, selectResults) => {
        if (selectError) {
          console.log(selectError);
          return res.status(500).json({
            status: 500,
            message: msg.ERROR,
          });
        }
  
        if (selectResults.length === 0) {
          return res.status(404).json({
            status: 404,
            message: msg.NOTFOUND,
          });
        } else {
          const updateQuery = 'UPDATE product SET ? WHERE id = ?';
          pool.query(updateQuery, [req.body, _id], (updateError, updateResults) => {
            if (updateError) {
              console.log(updateError);
              return res.status(500).json({
                status: 500,
                message: msg.ERROR,
              });
            }
            
            res.status(200).json({
              status: 200,
              message: msg.USERUPSUCC,
            });
          });
        }
      });
    } catch (error) {
      console.log(error);
      res.status(500).json({
        status:500,
        message:msg.ERROR
      });
    }
};





//product delete
exports.productdelete = async (req, res) => {
    try {
      const _id = req.params.id;
      const selectQuery = 'SELECT * FROM product WHERE id = ?';
      pool.query(selectQuery, [_id], async (selectError, selectResults) => {
        if (selectError) {
          console.log(selectError);
          return res.status(500).json({
            status: 500,
            message: msg.ERROR1,
          });
        }
  
        if (selectResults.length === 0) {
          return res.status(400).json({
            status: 400,
            message: msg.PNOTFOUND,
          });
        } else {
          const updateQuery = 'UPDATE product SET isdelete = 1 WHERE id = ?';
          pool.query(updateQuery, [_id], (updateError, updateResults) => {
            if (updateError) {
              console.log(updateError);
              return res.status(500).json({
                status: 500,
                message: msg.ERROR1,
              });
            }
  
            res.status(200).json({
              status: 200,
              message: msg.PDELETE,
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