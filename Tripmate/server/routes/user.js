
const express = require('express');
const router = express.Router();
const adminauthenticate = require('../middleware/admin');
const authenticate = require('../middleware/auth');
const User = require('../models/User'); 


router.get('/me', authenticate,  async (req, res) => {
  try {
      const user = await User.findById(req.user.id).populate('profile');
      if (!user) {
          return res.status(404).json({ message: 'User not found' });
      }
      res.json(user);
  } catch (error) {
      console.error('Error fetching user:', error);
      res.status(500).json({ message: 'Server error' });
  }
});


router.get('/', adminauthenticate , async (req, res) => {
  try {
    const users = await User.find({ role: { $ne: 'admin' } }); 
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Failed to fetch users' });
  }
});

router.put('/:id/ban', adminauthenticate, async (req, res) => {
    const { id } = req.params;
  
    try {
      const user = await User.findById(id);
  
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
  
      user.status = 'banned'; 
      await user.save();
  
      res.json({ message: 'User has been banned successfully', user });
    } catch (error) {
      console.error('Error banning user:', error);
      res.status(500).json({ message: 'Failed to ban user' });
    }
  });

router.put('/:id/unban', adminauthenticate, (req, res) => {
  const { id } = req.params;
  
  User.findByIdAndUpdate(id, { status: 'active' }, { new: true })
    .then(user => res.json(user))
    .catch(err => res.status(500).json({ error: 'Failed to unban user' }));
});
  
router.delete('/:id', adminauthenticate, async (req, res) => {
    const { id } = req.params;
  
    try {
      const user = await User.findByIdAndDelete(id);
  
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
  
      res.json({ message: 'User deleted successfully' });
    } catch (error) {
      console.error('Error deleting user:', error);
      res.status(500).json({ message: 'Failed to delete user' });
    }
  });  

module.exports = router;
