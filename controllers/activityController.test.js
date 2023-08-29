const request = require('supertest');
const express = require('express');
const router = require('../config/router');  // Adjust the path to your router

// Mock dependencies
jest.mock('../models/clockModel', () => ({
  getActivityLogById: jest.fn(),
  getTimeActivitiesById: jest.fn(),
  revertLastTimeActivity: jest.fn()
}));

jest.mock('../utils/errorUtils', () => ({
  handleError: jest.fn((error, res) => {
    res.status(500).send({ error: 'Internal Server Error' });
  })
}));

const app = express();
app.use(router);

describe('Clock Activity Controller', () => {
  describe('GET /activity/clocks/:id', () => {
    it('should return an activity log when it exists', async () => {
      const mockActivityLog = [
        {
          "message": "Keyholder Set",
          "timestamp": "2023-08-27T15:44:25.008Z"
        }
      ];
      require('../models/clockModel').getActivityLogById.mockResolvedValue(mockActivityLog);
      
      const res = await request(app).get('/activity/clocks/1');
      
      expect(res.statusCode).toEqual(200);
      expect(res.body).toEqual(mockActivityLog);
    });
    
    it('should return an empty array when activity log does not exist', async () => {
      require('../models/clockModel').getActivityLogById.mockResolvedValue(null);
      
      const res = await request(app).get('/activity/clocks/1');
      
      expect(res.statusCode).toEqual(200);
      expect(res.body).toEqual([]);
    });

    it('should handle errors', async () => {
      const mockError = new Error('An error');
      require('../models/clockModel').getActivityLogById.mockRejectedValue(mockError);

      const res = await request(app).get('/activity/clocks/1');

      expect(res.statusCode).toEqual(500);
      expect(res.body).toEqual({ error: 'Internal Server Error' });
    });
  });
  
  describe('GET /clocks/:id/history', () => {
    it('should return time activities when they exist', async () => {
      const mockTimeActivities = [{test:true}];
      require('../models/clockModel').getTimeActivitiesById.mockResolvedValue(mockTimeActivities);
      
      const res = await request(app).get('/activity/clocks/1/history');
      
      expect(res.statusCode).toEqual(200);
      expect(res.body).toEqual(mockTimeActivities);
    });
    
    it('should return an empty array when no time activities are found', async () => {
      require('../models/clockModel').getTimeActivitiesById.mockResolvedValue(null);
      
      const res = await request(app).get('/activity/clocks/1/history');
      
      expect(res.statusCode).toEqual(200);
      expect(res.body).toEqual([]);
    });

    it('should handle errors', async () => {
      const mockError = new Error('An error');
      require('../models/clockModel').getTimeActivitiesById.mockRejectedValue(mockError);

      const res = await request(app).get('/activity/clocks/1/history');

      expect(res.statusCode).toEqual(500);
      expect(res.body).toEqual({ error: 'Internal Server Error' });
    });
  });
  
  // Needs to move
  // describe('POST /clocks/:id/revert', () => {
  //   it('should revert last time activity when it exists', async () => {
  //     const mockRevertedActivity = { type: 'add', amount: 1000 };
  //     require('../models/clockModel').revertLastTimeActivity.mockResolvedValue(mockRevertedActivity);
      
  //     const res = await request(app).post('/activity/clocks/1/revert');
      
  //     expect(res.statusCode).toEqual(200);
  //     expect(res.body).toEqual({ message: `Successfully reverted last time activity: ${mockRevertedActivity.type} of ${mockRevertedActivity.amount} milliseconds` });
  //   });
    
  //   it('should return a message when no time activity is found to revert', async () => {
  //     require('../models/clockModel').revertLastTimeActivity.mockResolvedValue(null);
      
  //     const res = await request(app).post('/activity/clocks/1/revert');
      
  //     expect(res.statusCode).toEqual(200);
  //     expect(res.body).toEqual({ message: 'No time activity found to revert' });
  //   });

  //   it('should handle errors', async () => {
  //     const mockError = new Error('An error');
  //     require('../models/clockModel').revertLastTimeActivity.mockRejectedValue(mockError);

  //     const res = await request(app).post('/activity/clocks/1/revert');

  //     expect(res.statusCode).toEqual(500);
  //     expect(res.body).toEqual({ error: 'Internal Server Error' });
  //   });
  // });
});