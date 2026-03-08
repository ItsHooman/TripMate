const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
    name: { type: String, required: true },
    type: { type: String, required: true },
    destination: { type: String, required: true },
    startDate: { type: Date, required: true },
    attendees: { type: Number, default: 0 },
    image: { type: String, required: true }, 
    description: { type: String, required: true }, 
    difficulty: { type: String, required: true }, 
    packingList: { type: [String], default: [] }, 
    host: {
        name: { type: String, required: true },
        email: { type: String, required: true },
        phone: { type: String, required: true },
    }, 
    gallery: { type: [String], default: [] }, 
    schedule: { type: [String], default: [] }, 
    reviews: [
        {
            author: { type: String, required: true }, 
            text: { type: String, required: true },  
        }
    ],
    participants: [
        {
            user: { type: mongoose.Schema.Types.ObjectId, ref: 'Profile' },
        }
    ]
});

module.exports = mongoose.model('Event', eventSchema);
