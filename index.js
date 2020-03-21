const express = require("express");
// const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const cors = require('cors');
const conf = require('./config/dbConfig');
const projectModel = require('./models/projectModel');
const projectRoute = require('./routes/projectRoute');
const app = express();
app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }))
 
app.use(bodyParser.json())

app.use('/project', projectRoute);

let port = 1235;
app.listen(port, function (req, res) {
    console.log("it works");
})