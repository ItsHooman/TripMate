const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');

// Get all notifications for a user
router.get('/:userId', async (req, res) => {
  try {
    const {userId} = req.params;
    if (!userId) {
      return res.status(400).json({ message: 'User ID is required' });
    }

    // Fetch notifications for the user
    const notifications = await Notification.find({ userId: userId }).sort({ createdAt: -1 });
    res.json(notifications);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ message: 'Server Error' });
  }
});


module.exports = router;
