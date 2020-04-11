const express = require('express');
const router = express.Router();
const jwtHelper = require('../config/jwtHelper');
const main_controller = require('../controllers/projectController');


router.post('/new',jwtHelper.verifyUserJwtToken,main_controller.test);
router.post('/test',main_controller.visitor_test);

router.get('/',jwtHelper.verifyUserJwtToken, main_controller.allProjects);
router.get('/dashboard', jwtHelper.verifyUserJwtToken,main_controller.dashboard);

router.delete('/delete/:id', jwtHelper.verifyUserJwtToken,main_controller.project_delete);
router.get('/details/:id', main_controller.project_details);
router.get('/energy/details/:id', main_controller.energy_details);

router.get('/plan/:id',main_controller.project_plan);



module.exports = router;