const { MongoClient } = require('mongodb');

const url = process.env.MONGO_URL || 'mongodb://localhost:27017';
const dbName = 'countdownClockDB';

const connectDB = async () => {
  const client = new MongoClient(url, { useUnifiedTopology: true });
  await client.connect();
  return client.db(dbName);
};

module.exports = connectDB;
