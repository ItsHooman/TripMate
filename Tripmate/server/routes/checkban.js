const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User'); 
const Report = require('../models/Report');
const authenticate = require('../middleware/auth');

const router = express.Router();

router.get('/checkban', authenticate, async (req, res) => {
    const userId = req.user.id; 
        try {
          const user = await User.findById(userId) && await Report.findOne({ reportedUserId: userId, status: 'banned' });
          if (!user) {
            return res.status(404).json({ message: 'User not found' });
          }
      
          if (user.status === 'banned') {
            return res.status(403).json({ message: 'You have been banned' });
          }
      
          res.status(200).json({ message: 'User is not banned', user });
        } catch (err) {
          console.error('Error finding user:', err);
          res.status(500).json({ message: 'Error retrieving user' });
        }
      });
  
module.exports = router;