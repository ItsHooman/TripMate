const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const Message = require ('../models/Message');
//const authenticate = require('../middleware/auth');
const router = express.Router();

// Send a message
router.post('/messages', async (req, res) => {
    const { senderId, recipientId, message, timestamp } = req.body;

    if (!senderId || !recipientId || !message.trim()) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
        const newMessage = new Message({
            senderId,
            recipientId,
            message,
            timestamp: new Date(),
        });

        await newMessage.save();
        res.status(201).json({ data: newMessage });
        console.log('Message saved to DB');
    } catch (error) {
        console.error('Error saving message:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Fetch messages between two users
router.get('/messages', async (req, res) => {
    const { userId, recipientId } = req.query;

    if (!userId || !recipientId) {
        return res.status(400).json({ error: 'Missing userId or recipientId' });
    }

    try {
        const messages = await Message.find({
            $or: [
                { senderId: userId, recipientId },
                { senderId: recipientId, recipientId: userId },
            ],
        }).sort({ timestamp: 1 });

        res.json(messages);
    } catch (error) {
        console.error('Error fetching messages:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.delete('/:senderId/:receiverId', async (req, res) => {
    const { senderId, receiverId } = req.params;

    try {
        // Delete all messages where senderId and receiverId match either way
        await Message.deleteMany({
            $or: [
                { sender: senderId, receiver: receiverId },
                { sender: receiverId, receiver: senderId }
            ]
        });

        res.status(200).json({ message: 'Chat history deleted successfully' });
    } catch (error) {
        console.error("Error deleting messages:", error);
        res.status(500).json({ error: "Failed to delete messages" });
    }
});
module.exports = router;