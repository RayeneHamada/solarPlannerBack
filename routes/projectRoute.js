const express = require('express');
const router = express.Router();

const main_controller = require('../controllers/projectController');


router.post('/new', main_controller.test);
router.post('/getpower', main_controller.estimation);
router.get('/', main_controller.allProjects);
router.get('/dashboard', main_controller.dashboard);

router.delete('/delete/:id', main_controller.project_delete);
router.get('/details/:id', main_controller.project_details);



module.exports = router;