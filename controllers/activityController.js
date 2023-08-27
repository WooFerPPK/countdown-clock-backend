/**
 * @module activityController
 * Handles routes related to clock activities.
 */
const express = require('express');
const router = express.Router();
const { getActivityLogById, getTimeActivitiesById, revertLastTimeActivity } = require('../models/clockModel');
const { handleError } = require('../utils/errorUtils');

/**
 * Fetch the activity log by clock ID.
 * @route GET /clocks/:id
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Array} 200 - An array containing the activity log
 * @returns {Array} 200 - An empty array if no activity log is found
 */
router.get('/clocks/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const activityLog = await getActivityLogById(id);
    if (!activityLog) {
        return res.status(200).send([]);
    }
    res.status(200).send(activityLog);
  } catch (error) {
    handleError(error, res);
  }
});

/**
 * Fetch the time activities by clock ID.
 * @route GET /clocks/:id/history
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Array} 200 - An array containing time activities
 * @returns {Array} 200 - An empty array if no time activities are found
 */
router.get('/clocks/:id/history', async (req, res) => {
  try {    
    const id = req.params.id;
    const timeActivities = await getTimeActivitiesById(id);

    if (!timeActivities) {
        return res.status(200).send([]);
    }

    res.status(200).send(timeActivities);
  } catch (error) {
    handleError(error, res);
  }
});

/**
 * Revert the last time activity for a clock by ID.
 * @route POST /clocks/:id/revert
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} 200 - Object with message indicating success or failure
 */
router.post('/clocks/:id/revert', async (req, res) => {
  try {    
    const id = req.params.id;
    const revertedActivity = await revertLastTimeActivity(id);

    if (!revertedActivity) {
        return res.status(200).send({ message:'No time activity found to revert'});
    }

    res.status(200).send({ message: `Successfully reverted last time activity: ${revertedActivity.type} of ${revertedActivity.amount} milliseconds` });
  } catch (error) {
    handleError(error, res);
  }
});
  
module.exports = router;