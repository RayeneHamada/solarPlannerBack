const express = require('express');
const router = express.Router();

const main_controller = require('../controllers/projectController');


router.post('/new', main_controller.test);
router.get('/getpower/:lat/:long', main_controller.estimation);
module.exports = router;