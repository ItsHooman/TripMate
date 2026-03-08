const express = require('express');
const Event = require('../models/Event');
const Profile = require('../models/Profile');
const router = express.Router();
const adminauthenticate = require('../middleware/admin');

// Get all events
router.get('/', async (req, res) => {
    try {
        const events = await Event.find();
        res.status(200).json(events);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching events', error: error.message });
    }
});

router.get('/with-participants', async (req, res) => {
    try {
        const eventsWithParticipants = await Event.find({ participants: { $exists: true, $not: { $size: 0 } } })
            .populate('participants.user', 'name email profilePicture')
            .exec();
        res.status(200).json(eventsWithParticipants);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching events with participants', error: error.message });
    }
});

// Get event by ID
router.get('/:id', async (req, res) => {
    try {
        const event = await Event.findById(req.params.id);
        if (!event) return res.status(404).json({ message: 'Event not found' });
        res.status(200).json(event);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching event', error: error.message });
    }
});

router.post('/:id/reviews', async (req, res) => {
    const { id } = req.params;
    const { author, text } = req.body;

    if (!author || !text) {
        return res.status(400).json({ error: "Author and text are required." });
    }

    try {
        const event = await Event.findById(id);
        if (!event) {
            return res.status(404).json({ error: "Event not found." });
        }

        event.reviews.push({ author, text });
        await event.save();

        res.status(200).json({ message: "Review added successfully.", reviews: event.reviews });
    } catch (error) {
        res.status(500).json({ error: "An error occurred while adding the review." });
    }
});

// Add a route to filter events
router.get('/search', async (req, res) => {
    const { destination, date, type } = req.query;

    try {
        const filter = {};
        if (destination) filter.destination = { $regex: destination, $options: 'i' }; 
        if (date) filter.date = { $gte: new Date(date) }; 
        if (type) filter.type = type;

        const events = await Event.find(filter);
        res.status(200).json(events);
    } catch (err) {
        res.status(400).json({ message: 'Error fetching events' });
    }
});

// Admin-only route for creating an event
router.post('/admin/events', adminauthenticate, async (req, res) => {
    const {
        name,
        startDate,
        destination,
        type,
        image,
        description,
        difficulty,
        packingList,
        schedule,
        host: { name: hostName, email, phone },
    } = req.body;

    // Check if all required fields are provided
    if (!name || !startDate || !destination || !type || !image || !description || !difficulty) {
        return res.status(400).json({ message: 'Please provide all required fields.' });
    }

    try {
        const newEvent = new Event({
            name,
            startDate,
            destination,
            type,
            image,
            description, // Event description
            difficulty, // Event difficulty
            attendees: 0, 
            packingList: packingList || [], // Empty array if not provided
            host: {
                name: hostName,
                email,
                phone,
            },
            gallery: [], // Empty gallery array to be filled later
            schedule: schedule || [], // Empty schedule array if not provided
        });

        await newEvent.save();
        res.status(201).json({ message: 'Event created successfully', event: newEvent });
    } catch (error) {
        console.error('Error creating event:', error);
        res.status(500).json({ message: 'Error creating event', error: error.message });
    }
});

// Admin-only route for updating an event
router.put('/admin/events/:id', adminauthenticate, async (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Access denied. Admins only.' });
    }

    const { id } = req.params;
    const { name, description, date, destination, type, image, difficulty, packingList, host, gallery, schedule } = req.body;

    try {
        const updatedEvent = await Event.findByIdAndUpdate(
            id,
            { name, description, date, destination, type, image, difficulty, packingList, host, gallery, schedule },
            { new: true }
        );
        if (!updatedEvent) {
            return res.status(404).json({ message: 'Event not found' });
        }
        res.json({ message: 'Event updated successfully', event: updatedEvent });
    } catch (error) {
        res.status(500).json({ message: 'Error updating event', error: error.message });
    }
});

// Admin-only route for deleting an event
router.delete('/admin/events/:id', adminauthenticate, async (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Access denied. Admins only.' });
    }

    const { id } = req.params;

    try {
        const deletedEvent = await Event.findByIdAndDelete(id);
        if (!deletedEvent) {
            return res.status(404).json({ message: 'Event not found' });
        }
        res.json({ message: 'Event deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting event', error: error.message });
    }
});

// RSVP route
router.post('/:id/rsvp', async (req, res) => {
    const { name, email } = req.body;
    const { id } = req.params;

    try {
        const profile = await Profile.findOne({ name });
        if (!profile) {
            return res.status(404).json({ error: 'Profile not found.' });
        }

        const event = await Event.findById(id);
        if (!event) {
            return res.status(404).json({ error: 'Event not found.' });
        }

        event.participants.push({ user: profile._id });
        await event.save();

        await event.populate('participants.user', 'name email profilePicture');

        res.status(200).json({ participants: event.participants });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'An error occurred while processing your RSVP.' });
    }
});

// Get event with populated participants (including user details)
router.get("/:id/participants", async (req, res) => {
    const { id } = req.params;

    try {
        const event = await Event.findById(id)
            .populate('participants.user', 'name email profilePicture')  
            .exec();

        if (!event) {
            return res.status(404).json({ error: "Event not found." });
        }

        res.status(200).json(event);
    } catch (error) {
        res.status(500).json({ error: "Server error. Please try again later." });
    }
});

module.exports = router;
