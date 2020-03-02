const express = require("express");
// const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const cors = require('cors');
const main = require('./routes/mainRoute');
const app = express();
app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }))
 
app.use(bodyParser.json())

app.use('/pv', main);

let port = 1235;
app.listen(port, function (req, res) {
    console.log("hola chicas");
})