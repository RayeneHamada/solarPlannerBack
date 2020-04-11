const express = require('express');
const router = express.Router();
const jwtHelper = require('../config/jwtHelper');
const main_controller = require('../controllers/userController');


router.post('/register', main_controller.register);
router.post('/auth', main_controller.authenticate);
router.get('/userprofile',jwtHelper.verifyUserJwtToken,main_controller.userProfile);
router.get('/usersList',jwtHelper.verifyAdminJwtToken,main_controller.usersList);



module.exports = router;