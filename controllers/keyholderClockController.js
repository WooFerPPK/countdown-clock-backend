/**
 * @module keyholderClockController
 * Defines the API routes for actions on clocks like add, subtract, pause.
 */
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { updateClockById, getClockById, logActivity, logTimeActivity } = require('../models/clockModel');
const { millisecondsToHumanReadable } = require('../utils/timeUtils');
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

/**
 * Logs clock activity and optional time-based activity.
 * @param {string} id - The clock's ID.
 * @param {string} action - The action performed.
 * @param {number} [time] - The time associated with the action, if applicable.
 */
const handleActivityLogging = async (id, action, time = null) => {
    const logMessage = time ? `${millisecondsToHumanReadable(time)} ${action}` : `Clock ${action} successfully`;
    await logActivity(id, logMessage);

    if (time) { 
        await logTimeActivity(id, `TIME_${action.toUpperCase()}`, time);
    }
};

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
        await handleActivityLogging(id, 'added', addTime);
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
        await handleActivityLogging(id, 'subtracted', subtractTime);
        
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
        const clock = await getClockAndHandleError(id, res);
        if (!clock) return;

        const pauseState = req.body.pause;
        await handleActivityLogging(id, pauseState ? 'paused' : 'unpaused');
        
        await updateClockById(id, { paused: pauseState });

        res.status(200).send({ message: `Clock ${pauseState ? 'paused' : 'unpaused'} successfully` });
    } catch (err) {
        handleError(err, res);
    }
});

module.exports = router;
