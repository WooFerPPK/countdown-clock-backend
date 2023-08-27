const { getAllClocks, updateClocksInBatch } = require('../models/clockModel');
const { calculateRemainingTime } = require('../utils/timeUtils');
const { handleError } = require('../utils/errorUtils');

// Filter out clocks that are paused
const filterActiveClocks = (clocks) => clocks.filter(clock => !clock.paused);

// Handles the batch updating of clocks
const batchUpdateClocks = async (updates, notifications) => {
    if (updates.length > 0 || notifications.length > 0) {
        await updateClocksInBatch([...updates, ...notifications]);
    }
};

const checkAndUpdateRemainingTime = (clock, currentTime) => {
    const remainingTime = calculateRemainingTime(clock.endTime, currentTime);
    if (remainingTime !== clock.remainingTime) {
        return { id: clock._id, remainingTime };
    }
    return null;
};

const checkAndNotifyZeroTime = (clock, remainingTime) => {
    if (remainingTime === 0 && !clock.notified) {
        // Push notification code here
        console.log(`Clock with ID ${clock._id} has run out of time`);
        return { id: clock._id, notified: true };
    }
    return null;
};

const checkAndResetNotifiedFlag = (clock, remainingTime) => {
    if (remainingTime > 0 && clock.notified) {
        // Reset the notified flag if time has been added back
        return { id: clock._id, notified: false };
    }
    return null;
};

const updateAllClocks = async () => {
    try {
        const allClocks = await getAllClocks();
        const activeClocks = filterActiveClocks(allClocks);
        const currentTime = new Date().getTime();
        
        const updates = [];
        const notifications = [];

        for (const clock of activeClocks) {
            const update = checkAndUpdateRemainingTime(clock, currentTime);
            if (update) { 
                updates.push(update);
            }

            const remainingTime = update ? update.remainingTime : clock.remainingTime;

            const notify = checkAndNotifyZeroTime(clock, remainingTime);
            if (notify) { 
                notifications.push(notify);
            }

            const resetNotified = checkAndResetNotifiedFlag(clock, remainingTime);
            if (resetNotified) { 
                notifications.push(resetNotified);
            }
        }

        await batchUpdateClocks(updates, notifications);

    } catch (error) {
        handleError(error);
    }
};

module.exports = { updateAllClocks };