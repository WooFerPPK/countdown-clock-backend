const { getAllClocks, updateClocksInBatch, getPauseDataByClockId, deletePauseDataByClockId } = require('../models/clockModel');
const { pushNotification, deleteNotificationById, sendPushoverNotification } = require('../models/notificationModel');
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

const checkAndUpdateRemainingTime = async (clock, currentTime) => {
    let endTime = new Date(clock.endTime).getTime();
    if (!clock.paused) {
        const pauseData = await getPauseDataByClockId(clock._id) || {};      
        if (pauseData.pauseStartTime) {
            const pauseDuration = currentTime - pauseData.pauseStartTime;
            endTime = new Date(clock.endTime).getTime() + pauseDuration;
            await deletePauseDataByClockId(clock._id)
        }
    }

    const remainingTime = calculateRemainingTime(endTime);
    
    if (remainingTime !== clock.remainingTime) {
        return { id: clock._id, remainingTime };
    }
    
    return null;
};

const checkAndNotifyZeroTime = async (clock, remainingTime) => {
    if (remainingTime === 0 && !clock.notificationId) {
        const message = `${clock.description} has no time remaining`;
        const notificationId = await pushNotification(
            { message: message },
            { clockId: clock._id.toString() }
        );
        if (process.env.PUSHOVER_USER_KEY && process.env.PUSHOVER_API_TOKEN) {
            await sendPushoverNotification(message);
        }
        return { id: clock._id, notificationId };
    }
    return null;
};

const checkAndResetnotificationId = async (clock, remainingTime) => {
    if (remainingTime > 0 && clock.notificationId) {

        if (clock.notificationId) {
            await deleteNotificationById(clock.notificationId);
        }

        return { id: clock._id, notificationId: null };
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
            const update = await checkAndUpdateRemainingTime(clock, currentTime);
            if (update) { 
                updates.push(update);
            }

            const remainingTime = update ? update.remainingTime : clock.remainingTime;

            const notify = await checkAndNotifyZeroTime(clock, remainingTime);
            if (notify) { 
                notifications.push(notify);
            }

            const resetNotification = await checkAndResetnotificationId(clock, remainingTime);
            if (resetNotification) { 
                notifications.push(resetNotification);
            }
        }

        await batchUpdateClocks(updates, notifications);

    } catch (error) {
        handleError(error);
    }
};

module.exports = { updateAllClocks };