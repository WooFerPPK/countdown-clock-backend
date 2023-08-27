const calculateRemainingTime = (endTime, currentTime = new Date()) => {
    const endTimeInMillis = new Date(endTime).getTime();
    let remainingTime = endTimeInMillis - currentTime;

    // Check if the remaining time is negative and set it to zero if it is
    if (remainingTime < 0) {
        remainingTime = 0;
    }

    return remainingTime;
};

const millisecondsToHumanReadable = (ms) => {
    const oneSecond = 1000;  // 1 second is 1000 milliseconds
    const oneMinute = 60000;
    const oneHour = 60 * oneMinute;
    const oneDay = 24 * oneHour;
    const oneMonthAvg = 30.44 * oneDay; // Average number of days in a month
    const oneYear = 365.25 * oneDay; // Taking into account leap years
    
    let remainingMs = ms;
    
    const years = Math.floor(remainingMs / oneYear);
    remainingMs %= oneYear;
    
    const months = Math.floor(remainingMs / oneMonthAvg);
    remainingMs %= oneMonthAvg;
    
    const days = Math.floor(remainingMs / oneDay);
    remainingMs %= oneDay;
    
    const hours = Math.floor(remainingMs / oneHour);
    remainingMs %= oneHour;
    
    const minutes = Math.floor(remainingMs / oneMinute);
    remainingMs %= oneMinute;

    const seconds = Math.floor(remainingMs / oneSecond);
    
    const parts = [];
    
    if (years > 0) parts.push(`${years} year${years === 1 ? '' : 's'}`);
    if (months > 0) parts.push(`${months} month${months === 1 ? '' : 's'}`);
    if (days > 0) parts.push(`${days} day${days === 1 ? '' : 's'}`);
    if (hours > 0) parts.push(`${hours} hour${hours === 1 ? '' : 's'}`);
    if (minutes > 0) parts.push(`${minutes} minute${minutes === 1 ? '' : 's'}`);
    if (seconds > 0) parts.push(`${seconds} second${seconds === 1 ? '' : 's'}`);
    
    return parts.join(', ');
};

module.exports = {
    calculateRemainingTime,
    millisecondsToHumanReadable,
};
