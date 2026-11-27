const mongoose = require('mongoose');

const geographicalLocationSchema = new mongoose.Schema({
    placeId: {
        type: String,
        required: true
    },

    name: {
        type: String,
        required: true
    },

    label: {
        type: String,
        required: true
    },

    city: {
        type: String,
        default: ''
    },

    state: {
        type: String,
        default: ''
    },

    country: {
        type: String,
        default: ''
    },

    countryCode: {
        type: String,
        lowercase: true,
        default: ''
    },

    latitude: {
        type: Number,
        min: -90,
        max: 90,
        required: true
    },

    longitude: {
        type: Number,
        min: -180,
        max: 180,
        required: true
    },

    type: {
        type: String,
        enum: ['city', 'country'],
        required: true
    }
}, {
    _id: false
});

const profileSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },

    name: {
        type: String,
        required: true
    },

    bio: { type: String },

    email: { type: String },

    interests: [String],

    preferredDestinations: [String],

    location: { type: String },


    locationDetails: {
    type: geographicalLocationSchema,
    default: null
},

destinationDetails: {
    type: [geographicalLocationSchema],
    default: [],
    validate: {
        validator: function (destinations) {
            return destinations.length <= 10;
        },
        message: 'Maximum 10 destinations allowed.'
    }
},

    travelStyle: { type: String },

    // Main profile picture
    profilePicture: {
        type: String,
        default: ''
    },

    // Profile photo gallery
    profilePictures: {
        type: [String],
        default: [],
        validate: {
            validator: function (photos) {
                return photos.length <= 6;
            },
            message: 'A maximum of 6 photos is allowed.'
        }
    },

    pastMathes: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Profile'
    },

    createdAt: {
        type: Date,
        default: Date.now
    }
});

profileSchema.pre('save', function (next) {
    if (Array.isArray(this.interests)) {
        this.interests = this.interests.map(
            i => i.toLowerCase().trim()
        );
    }

    next();
});

module.exports = mongoose.model('Profile', profileSchema);