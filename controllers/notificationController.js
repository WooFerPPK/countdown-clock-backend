const express = require('express');
const router = express.Router();
const { pushNotification, getAllNotifications, deleteNotificationById } = require('../models/notificationModel/index');

// Push a new notification
router.post('/', async (req, res) => {
  let notification = {
    message: req.body.message,
    timestamp: new Date().toISOString()
  };
  let metadata = {};
  if (req.body.metadata) {
    metadata = req.body.metadata;
  }
  const id = await pushNotification(notification, metadata);
  res.status(201).send({ id });
});

// Get all notifications
router.get('/', async (req, res) => {
  const notifications = await getAllNotifications();
  res.status(200).send(notifications);
});

// Delete a notification by ID
router.delete('/:id', async (req, res) => {
  const id = req.params.id;
  const deletedCount = await deleteNotificationById(id);
  
  if (deletedCount === 0) {
    return res.status(404).send('Notification not found');
  }
  res.status(200).send({ message: 'Notification deleted successfully' });
});

module.exports = router;
