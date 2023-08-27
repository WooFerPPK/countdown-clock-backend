const clockCrud = require('./clockCrud');
const clockActivityLog = require('./clockActivityLog');
const clockPassword = require('./clockPassword');
const clockBatchUpdates = require('./clockBatchUpdates');
const clockTimeManagement = require('./clockTimeManagement');

module.exports = {
  ...clockCrud,
  ...clockActivityLog,
  ...clockPassword,
  ...clockBatchUpdates,
  ...clockTimeManagement
};
