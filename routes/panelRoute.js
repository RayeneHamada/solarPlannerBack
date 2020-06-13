const express = require('express');
const router = express.Router();
const jwtHelper = require('../config/jwtHelper');
const main_controller = require('../controllers/panelController');


router.post('/new',jwtHelper.verifyJwtToken, main_controller.newPanel);
router.get('/',jwtHelper.verifyAdminJwtToken, main_controller.AllPanels);
router.get('/globals',jwtHelper.verifyJwtToken, main_controller.GlobalPanels);
router.get('/myPanels',jwtHelper.verifyJwtToken, main_controller.myPanels);

router.delete('/delete/:id',jwtHelper.verifyAdminJwtToken, main_controller.deletePanel);










module.exports = router;