const express = require('express');
const router = express.Router();
const jwtHelper = require('../config/jwtHelper');
const main_controller = require('../controllers/userController');


router.post('/register', main_controller.register);
router.post('/auth', main_controller.authenticate);
router.post('/googleauth', main_controller.test);

router.get('/userprofile',jwtHelper.verifyJwtToken,main_controller.userProfile);
router.get('/usersList',main_controller.usersList);
router.get('/reset/:email',main_controller.sendPasswordResetEmail);
router.post('/reset',jwtHelper.verifyPasswordResetJwtToken,main_controller.receiveNewPassword);
router.delete('/delete/:id',jwtHelper.verifyAdminJwtToken,main_controller.user_delete);
router.put('/updateProfile',jwtHelper.verifyJwtToken,main_controller.updateFullName);
router.put('/updatePassword',jwtHelper.verifyJwtToken,main_controller.updatePassword);
router.get('/profile/:id',jwtHelper.verifyAdminJwtToken,main_controller.admin_user_profile);






module.exports = router;