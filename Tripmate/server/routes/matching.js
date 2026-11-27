
const express = require('express');
const mongoose = require('mongoose');
const authenticate = require('../middleware/auth');
const User = require('../models/User');
const Profile = require('../models/Profile');
const TravelMatch = require("../models/TravelMatch");

const {
    calculateCompatibility,
    isProfileComplete,
} = require('../utils/matchingAlgorithm');

const router = express.Router();

const PUBLIC_PROFILE_FIELDS =
    'name bio interests preferredDestinations ' +
    'location travelStyle profilePicture profilePictures';

const MATCHING_PROFILE_FIELDS =
    PUBLIC_PROFILE_FIELDS +
    ' locationDetails destinationDetails';

// Build ranked recommendations
async function getRecommendations(userId) {
    const previousSwipes = await TravelMatch.find({
    $or: [
        {
            userA: userId,
            decisionA: { $in: ["like", "pass"] }
        },
        {
            userB: userId,
            decisionB: { $in: ["like", "pass"] }
        }
    ]
}).lean();

const excludedUserIds = previousSwipes.map((swipe) =>
    String(swipe.userA) === String(userId)
        ? swipe.userB
        : swipe.userA
);
    const currentUser = await User.findById(userId)
        .select('profile contacts status isActive isBanned')
        .populate('profile')
        .lean();

    if (!currentUser) {
        return {
            status: 404,
            message: 'User not found.',
        };
    }

    if (
        currentUser.status === 'banned' ||
        currentUser.isBanned ||
        currentUser.isActive === false
    ) {
        return {
            status: 403,
            message: 'Account is not active.',
        };
    }

    // Fall back to Profile.user if User.profile is missing
    const currentProfile =
        currentUser.profile ||
        await Profile.findOne({ user: userId }).lean();

    if (!isProfileComplete(currentProfile)) {
        return {
            status: 400,
            code: 'PROFILE_INCOMPLETE',
            message: 'Complete your profile to discover travelers.',
        };
    }

    const excludedIds = [
    userId,
    ...(currentUser.contacts || []),
    ...excludedUserIds,
];

    const users = await User.find({
    _id: {
        $nin: excludedIds
    },

    role: { $ne: 'admin' },

    status: { $ne: 'banned' },

    isBanned: { $ne: true },

    isActive: { $ne: false }
})
    .select('_id name role')
    .lean();

    const profiles = await Profile.find({
        user: { $in: users.map(user => user._id) },
    })
        .select(`user ${MATCHING_PROFILE_FIELDS}`)
        .lean();

    const profileMap = new Map(
        profiles.map(profile => [
            String(profile.user),
            profile,
        ])
    );

    const recommendations = users
    .map(user => {
        const profile = profileMap.get(String(user._id));

        if (!isProfileComplete(profile)) {
            return null;
        }

        // Calculate compatibility
        const compatibility = calculateCompatibility(
            currentProfile,
            profile
        );

        // Exclude geographical details from public response
        const {
            locationDetails,
            destinationDetails,
            ...publicProfile
        } = profile;

        return {
            _id: user._id,
            name: profile.name || user.name,
            role: user.role,
            profile: publicProfile,
            ...compatibility,
        };
    })
    .filter(Boolean)
    .sort((a, b) => {
        return (
            b.similarityScore - a.similarityScore ||
            b.sharedDestinations.length -
                a.sharedDestinations.length ||
            b.sharedInterests.length -
                a.sharedInterests.length ||
            String(a._id).localeCompare(String(b._id))
        );
    });

    return {
        status: 200,
        matches: recommendations,
    };
}

/*
 * GET /api/matche
 * Main discovery endpoint
 */
router.get('/', authenticate, async (req, res) => {
    try {
        const result = await getRecommendations(req.user.id);

        if (result.status !== 200) {
            return res.status(result.status).json({
                code: result.code,
                message: result.message,
            });
        }

        let matches = result.matches;

        // Preserve optional preference filters
        if (req.query.preferences) {
            let preferences;

            try {
                preferences = JSON.parse(req.query.preferences);

                if (
                    !preferences ||
                    typeof preferences !== 'object' ||
                    Array.isArray(preferences)
                ) {
                    throw new Error('Invalid preferences');
                }
            } catch {
                return res.status(400).json({
                    message: 'Invalid preferences format.',
                });
            }

            const { normalizeList } =
                require('../utils/matchingAlgorithm');

            const interests = normalizeList(
                preferences.interests
            );

            const destinations = normalizeList(
                preferences.preferredDestinations
            );

            const travelStyle = String(
                preferences.travelStyle || ''
            ).trim().toLowerCase();

            matches = matches.filter(({ profile }) => {
                const profileInterests = normalizeList(
                    profile.interests
                );

                const profileDestinations = normalizeList(
                    profile.preferredDestinations
                );

                return (
                    (
                        !interests.length ||
                        interests.some(item =>
                            profileInterests.includes(item)
                        )
                    ) &&
                    (
                        !destinations.length ||
                        destinations.some(item =>
                            profileDestinations.includes(item)
                        )
                    ) &&
                    (
                        !travelStyle ||
                        String(profile.travelStyle || '')
                            .trim()
                            .toLowerCase() === travelStyle
                    )
                );
            });
        }

        res.json(matches);

    } catch (error) {
        console.error('Error fetching matches:', error);

        res.status(500).json({
            message: 'Unable to find travelers.',
        });
    }
});

/*
 * GET /api/matche/match
 * Compatibility endpoint for Suggestedmatching.js
 */
router.get('/match', authenticate, async (req, res) => {
    try {
        const result = await getRecommendations(req.user.id);

        if (result.status !== 200) {
            return res.status(result.status).json({
                code: result.code,
                message: result.message,
            });
        }

        const matches = result.matches.map(match => ({
            ...match,

            user: {
                _id: match._id,
                name: match.profile.name,
                profilePicture: match.profile.profilePicture,
            },
        }));

        res.json({ matches });

    } catch (error) {
        console.error('Error fetching recommendations:', error);

        res.status(500).json({
            message: 'Unable to calculate recommendations.',
        });
    }
});

/*
 * GET /api/matche/users/:userId
 * Get a traveler's public profile
 */
router.get('/users/:userId', authenticate, async (req, res) => {
    try {
        const { userId } = req.params;

        if (!mongoose.isValidObjectId(userId)) {
            return res.status(400).json({
                message: 'Invalid user ID.',
            });
        }

        const user = await User.findOne({
            _id: userId,
            role: { $ne: 'admin' },
            status: { $ne: 'banned' },
            isBanned: { $ne: true },
            isActive: { $ne: false },
        })
            .select('_id name role')
            .lean();

        if (!user) {
            return res.status(404).json({
                message: 'User not found.',
            });
        }

        const profile = await Profile.findOne({
            user: userId,
        })
            .select(PUBLIC_PROFILE_FIELDS)
            .lean();

        res.json({
            ...user,
            profile,
        });

    } catch (error) {
        console.error('Error fetching user:', error);

        res.status(500).json({
            message: 'Server error.',
        });
    }
});

module.exports = router;
