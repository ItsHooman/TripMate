const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Profile = require('../models/Profile');
const authenticate = require('../middleware/auth');
const router = express.Router();

// Create user and profile
router.post('/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;

        // Hash the password before saving it
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create a new user first
        const newUser = new User({
            name,
            email,
            password: hashedPassword,
        });

        // Save the user to the database
        await newUser.save();

        // Create a profile with only the required fields
        const newProfile = new Profile({
            user: newUser._id,   // Reference to the user
            name: newUser.name,   // Pass the name to the profile
        });

        // Save the profile to the database
        await newProfile.save();

        // Now, update the user with the profile reference
        newUser.profile = newProfile._id;
        await newUser.save();

        // Respond with success
        res.status(201).json({ message: 'User and profile created successfully' });
    } catch (error) {
        console.error('Error creating user and profile:', error);
        res.status(500).json({ error: 'An error occurred while creating the user.' });
    }
});

// Login Route
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ message: 'User not found' });

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) return res.status(400).json({ message: 'Invalid password' });

        // Generate JWT
        const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1h' });

        res.status(200).json({ token, user: { id: user._id, role: user.role, name: user.name, email: user.email } });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

    // Protected route
    router.get('/me', authenticate, async (req, res) => {
        try {
            const user = await User.findById(req.user.id).select('-password'); // Exclude password
            res.status(200).json(user);
        } catch (err) {
            res.status(500).json({ message: 'Error fetching user details' });
        }
    });

    
module.exports = router;
