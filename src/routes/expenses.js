const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/expenseController');

router.get('/', ctrl.getAll);
router.get('/daybook', ctrl.getDaybook);
router.post('/', ctrl.addExpense);
router.delete('/:id', ctrl.deleteExpense);

module.exports = router;
