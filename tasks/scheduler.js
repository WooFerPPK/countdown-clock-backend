const { updateAllClocks } = require('./updateClockTask');

let updateAllClocksIntervalID;

const startAll = () => {
  updateAllClocksIntervalID = setInterval(async () => {
    await updateAllClocks();
  }, 60000);
};

const stopAll = () => {
  clearInterval(updateAllClocksIntervalID);
};

module.exports = { startAll, stopAll };