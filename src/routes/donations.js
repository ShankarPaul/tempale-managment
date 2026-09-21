const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/donationController');

router.get('/', ctrl.getAll);
router.get('/donors', ctrl.getDonors);
router.post('/donors', ctrl.createDonor);
router.get('/search-donors', ctrl.searchDonors);
router.post('/cash', ctrl.createCash);
router.post('/commodity', ctrl.createCommodity);
router.get('/receipt/:type/:id', ctrl.getReceipt);

module.exports = router;
