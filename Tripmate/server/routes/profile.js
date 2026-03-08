const express = require('express');
const multer = require('multer');
const path = require('path');
const Profile = require('../models/Profile');
const authenticate = require('../middleware/auth');
const router = express.Router();

// Configure multer
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        console.log('Destination Path:', path.join(__dirname, 'uploads/profile-pictures/'));
        cb(null, 'uploads/profile-pictures/');
    },
    filename: (req, file, cb) => {
        cb(null, `${req.user.id}-${Date.now()}${path.extname(file.originalname)}`);
    },
});

const upload = multer({ storage });

// Get user profile
router.get('/', authenticate, async (req, res) => {
    try {
        const profile = await Profile.findOne({ user: req.user.id });
        if (!profile) {
            return res.status(404).json({ message: 'Profile not found' });
        }
        res.status(200).json(profile);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Get user profile by userId
router.get('/:userId', async (req, res) => {
    try {
        const { userId } = req.params; 
        const profile = await Profile.findOne({ user: userId });
        if (!profile) {
            return res.status(404).json({ message: 'Profile not found' });
        }
        res.status(200).json(profile);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});


// Create or update user profile
router.post('/', authenticate, upload.single('profilePicture'), async (req, res) => {
    console.log('File received:', req.file);
    const { name, email, interests, preferredDestinations, travelStyle, bio, location } = req.body;

    try {
        let profile = await Profile.findOne({ user: req.user.id });

        const profileData = {
            interests: interests ? interests.split(',').map(item => item.trim()) : [],
            preferredDestinations: preferredDestinations
                ? preferredDestinations.split(',').map(item => item.trim())
                : [],
            name,
            email,
            travelStyle,
            bio,
            location,
        };

        if (req.file) {
            profileData.profilePicture = `/uploads/profile-pictures/${req.file.filename}`;
        }

        if (profile) {
            Object.assign(profile, profileData);
        } else {
            profile = new Profile({ user: req.user.id, ...profileData });
        }

        await profile.save();
        res.status(200).json(profile);
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});
module.exports = router;
