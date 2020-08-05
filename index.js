require('dotenv').config()
require('./models/userModel');
require('./models/projectModel');
require('./models/panelModel');

require('./config/dbConfig');
require('./config/passportConfig');



const express = require("express");
const bodyParser = require("body-parser");
const cors = require('cors');
const projectRoute = require('./routes/projectRoute');
const userRoute = require('./routes/userRoute');
const panelRoute = require('./routes/panelRoute');

const passport = require('passport');

const app = express();
app.use(cors());
app.use(passport.initialize())
app.use(bodyParser.urlencoded({ extended: false }))
 
app.use(bodyParser.json())

app.use('/project', projectRoute);
app.use('/user', userRoute);
app.use('/panel', panelRoute);
app.get('/test',function(req,res){res.send('bien');})
app.use('/test',express.Router().get('/test',function(req,res){res.send('bien');}));


module.exports = app;
