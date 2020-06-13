const express = require('express');
const router = express.Router();
const jwtHelper = require('../config/jwtHelper');
const main_controller = require('../controllers/projectController');


router.post('/new',jwtHelper.verifyUserJwtToken,main_controller.create);
router.post('/test',main_controller.visitor_test);

router.get('/',jwtHelper.verifyUserJwtToken, main_controller.allProjects);
router.get('/dashboard', jwtHelper.verifyUserJwtToken,main_controller.dashboard);
router.get('/admin_dashboard',main_controller.admin_dashboard);

router.get('/sun_path/:id',main_controller.sun_details);
router.delete('/delete/:id', jwtHelper.verifyUserJwtToken,main_controller.project_delete);
router.get('/details/:id', main_controller.project_details);
//router.get('/energy/details/:id', main_controller.energy_details);

router.get('/plan/:id',main_controller.project_plan);
router.delete('/admindelete/:id',main_controller.admin_project_delete);
router.get('/admin', main_controller.admin_all_projects);
router.get('/projects-number',main_controller.admin_all_solar_panels);
router.post('/config',main_controller.optimalConfig);



module.exports = router;