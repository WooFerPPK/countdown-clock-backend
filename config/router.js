const express = require('express');
const clockController = require('../controllers/clockController');
const authController = require('../controllers/authController');
const activityController = require('../controllers/activityController');
const keyholderClockController = require('../controllers/keyholderClockController');
const notificationController = require('../controllers/notificationController');

const router = express.Router();

router.use('/clocks', clockController);
router.use('/auth', authController);
router.use('/activity', activityController);
router.use('/keyholder', keyholderClockController);
router.use('/notifications', notificationController);

module.exports = router;
