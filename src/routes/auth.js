const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/authController');

router.get('/login', ctrl.getLogin);
router.post('/login', ctrl.postLogin);
router.get('/signup', ctrl.getSignup);
router.post('/signup', ctrl.postSignup);
router.get('/logout', ctrl.logout);

module.exports = router;
