const connectDB = require('../db/dbConnect');
let db;

const getDB = async () => {
  if (!db) {
    try {
      db = await connectDB();
    } catch (error) {
      console.error('Failed to connect to the database', error);
      throw error;
    }
  }
  return db;
};

module.exports = getDB;
