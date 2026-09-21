const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/poojaController');

router.get('/', ctrl.getAll);
router.post('/', ctrl.create);
router.put('/:id/status', ctrl.updateStatus);
router.get('/:id/slip', ctrl.getSlip);

module.exports = router;
