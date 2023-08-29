/**
 * @module clockController
 * Defines the API routes for clock-related operations.
 */
const express = require('express');
const router = express.Router();
const { getClockById, createClock, getAllClocks } = require('../models/clockModel');
const { millisecondsToHumanReadable, calculateRemainingTime } = require('../utils/timeUtils');
const { handleError } = require('../utils/errorUtils');


/**
 * Validates the request body for creating a new clock.
 * @param {Object} req - The Express request object.
 * @returns {string|null} - Validation error message or null if valid.
 */
const validateNewClockInput = (req) => {
    if (!req.body.hasOwnProperty('endTime')) {
        return 'Missing required field: endTime';
    }
    if (!req.body.hasOwnProperty('description')) {
        return 'Missing required field: description';
    }

    let endTime = parseInt(req.body.endTime, 10);
    if (isNaN(endTime)) {
        return 'Invalid input type: endTime should be a number';
    }

    let description = req.body.description;
    if (typeof description !== 'string') {
        return 'Invalid input type: description should be a string';
    }

    endTime = new Date(endTime).getTime();
    if (isNaN(endTime)) {
        return 'Invalid endTime value: not a valid date';
    }

    return null;
};

/**
 * Handles POST request to create a new clock.
 * @route POST /
 * @param {Object} req - The Express request object.
 * @param {Object} res - The Express response object.
 */
router.post('/', async (req, res) => {
    const validationError = validateNewClockInput(req);
    if (validationError) {
        return res.status(400).send({ error: validationError });
    }

    try {
        const endTime = new Date(parseInt(req.body.endTime, 10)).getTime();
        const description = req.body.description;
        const username = req.body.username;

        let newClock = {
            endTime,
            description,
            remainingTime: calculateRemainingTime(endTime),
            paused: false
        };

        if (username) {
            newClock.username = username;
        } else {
            newClock.username = 'Keyholder';
        }

        const id = await createClock(newClock);
        if (id) {
            return res.status(201).send({ id });
        } else {
            return res.status(500).send({ error: 'Failed to create clock' });
        }
    } catch (error) {
        handleError(error, res);
    }
});

/**
 * Handles GET request to retrieve a clock by its ID.
 * @route GET /:id
 * @param {Object} req - The Express request object.
 * @param {Object} res - The Express response object.
 */
router.get('/:id', async (req, res) => {
    try {
        const id = req.params.id;
        const clock = await getClockById(id);
        if (clock) {
            return res.status(200).send({ ...clock, pretty: millisecondsToHumanReadable(clock.remainingTime) });
        } else {
            return res.status(404).send({ error: 'Clock not found' });
        }
    } catch (error) {
        handleError(error, res);
    }
});

/**
 * Handles GET request to retrieve all clocks.
 * @route GET /
 * @param {Object} req - The Express request object.
 * @param {Object} res - The Express response object.
 */
router.get('/', async (req, res) => {
    try {
        const clocks = await getAllClocks();
        res.status(200).send(clocks);
    } catch (error) {
        handleError(error, res);
    }
});

module.exports = router;
