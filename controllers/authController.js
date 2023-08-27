/**
 * @module authController
 * Handles routes related to clock authentication.
 */
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { getClockById, setPasswordForClock, isPasswordSet, logActivity } = require('../models/clockModel');
const { handleError } = require('../utils/errorUtils');

/**
 * Fetch and validate the clock by its ID and password.
 * @param {string} id - The ID of the clock
 * @param {string} password - The password for the clock
 * @returns {Array} - Array containing the clock, status code, and error message if any
 */
const fetchAndValidateClock = async (id, password) => {
  try {
    const clock = await getClockById(id);
    if (!clock) {
      return [null, 404, 'Clock not found'];
    }
  
    if (clock.passwordHash) {
      const match = await bcrypt.compare(password, clock.passwordHash);
      if (!match) {
        return [null, 401, 'Invalid password'];
      }
    }

    return [clock, null, null];
  } catch (error) {
    console.error(error);
    return [null, 500, 'Internal Server Error'];
  }
};

/**
 * Authenticate and issue a token for the clock.
 * @route POST /clocks/:id
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
router.post('/clocks/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const password = req.body.password;
    const [clock, statusCode, errMsg] = await fetchAndValidateClock(id, password);

    if (!clock) {
      return res.status(statusCode).send({ message: errMsg });
    }

    if (!clock.passwordHash) {
      const hasPassword = await isPasswordSet(id);
      if (!hasPassword) {
        await logActivity(id, 'Keyholder Set');
      }

      await setPasswordForClock(id, password);
    }

    const token = jwt.sign({ clockId: id }, process.env.JWT_SECRET_KEY, { expiresIn: process.env.JWT_EXPIRE_TIME });
    res.status(200).send({ token, message: 'Authenticated successfully' });
  } catch (error) {
    handleError(error, res);
  }
});

/**
 * Check if a clock has a password.
 * @route GET /clocks/:id/has-password
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
router.get('/clocks/:id/has-password', async (req, res) => {
  try {
    const id = req.params.id;
    const hasPassword = await isPasswordSet(id);
    res.status(200).send({ hasPassword });
  } catch (error) {
    handleError(error, res);
  }
});

/**
 * Verify a token for a clock.
 * @route POST /verify-clock-token
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
router.post('/verify-clock-token', (req, res) => {
    try {        
        const token = req.body.token;
        const clockId = req.body.clockId;
        
        if (!token || !clockId) {
            return res.status(400).send({ error: 'Token and clockId must be provided.' });
        }
    
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
            
            if (decoded.clockId === clockId) {
                res.status(200).send({ isValid: true });
            } else {
                res.status(200).send({ isValid: false });
            }
        } catch (ex) {
            if (ex instanceof jwt.TokenExpiredError) {
                return res.status(200).send({ isValid: false, error: 'Token has expired' });
            }
            res.status(200).send({ isValid: false, error: 'Invalid token' });
        }
    } catch (error) {
        handleError(error, res);
    }
});

module.exports = router;