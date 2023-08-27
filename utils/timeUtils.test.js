
const { calculateRemainingTime, millisecondsToHumanReadable } = require('./timeUtils');

describe('calculateRemainingTime', () => {
    it('should return the correct remaining time in milliseconds', () => {
        const currentTime = new Date('2023-01-01T12:00:00Z');
        const endTime = new Date('2023-01-01T13:00:00Z');
        const expectedRemainingTime = 60 * 60 * 1000;  // 1 hour in milliseconds

        const actualRemainingTime = calculateRemainingTime(endTime, currentTime);

        expect(actualRemainingTime).toBe(expectedRemainingTime);
    });

    it('should return zero if the end time is in the past', () => {
        const currentTime = new Date('2023-01-02T12:00:00Z');
        const endTime = new Date('2023-01-01T13:00:00Z');
        const expectedRemainingTime = 0;

        const actualRemainingTime = calculateRemainingTime(endTime, currentTime);

        expect(actualRemainingTime).toBe(expectedRemainingTime);
    });
});

describe('millisecondsToHumanReadable', () => {
    it('should correctly convert milliseconds to a human-readable format', () => {
        const inputMilliseconds = 31626061000;
        const expectedOutput = '1 year, 19 hours, 1 minute, 1 second';

        const actualOutput = millisecondsToHumanReadable(inputMilliseconds);

        expect(actualOutput).toBe(expectedOutput);
    });

    it('should handle singular and plural units correctly', () => {
        const inputMilliseconds = 3666000;  // 1 hour, 1 minute, and 6 seconds
        const expectedOutput = '1 hour, 1 minute, 6 seconds';

        const actualOutput = millisecondsToHumanReadable(inputMilliseconds);

        expect(actualOutput).toBe(expectedOutput);
    });
});