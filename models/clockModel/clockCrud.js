/**
 * @module clockCrud
 * Contains functions for interacting with clocks in the database.
 */
const { ObjectId } = require('mongodb');
const getDB = require('../dbSingleton');
const { calculateRemainingTime } = require('../../utils/timeUtils');
const { updateClocksInBatch } = require('./clockBatchUpdates');
const clockModel = require('.');

const commonProjection = { passwordHash: 0, activityLog: 0, timeActivities: 0 };

/**
 * Converts a string ID to an ObjectId.
 * @param {string} id - The string ID.
 * @returns {ObjectId} - The ObjectId version of the string ID.
 */
const getObjectId = id => new ObjectId(id);

/**
 * Retrieve a clock by its ID from the database.
 * @async
 * @param {string} id - The clock's ID.
 * @returns {Object|null} - The clock object or null if not found.
 * @throws {Error}
 */
const getClockById = async (id) => {
  try {
    const db = await getDB();

    const clock = await db.collection('clocks').findOne({ _id: getObjectId(id) });
    if (!clock) {
      return null;
    }

    const currentTime = new Date().getTime();
    if (!clock.endTime) {
      clock.endTime = currentTime;
    }
    let newRemainingTime = calculateRemainingTime(clock.endTime, currentTime);

    if (!clock.paused) {
      newRemainingTime = Math.max(newRemainingTime, 0);

      let updateFields = { remainingTime: newRemainingTime };
      if (newRemainingTime === 0) {
        updateFields.endTime = currentTime;
      }

      await updateClockById(id, updateFields);
    }

    const updatedClock = await db.collection('clocks').findOne(
      { _id: getObjectId(id) },
      { projection: commonProjection }
    );

    return updatedClock;

  } catch (err) {
    console.error(`Error in getClockById: ${err}`);
    throw err;
  }
};

/**
 * Creates a new clock in the database.
 * @async
 * @param {Object} clockData - The data for the new clock.
 * @returns {ObjectId} - The ID of the inserted clock.
 */
const createClock = async (clockData) => {
  const db = await getDB();
  const result = await db.collection('clocks').insertOne(clockData);
  return result.insertedId;
};

/**
 * Retrieve all clocks from the database.
 * @async
 * @returns {Array} - An array of all clock objects.
 */
const getAllClocks = async () => {
  const db = await getDB();
  const clocks = await db.collection('clocks').find({}, { projection: commonProjection }).toArray();

  if (clocks.length === 0) {
    return [];
  }

  const currentTime = new Date().getTime();
  const updates = [];

  for (const clock of clocks) {
    if (!clock.paused) {
      if (!clock.endTime) {
        clock.endTime = currentTime;
      }
      let newRemainingTime = calculateRemainingTime(clock.endTime, currentTime);
      newRemainingTime = Math.max(newRemainingTime, 0);

      const updateFields = { remainingTime: newRemainingTime };
      if (newRemainingTime === 0) {
        updateFields.endTime = currentTime;
      }
      
      updates.push({ id: clock._id.toString(), ...updateFields });
    }
  }

  if (updates.length > 0) {
    await updateClocksInBatch(updates);
  }

  const updatedClocks = await db.collection('clocks').find({}, { projection: commonProjection }).toArray();
  
  return updatedClocks;
};

/**
 * Updates a clock by its ID in the database.
 * @async
 * @param {string} id - The clock's ID.
 * @param {Object} updatedData - The data to update the clock with.
 */
const updateClockById = async (id, updatedData) => {
  const db = await getDB();
  await db.collection('clocks').findOneAndUpdate(
    { _id: getObjectId(id) },
    { $set: updatedData },
    { returnOriginal: false }
  );
};

/**
 * Deletes a clock by its ID from the database.
 * @async
 * @param {string} id - The clock's ID.
 * @returns {number} - The number of deleted clocks (should be 1 if successful).
 * @throws {Error}
 */
const deleteClockById = async (id) => {
  try {
    const db = await getDB();
    const result = await db.collection('clocks').deleteOne({ _id: getObjectId(id) });
    return result.deletedCount;
  } catch (err) {
    console.error(`Error in deleteClockById: ${err}`);
    throw err;
  }
};


module.exports = {
  getClockById,
  createClock,
  getAllClocks,
  updateClockById,
  deleteClockById
};
