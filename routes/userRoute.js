const express = require('express');
const router = express.Router();
const jwtHelper = require('../config/jwtHelper');
const main_controller = require('../controllers/userController');


router.post('/register', main_controller.register);
router.post('/auth', main_controller.authenticate);
router.get('/userprofile',jwtHelper.verifyUserJwtToken,main_controller.userProfile);
router.get('/usersList',main_controller.usersList);
router.get('/reset/:email',main_controller.sendPasswordResetEmail);
router.post('/reset',jwtHelper.verifyPasswordResetJwtToken,main_controller.receiveNewPassword);
router.delete('/delete/:id',main_controller.user_delete);



module.exports = router;