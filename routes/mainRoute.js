const express = require('express');
const router = express.Router();

const main_controller = require('../controllers/mainController');


router.post('/getpower', main_controller.test);
module.exports = router;