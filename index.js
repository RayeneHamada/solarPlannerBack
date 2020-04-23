require('./models/userModel');
require('./models/projectModel');
require('./config/dbConfig');
require('./config/passportConfig');
require('./config/config');



const express = require("express");
const bodyParser = require("body-parser");
const cors = require('cors');
const projectRoute = require('./routes/projectRoute');
const userRoute = require('./routes/userRoute');
const passport = require('passport');

const app = express();
app.use(cors());
app.use(passport.initialize())
app.use(bodyParser.urlencoded({ extended: false }))
 
app.use(bodyParser.json())

app.use('/project', projectRoute);
app.use('/user', userRoute);


let port = process.env.PORT || 8000;
app.listen(port, function (req, res) {
    console.log("it works");
})