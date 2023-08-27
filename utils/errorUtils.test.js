
const { handleError } = require('./errorUtils');

describe('handleError', () => {
    it('should log the error and set HTTP status to 500', () => {
        const mockError = new Error('Test Error');
        const mockResponse = {
            status: jest.fn().mockReturnThis(),
            send: jest.fn()
        };
        console.error = jest.fn();

        handleError(mockError, mockResponse);

        expect(console.error).toHaveBeenCalledWith(`Error occurred: ${mockError}`);
        expect(mockResponse.status).toHaveBeenCalledWith(500);
        expect(mockResponse.send).toHaveBeenCalledWith({ error: 'Internal Server Error' });
    });
});
