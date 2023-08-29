/**
 * @module keyholderClockController
 * Defines the API routes for actions on clocks like add, subtract, pause.
 */
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { updateClockById, getClockById, deleteClockById, logActivity, revertLastTimeActivity, logTimeActivity, createOrUpdatePauseData, getPauseDataByClockId, deletePauseDataByClockId } = require('../models/clockModel');
const { deleteNotificationById } = require('../models/notificationModel/index');
const { millisecondsToHumanReadable, calculateRemainingTime } = require('../utils/timeUtils');
const messageTemplates = require('../utils/messageTemplate');
const { handleError } = require('../utils/errorUtils');

/**
 * Middleware to authenticate a request using JWT.
 * @param {Object} req - The Express request object.
 * @param {Object} res - The Express response object.
 * @param {Function} next - The next middleware function.
 */
const authenticate = (req, res, next) => {
    const token = req.headers['authorization']?.replace('Bearer ', '');
    const clockId = req.params.id;
    
    if (!token) {
        return res.status(401).send({ error: 'No token provided'});
    }
    
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
        if (decoded.clockId !== clockId) {
            return res.status(400).send({ error: 'Invalid token'});
        } else {
            next();
        }
    } catch (error) {
        if (error instanceof jwt.TokenExpiredError) {
            return res.status(401).send({ error: 'Token has expired'});
        }

        handleError(error, res);
    }
};

const replacePlaceholders = (template, placeholders) => {
    let message = template;
    for (const [key, value] of Object.entries(placeholders)) {
        message = message.replace(new RegExp(`%${key}%`, 'g'), value);
    }
    return message;
};

const handleActivityLogging = async (id, action, placeholders = {}) => {
    const messageTemplate = messageTemplates[action];
    if (!messageTemplate) return;

    const message = replacePlaceholders(messageTemplate, placeholders);
    await logActivity(id, message);
};

/**
 * Logs clock activity and optional time-based activity.
 * @param {string} id - The clock's ID.
 * @param {string} action - The action performed.
 * @param {number} [time] - The time associated with the action, if applicable.
 */
// const handleActivityLogging = async (id, message) => {
//     await logActivity(id, message);
// };

// const handleTimeActivityLogging = async (clock, id, action, time) => {
//     const message = `${clock.username} ${(action === 'added') ? 'dictates an extra' : 'grants you a'} ${millisecondsToHumanReadable(time)} ${(action === 'added') ? 'wait' : 'reprieve'}`;
    
//     await handleActivityLogging(id, message);
//     await logTimeActivity(id, `TIME_${action.toUpperCase()}`, time);
// };

/**
 * Gets a clock by ID and handles a 404 error if not found.
 * @param {string} id - The clock's ID.
 * @param {Object} res - The Express response object.
 * @returns {Object|null} The clock object or null if not found.
 */
const getClockAndHandleError = async (id, res) => {
    const clock = await getClockById(id);
    if (!clock) {
        res.status(404).send({ error: 'Clock not found' });
        return null;
    }
    return clock;
};

/**
 * Adds time to a specific clock.
 * @route PUT /clocks/:id/add
 * @param {Object} req - The Express request object.
 * @param {Object} res - The Express response object.
 */
router.put('/clocks/:id/add', authenticate, async (req, res) => {
    try {
        const id = req.params.id;
        const clock = await getClockAndHandleError(id, res);
        if (!clock) return;
        
        const addTime = req.body.addTime;
        await handleActivityLogging(id, 'TIME_ADDED', { username: clock.username, time: millisecondsToHumanReadable(addTime) });
        const endTime = new Date(clock.endTime).getTime();
        const newTime = new Date(endTime + addTime).getTime();
        await updateClockById(id, { endTime: newTime });
        
        res.status(200).send({ message: `${addTime} milliseconds added successfully` });
    } catch (err) {
        handleError(err, res);
    }
});

/**
 * Subtracts time from a specific clock.
 * @route PUT /clocks/:id/subtract
 * @param {Object} req - The Express request object.
 * @param {Object} res - The Express response object.
 */
