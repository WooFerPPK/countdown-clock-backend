const { ObjectId } = require('mongodb');
const getDB = require('../dbSingleton');

// CRUD Operations
const getPauseDataByClockId = async (clockId) => {
  const db = await getDB();
  return db.collection('clockPauses').findOne({ clockId: ObjectId(clockId) });
};

const createOrUpdatePauseData = async (clockId, pauseData) => {
  const db = await getDB();
  await db.collection('clockPauses').updateOne(
    { clockId: ObjectId(clockId) },
    { $set: pauseData },
    { upsert: true }
  );
};

const deletePauseDataByClockId = async (clockId) => {
    const db = await getDB();
    await db.collection('clockPauses').deleteOne({ clockId: ObjectId(clockId) });
  };

module.exports = {
  getPauseDataByClockId,
  createOrUpdatePauseData,
  deletePauseDataByClockId
};
