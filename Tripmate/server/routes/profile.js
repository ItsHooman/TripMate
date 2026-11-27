const express = require('express');
const multer = require('multer');
const path = require('path');
const Profile = require('../models/Profile');
const authenticate = require('../middleware/auth');
const router = express.Router();
const User = require('../models/User');
const fs = require('fs');
const crypto = require('crypto');

const validateGeographicalLocation = (place) => {
    if (!place || typeof place !== 'object') {
        return false;
    }

    return (
        typeof place.placeId === 'string' &&
        place.placeId.trim().length > 0 &&

        typeof place.name === 'string' &&
        place.name.trim().length > 0 &&

        typeof place.label === 'string' &&
        place.label.trim().length > 0 &&

        typeof place.countryCode === 'string' &&
        /^[a-z]{2}$/i.test(place.countryCode) &&

        Number.isFinite(place.latitude) &&
        place.latitude >= -90 &&
        place.latitude <= 90 &&

        Number.isFinite(place.longitude) &&
        place.longitude >= -180 &&
        place.longitude <= 180 &&

        ['city', 'country'].includes(place.type)
    );
};

// Configure profile photo storage

const uploadDirectory = path.join(
    __dirname,
    '../uploads/profile-pictures'
);

fs.mkdirSync(uploadDirectory, {
    recursive: true
});

const allowedImages = {
    'image/jpeg': '.jpg',
    'image/png': '.png',
    'image/webp': '.webp'
};

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDirectory);
    },

    filename: (req, file, cb) => {
        const extension = allowedImages[file.mimetype];

        const uniqueName =
            `${req.user.id}-${crypto.randomUUID()}${extension}`;

        cb(null, uniqueName);
    }
});

