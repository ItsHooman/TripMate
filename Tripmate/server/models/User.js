const mongoose = require('mongoose');
const Profile = require('./Profile');

const UserSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    profile: { type: mongoose.Schema.Types.ObjectId, ref: 'Profile' },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    status: { type: String, default: 'active' }, 
    isActive: { type: Boolean, default: true },
    isBanned: { type: Boolean, default: false },
    contacts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);
