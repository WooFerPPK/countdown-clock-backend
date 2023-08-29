const { ObjectId } = require('mongodb');
const getDB = require('../dbSingleton');

const pushNotification = async (notification, metadata = {}) => {
    const db = await getDB();
    const fullNotification = {
      ...notification,
      metadata,
      timestamp: new Date().toISOString()
    };
    const result = await db.collection('notifications').insertOne(fullNotification);
    return result.insertedId;
  };
  

const getAllNotifications = async () => {
  const db = await getDB();
  return await db.collection('notifications').find().toArray();
};

const deleteNotificationById = async (id) => {
  const db = await getDB();
  const result = await db.collection('notifications').deleteOne({ _id: new ObjectId(id) });
  return result.deletedCount;
};

module.exports = {
  pushNotification,
  getAllNotifications,
  deleteNotificationById
};
