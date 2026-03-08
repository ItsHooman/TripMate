const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const math = require('mathjs'); 
const authenticate = require('../middleware/auth');
const User = require('../models/User');
const Profile = require('../models/Profile');  

const router = express.Router();

/**
 * Helper function to calculate Cosine Similarity between two users' interests.
 */
function calculateSimilarity(profile1, profile2) {
    if (!profile1 || !profile2) return 0;

    const interests1 = (profile1.interests || []).map(interest => interest.toLowerCase().trim());
    const interests2 = (profile2.interests || []).map(interest => interest.toLowerCase().trim());

    const allInterests = Array.from(new Set([...interests1, ...interests2]));

    const vector1 = allInterests.map(interest => interests1.includes(interest) ? 1 : 0);
    const vector2 = allInterests.map(interest => interests2.includes(interest) ? 1 : 0);

    const dotProduct = math.dot(vector1, vector2);
    const magnitude1 = math.norm(vector1);
    const magnitude2 = math.norm(vector2);

    const similarity = magnitude1 && magnitude2 ? dotProduct / (magnitude1 * magnitude2) : 0;

    console.log("Similarity Score:", similarity);
    return similarity;
}

/**
 * GET /api/match
 * Returns AI-powered user matches based on interests and preferences.
 */
// Backend Route (assuming you have the route for AI-powered matches)
router.get('/match', authenticate, async (req, res) => {
    try {
        const userId = req.user.id;
        
        const currentUser = await User.findById(userId).populate('profile');

        if (!currentUser || !currentUser.profile) {
            return res.status(404).json({ message: "Current user's profile not found." });
        }

        const users = await User.find({ _id: { $ne: userId } }).populate('profile');

        let recommendations = [];

        users.forEach(user => {
            if (!user.profile) return; 

            const similarityScore = calculateSimilarity(currentUser.profile, user.profile);

            if (similarityScore > 0.3) { 
                recommendations.push({
                    user: {
                        _id: user._id,
                        name: user.profile.name,
                        profilePicture: user.profile.profilePicture
                    },
                    similarityScore: Math.round(similarityScore * 100) 
                });
            }
        });

        recommendations.sort((a, b) => b.similarityScore - a.similarityScore);

        res.json({ matches: recommendations });
    } catch (error) {
        console.error('Error fetching matches:', error);
        res.status(500).json({ error: 'An error occurred while fetching matches.' });
    }
});


router.get('/', authenticate, async (req, res) => {
    try {
    const { preferences } = req.query;
    
    const users = await User. find()
    .populate('profile');
    
    console.log(users);
    
    let matches = users;
    
    if (preferences) {
    const parsedPreferences = JSON.parse(preferences);
    const { interests, preferredDestinations, travelStyle } = parsedPreferences;
    
    matches = matches. filter((user) => {
    const profile = user.profile;
    
    return (
    (!interests || profile.interests.some((interest) =>
    interests.includes(interest)
    )) &&
    (!preferredDestinations || profile.preferredDestinations.some((dest) =>
    preferredDestinations.includes(dest)
    )) &&
    (!travelStyle || profile.travelStyle === travelStyle)
    );
    });
    }
    
    res.json(matches);
    } catch (error) {
    console.error('Error fetching matches:', error);
    res.status(500).json({ error: 'An error occurred while fetching matches.' });
    }
    });


/**
 * GET /api/users/:userId
 * Fetch a specific user by ID.
 */
router.get('/users/:userId', async (req, res) => {
    try {
        const userId = req.params.userId;
        const user = await User.findById(userId).populate('profile');

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json(user);
    } catch (error) {
        console.error('Error fetching user:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;