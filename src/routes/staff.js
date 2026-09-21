const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/staffController');

router.get('/', ctrl.getAll);
router.get('/add', ctrl.getAdd);
router.post('/', ctrl.create);
router.get('/attendance', ctrl.getAttendance);
router.post('/attendance', ctrl.markAttendance);
router.post('/attendance/mark-all', ctrl.markAllPresent);
router.post('/payroll/generate', ctrl.generatePayroll);
router.get('/salary-slip/:id/:month', ctrl.getSalarySlip);
router.post('/advance', ctrl.addAdvance);
router.get('/:id', ctrl.getOne);
router.put('/:id', ctrl.update);
router.delete('/:id', ctrl.delete);

module.exports = router;
