const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');  
const adminauthenticate = require('../middleware/admin');

const router = express.Router();

// Admin login route
router.post('/login',  async (req, res) => {
  const { email, password } = req.body;

  // Find the user with the admin role
  const admin = await User.findOne({ email, role: 'admin' });
  if (!admin) {
    return res.status(400).json({ message: 'Admin not found' });
  }

  // Check if the password matches (assuming bcrypt is used)
  const isMatch = await bcrypt.compare(password, admin.password);
  if (!isMatch) {
    return res.status(400).json({ message: 'Invalid credentials' });
  }

  // Generate a JWT token with user ID and role
  const token = jwt.sign({ userId: admin._id, role: admin.role }, process.env.JWT_SECRET, { expiresIn: '1h' });

  res.json({ token });
});

module.exports = router;