const upload = multer({
    storage,

    limits: {
        fileSize: 5 * 1024 * 1024,
        files: 6
    },

    fileFilter: (req, file, cb) => {
        if (!allowedImages[file.mimetype]) {
            return cb(
                new Error('Only JPG, PNG and WEBP images are allowed.')
            );
        }

        cb(null, true);
    }
});

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
router.post(
    '/',
    authenticate,
    upload.fields([
        { name: 'profilePicture', maxCount: 1 },
        { name: 'profilePictures', maxCount: 6 }
    ]),
    async (req, res) => {
    const {
    name,
    interests,
    preferredDestinations,
    travelStyle,
    bio,
    location
} = req.body;

    try {
        let parsedDestinations = [];

if (preferredDestinations) {
    try {
        parsedDestinations = JSON.parse(
            preferredDestinations
        );
    } catch {
        // Support older profile editing pages
        parsedDestinations =
            preferredDestinations.split(',');
    }

    if (
        !Array.isArray(parsedDestinations) ||
        parsedDestinations.some(
            item => typeof item !== 'string'
        )
    ) {
        return res.status(400).json({
            message: 'Invalid destinations.'
        });
    }

    parsedDestinations = [
        ...new Set(
            parsedDestinations
                .map(item => item.trim())
                .filter(Boolean)
        )
    ];

    if (parsedDestinations.length > 10) {
        return res.status(400).json({
            message: 'A maximum of 10 destinations is allowed.'
        });
    }
}
    const account = await User.findById(req.user.id)
        .select('email name');

    if (!account) {
        return res.status(404).json({
            message: 'User not found'
        });
    }

    let profile = await Profile.findOne({
        user: req.user.id
    });

    let parsedLocationDetails;
let parsedDestinationDetails;

try {
    if (req.body.locationDetails !== undefined) {
        parsedLocationDetails = JSON.parse(
            req.body.locationDetails
        );

        if (
            !validateGeographicalLocation(
                parsedLocationDetails
            ) ||
            parsedLocationDetails.type !== 'city' ||
            parsedLocationDetails.label !== location
        ) {
            throw new Error('Invalid home location.');
        }
    }

    if (req.body.destinationDetails !== undefined) {
        parsedDestinationDetails = JSON.parse(
            req.body.destinationDetails
        );

        if (!Array.isArray(parsedDestinationDetails)) {
    throw new Error('Destination details must be an array.');
}

if (parsedDestinationDetails.length > 10) {
    throw new Error('Too many destination details.');
}

for (const place of parsedDestinationDetails) {

    console.log('Validating destination:', place);

    if (!validateGeographicalLocation(place)) {
        console.log('Invalid geographical data:', place);

        throw new Error(
            `Invalid geographical data for ${place?.label || 'unknown destination'}.`
        );
    }

    if (!parsedDestinations.includes(place.label)) {
        console.log('Saved labels:', parsedDestinations);
        console.log('Expected label:', place.label);

        throw new Error(
            `Destination label mismatch: ${place.label}`
        );
    }
}

        parsedDestinationDetails = [
            ...new Map(
                parsedDestinationDetails.map(place => [
                    place.placeId,
                    place
                ])
            ).values()
        ];
    }

} catch (error) {
    return res.status(400).json({
        message: error.message
    });
}

        const profileData = {
            interests: interests ? interests.split(',').map(item => item.trim()) : [],
            preferredDestinations: parsedDestinations,
            name: name?.trim() || account.name,
            email: account.email,
            travelStyle,
            bio,
            location,
        };

        if (parsedLocationDetails !== undefined) {
    profileData.locationDetails =
        parsedLocationDetails;

} else if (profile?.location !== location) {
    profileData.locationDetails = null;
}

if (parsedDestinationDetails !== undefined) {
    profileData.destinationDetails =
        parsedDestinationDetails;

} else {
    profileData.destinationDetails = (
        profile?.destinationDetails || []
    ).filter(place =>
        parsedDestinations.includes(place.label)
    );
}
        
       const mainPhoto =
    req.files?.profilePicture?.[0];

const galleryFiles =
    req.files?.profilePictures || [];

const existingPhotos =
    profile?.profilePictures?.length
        ? [...profile.profilePictures]
        : profile?.profilePicture
            ? [profile.profilePicture]
            : [];

let photos = [...existingPhotos];

// Allow users to retain, remove or reorder existing photos
if (req.body.retainedPhotos !== undefined) {
    let retainedPhotos;

    try {
        retainedPhotos = JSON.parse(
            req.body.retainedPhotos
        );
    } catch {
        return res.status(400).json({
            message: 'Invalid photo list.'
        });
    }

    if (
        !Array.isArray(retainedPhotos) ||
        retainedPhotos.some(
            photo => !existingPhotos.includes(photo)
        )
    ) {
        return res.status(400).json({
            message: 'Invalid profile photos.'
        });
    }

    photos = [...new Set(retainedPhotos)];
}

if (mainPhoto) {
    const mainPhotoPath =
        `/uploads/profile-pictures/${mainPhoto.filename}`;

    photos = [
        mainPhotoPath,
        ...photos.filter(
            photo => photo !== profile?.profilePicture
        )
    ];
}

const newPhotos = galleryFiles.map(
    file => `/uploads/profile-pictures/${file.filename}`
);

photos = [...photos, ...newPhotos];

if (photos.length > 6) {
    const uploadedFiles = [
        ...(req.files?.profilePicture || []),
        ...galleryFiles
    ];

    await Promise.allSettled(
        uploadedFiles.map(file =>
            fs.promises.unlink(file.path)
        )
    );

    return res.status(400).json({
        message: 'You can upload a maximum of 6 photos.'
    });
}

// Apply the selected photo order
if (req.body.photoOrder !== undefined) {
    try {
        const order = JSON.parse(req.body.photoOrder);

        if (
            !Array.isArray(order) ||
            order.length !== photos.length ||
            new Set(order).size !== photos.length ||
            order.some(index =>
                !Number.isInteger(index) ||
                index < 0 ||
                index >= photos.length
            )
        ) {
            throw new Error('Invalid order');
        }

        photos = order.map(index => photos[index]);

    } catch {
        return res.status(400).json({
            message: 'Invalid photo order.'
        });
    }
}

profileData.profilePictures = photos;
profileData.profilePicture = photos[0] || '';

        if (profile) {
            Object.assign(profile, profileData);
        } else {
            profile = new Profile({ user: req.user.id, ...profileData });
        }

        await profile.save();

        await User.findByIdAndUpdate(req.user.id, {
            $set: {
                profile: profile._id,
            },
        });

        res.status(200).json(profile);
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});

// Handle photo upload errors

router.use((err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                message: 'Each photo must be smaller than 5 MB.'
            });
        }

        return res.status(400).json({
            message: err.message
        });
    }

    if (err.message ===
        'Only JPG, PNG and WEBP images are allowed.') {
        return res.status(400).json({
            message: err.message
        });
    }

    next(err);
});
module.exports = router;
