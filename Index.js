const express = require('express');
const app = express();
const port = process.env.PORT || 5000;
const mysql = require('mysql');
const pool =require("./src/config/db")
require("./src/model/user")
require("./src/model/admin")
require("./src/model/product")
app.use(express.json());

const productRouters = require("./src/route/product.route")
app.use("/product",productRouters)

const userRouters = require("./src/route/user.route")
app.use("/user",userRouters)

const adminRouters = require("./src/route/admin.route")
app.use("/admin",adminRouters)

app.listen(port, () => {
    console.log(`connection is setup at ${port}`);
}); 