router.put('/clocks/:id/subtract', authenticate, async (req, res) => {
    try {
        const id = req.params.id;
        const clock = await getClockAndHandleError(id, res);
        if (!clock) return;

        const subtractTime = req.body.subtractTime;
        await handleActivityLogging(id, 'TIME_SUBTRACTED', { username: clock.username, time: millisecondsToHumanReadable(subtractTime) });
        
        let newTime;
        const currentTime = new Date().getTime();
        const endTime = new Date(clock.endTime).getTime();
        if (endTime - subtractTime <= currentTime) {
            newTime = currentTime;
        } else {
            newTime = endTime - subtractTime;
        }
        
        await updateClockById(id, { endTime: newTime });

        res.status(200).send({ message: `${subtractTime} milliseconds subtracted successfully` });
    } catch (err) {
        handleError(err, res);
    }
});

/**
 * Pauses or unpauses a specific clock.
 * @route PUT /clocks/:id/pause
 * @param {Object} req - The Express request object.
 * @param {Object} res - The Express response object.
 */
router.put('/clocks/:id/pause', authenticate, async (req, res) => {
    try {
        const id = req.params.id;
        const pauseState = req.body.pause;
        const clock = await getClockAndHandleError(id, res);
        if (!clock) return;
        
        if (clock.paused === pauseState) {
            res.status(400).send({ message: `Clock is already ${pauseState ? 'paused' : 'unpaused'}` });
            return;
        }

        const currentTime = new Date().getTime();

        if (pauseState) {
            // paused
            await createOrUpdatePauseData(id, { pauseStartTime: currentTime });
            await updateClockById(id, { paused: true });
        } else {
            //unpaused
            const pauseData = await getPauseDataByClockId(id) || {};
            if (pauseData.pauseStartTime) {
                const pauseDuration = currentTime - pauseData.pauseStartTime;
                const newEndTime = new Date(clock.endTime).getTime() + pauseDuration;
                await updateClockById(id, {
                    paused: false,
                    endTime: newEndTime
                });
                await deletePauseDataByClockId(id);
            }
        }

        if (pauseState) {
            await handleActivityLogging(id, 'PAUSED', { username: clock.username });
        } else {
            await handleActivityLogging(id, 'RESUMED', { username: clock.username });
        }
        
        res.status(200).send({ message: `Clock ${pauseState ? 'paused' : 'unpaused'} successfully` });
    } catch (err) {
        handleError(err, res);
    }
});

/**
 * Revert the last time activity for a clock by ID.
 * @route POST /clocks/:id/revert
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} 200 - Object with message indicating success or failure
 */
router.post('/clocks/:id/revert',authenticate, async (req, res) => {
    try {    
        const id = req.params.id;
        const clock = await getClockAndHandleError(id, res);
        if (!clock) return;
        const revertedActivity = await revertLastTimeActivity(id);

        if (!revertedActivity) {
            return res.status(200).send({ message:'No time activity found to revert'});
        }

        if (revertedActivity.type === "TIME_ADDED") {
            await handleActivityLogging(id, 'REVERT_SUBTRACT', { username: clock.username, time: millisecondsToHumanReadable(revertedActivity.amount) });
        } else {
            await handleActivityLogging(id, 'REVERT_ADD', { username: clock.username, time: millisecondsToHumanReadable(revertedActivity.amount) });
        }

        res.status(200).send({ message: `Successfully reverted last time activity: ${revertedActivity.type} of ${revertedActivity.amount} milliseconds` });
    } catch (error) {
        handleError(error, res);
    }
});

/**
 * Handles DELETE request to delete a clock by its ID.
 * @route DELETE /:id
 * @param {Object} req - The Express request object.
 * @param {Object} res - The Express response object.
 */
router.delete('/clocks/:id', authenticate, async (req, res) => {
    try {
        const id = req.params.id;
        const clock = await getClockById(id);
        await deleteNotificationById(clock.notificationId);
        await deletePauseDataByClockId(id);
        const deletedCount = await deleteClockById(id);
        if (deletedCount === 0) {
            return res.status(404).send({ error: 'Clock not found' });
        } else {
            return res.status(200).send({ message: 'Clock deleted successfully' });
        }
    } catch (error) {
        handleError(error, res);
    }
});

module.exports = router;
