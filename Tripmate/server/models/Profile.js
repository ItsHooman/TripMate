const mongoose = require('mongoose');

const profileSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true },
    bio: { type: String },
    email: { type: String },
    interests: [String],
    preferredDestinations: [{ type: String }],
    location: { type: String },
    travelStyle: { type: String }, 
    profilePicture: { type: String },
    pastMathes: { type: mongoose.Schema.Types.ObjectId, ref: 'Profile' },
    createdAt: { type: Date, default: Date.now }
});

profileSchema.pre('save', function (next) {
    if (this.interests && Array.isArray(this.interests)) {
        this.interests = this.interests.map(i => i.toLowerCase().trim());
    }
    next();
});

module.exports = mongoose.model('Profile', profileSchema);
