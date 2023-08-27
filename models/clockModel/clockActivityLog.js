const { ObjectId } = require('mongodb');
const getDB = require('../dbSingleton');

// Log an activity
const logActivity = async (id, message) => {
    const db = await getDB();
    const timestamp = new Date().toISOString();
    const logEntry = { message, timestamp };
    await db.collection('clocks').updateOne(
        { _id: new ObjectId(id) },
        { $push: { activityLog: logEntry } }
    );
};

// Get activity log by ID
const getActivityLogById = async (id) => {
    const db = await getDB();
    const clock = await db.collection('clocks').findOne(
        { _id: new ObjectId(id) }, 
        { projection: { activityLog: 1 } }
    );

    return clock ? clock.activityLog : null;
};

module.exports = {
  logActivity,
  getActivityLogById
};
