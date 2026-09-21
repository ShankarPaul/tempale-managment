const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/inventoryController');

router.get('/', ctrl.getAll);
router.post('/item', ctrl.createItem);
router.post('/issue', ctrl.issueStock);
router.post('/adjust', ctrl.adjustStock);
router.get('/api/stock', ctrl.getStockApi);

module.exports = router;
