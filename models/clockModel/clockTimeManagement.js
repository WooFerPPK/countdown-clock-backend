const { ObjectId } = require('mongodb');
const getDB = require('../dbSingleton');
const { logActivity } = require('./clockActivityLog');
const { millisecondsToHumanReadable } = require('../../utils/timeUtils');

const logTimeActivity = async (id, type, amount) => {
    const db = await getDB();
    const timestamp = new Date().toISOString();
    const activityEntry = { type, timestamp, amount };
    await db.collection('clocks').updateOne(
        { _id: new ObjectId(id) },
        { $push: { timeActivities: activityEntry } }
    );
};

const getTimeActivitiesById = async (id) => {
    const db = await getDB();
    const clock = await db.collection('clocks').findOne(
        { _id: new ObjectId(id) }, 
        { projection: { timeActivities: 1 } }
    );

    return clock ? clock.timeActivities : null;
};

const revertLastTimeActivity = async (id) => {
    const db = await getDB();
    const clock = await db.collection('clocks').findOne({ _id: new ObjectId(id) });

    if (!clock || !clock.timeActivities || clock.timeActivities.length === 0) {
        return null;
    }

    const lastActivity = clock.timeActivities.pop();
    let adjustment = lastActivity.amount;
    if (lastActivity.type === 'TIME_ADDED') {
        adjustment = -adjustment;
    }

    await db.collection('clocks').updateOne(
        { _id: new ObjectId(id) },
        { 
            $inc: { remainingTime: adjustment },
            $set: { timeActivities: clock.timeActivities }
        }
    );

    await logActivity(id, `Reverted ${lastActivity.type.toLowerCase().replace('_', ' ')} of ${millisecondsToHumanReadable(lastActivity.amount)}`);

    return lastActivity;
};

module.exports = {
  logTimeActivity,
  getTimeActivitiesById,
  revertLastTimeActivity
};
