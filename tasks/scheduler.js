const { updateAllClocks } = require('./updateClockTask');

let updateAllClocksIntervalID;

const startAll = () => {
  updateAllClocksIntervalID = setInterval(async () => {
    await updateAllClocks();
  }, 6000);
};

const stopAll = () => {
  clearInterval(updateAllClocksIntervalID);
};

module.exports = { startAll, stopAll };