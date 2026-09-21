const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/reportController');

router.get('/', ctrl.getReports);
router.get('/export/donations', ctrl.exportDonations);
router.get('/export/expenses', ctrl.exportExpenses);
router.get('/export/payroll', ctrl.exportPayroll);

module.exports = router;
