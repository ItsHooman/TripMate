const express = require('express');
const cors = require('cors');
const path = require('path');
const multer = require('multer');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
require('dotenv').config();
const http = require('http');
const app = express();
const server = http.createServer(app);
const Message = require('./models/Message');
const User = require('./models/User');
const Notification = require('./models/Notification');
const userRoutes = require('./routes/auth');
const adminRoutes = require('./routes/adminRoutes');
const profileRoutes = require('./routes/profile');
const matchRoutes = require('./routes/matching');
const eventRoutes = require('./routes/event');
const usersRoutes = require('./routes/user');
const reportRoutes = require('./routes/reportRoutes');
const NotificationRoutes = require('./routes/notificationRoutes');
const checkBan = require('./routes/checkban');
const messageRoutes = require('./routes/messages');


// Middleware
app.use(cors());
app.use(bodyParser.json());

//Other Middleware and routes ....
app.use('/api/auth', userRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/event', eventRoutes);
app.use('/api/matche', matchRoutes);
app.use('/api/message', messageRoutes);
app.use('/api/users', usersRoutes);
app.use('/api', checkBan);
app.use('/api/notifications', NotificationRoutes);
app.use('/api/reports', reportRoutes);

// Serve static assets if in production
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Socket.io instance
const io = require('socket.io')(server, {
    cors: {
        origin: "http://localhost:3000", 
        methods: ["GET", "POST"],
    },
});


// MongoDB Connection
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).then(() => {
    console.log('MongoDB Connected');
}).catch((err) => console.log(err));

// Test Route
app.get('/', (req, res) => {
    res.send('TripMate Backend is Running!');
});

const connectedUsers = {};

// Socket.io
io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    socket.on('registerUser', (userId) => {
        if (userId) {
          connectedUsers[userId] = socket.id;
          console.log(`🔗 User registered: ${userId} -> ${socket.id}`);
        }
      });

    // Listen for message events
    socket.on('sendMessage', (data) => {
        const { senderId, recipientId, message } = data;
    
        // Validate message data
        if (!senderId || !recipientId || !message || typeof message !== 'string' || !message.trim()) {
            console.error('Invalid message data:', data);
            return;
        }
        console.log('Received sendMessage event:', data); 
    
        // Save message to database (optional)
        const newMessage = new Message({
            senderId: data.senderId,
            recipientId: data.recipientId,
            message: data.message,
            timestamp: new Date(),
        });
        newMessage.save().then(() => console.log('Message saved to DB'));
    
        // Emit message to the recipient
        io.to(recipientId).emit('receiveMessage', {
            senderId,
            message,
            timestamp: new Date().toISOString(),
        });
        console.log(`Message sent to recipient ${recipientId}`);
    });    

    // Join a room for a specific user
    socket.on('joinRoom', (userId) => {
        if (userId) {
          connectedUsers[userId] = socket.id;
          socket.join(userId);
          console.log(`User ${userId} joined with socket ID: ${socket.id}`);
        } else {
          console.error('joinRoom: Missing or invalid userId');
        }
      });
    
      // Handle connection request
      socket.on('connectionRequest', async ({ senderId, receiverId, user }) => {
        console.log('Connection Request Data:', { senderId, receiverId, user });
    
        // Save the connection request notification to the database
        const notification = new Notification({
          userId: receiverId, // The user receiving the notification
          type: 'connectionRequest',
          senderId: senderId, // The sender of the request
          senderName: user.name,
          message: `${user.name} wants to connect with you.`,
        });
    
        try {
          await notification.save();
          console.log('Connection request saved to DB');
        } catch (error) {
          console.error('Error saving connection request:', error);
        }
    
        // Emit the connection request to the receiver
        if (connectedUsers[receiverId]) {
          io.to(connectedUsers[receiverId]).emit('connectionRequest', {
            senderId,
            user,
          });
        }
      });
    
      // Handle connection acceptance
      socket.on('connectionAccepted', async ({ senderId, receiverId, senderName }) => {
        console.log('Processing connectionAccepted event...');
    
        // Check if senderId and receiverId exist in connectedUsers
        if (connectedUsers[senderId]) {
          console.log(`Emitting connectionConfirmed to sender: ${senderId}`);
          io.to(connectedUsers[senderId]).emit('connectionConfirmed', {
            receiverId,
            receiverName: senderName,
          });
        }
    
        if (connectedUsers[receiverId]) {
          console.log(`Emitting connectionAccepted to receiver: ${receiverId}`);
          io.to(connectedUsers[receiverId]).emit('connectionAccepted', {
            senderId,
            senderName,
          });
        }
    
        // Update the connection request notification status to 'read' in the database
        try {
          await Notification.updateOne(
            { userId: receiverId, senderId: senderId, type: 'connectionRequest' },
            { $set: { read: true } }
          );
          console.log('Connection request status updated to read');
        } catch (error) {
          console.error('Error updating notification:', error);
        }
      });

      socket.on('acceptConnection', async ({ senderId, userId }) => {
        console.log(`📩 acceptConnection received: sender=${senderId}, receiver=${userId}`);
        console.log(`🔍 Current connected users:`, connectedUsers);
      
        if (!connectedUsers[senderId] || !connectedUsers[userId]) {
          console.log(`⚠️ One of the users is not online.`);
          return;
        }
      
        console.log(`✅ Both users are online! Proceeding...`);
      
        try {
          // Fetch sender and receiver names from the database
          const sender = await User.findById(senderId);
          const receiver = await User.findById(userId);
      
          if (!sender || !receiver) {
            console.error("❌ Error: One of the users does not exist in the database.");
            return;
          }
      
          console.log(`📢 Sending connectionAccepted events: ${sender.name} <-> ${receiver.name}`);
      
          // Emit events to both users
          io.to(connectedUsers[senderId]).emit('connectionAccepted', {
            senderId: userId,
            senderName: receiver.name, // Receiver's name for sender
          });
      
          io.to(connectedUsers[userId]).emit('connectionAccepted', {
            senderId,
            senderName: sender.name, // Sender's name for receiver
          });
      
          // Update notification in the database
          await Notification.updateOne(
            { userId, senderId, type: 'connectionRequest' },
            { $set: { read: true, type: 'connectionAccepted' } }
          );
      
          console.log('✅ Connection request updated to accepted in database');
        } catch (error) {
          console.error('❌ Error fetching user names:', error);
        }
      });          
    
      // Handle user disconnecting
      socket.on('disconnect', () => {
        console.log('A user disconnected:', socket.id);
        // Remove the user from the connected users list
        for (const [userId, socketId] of Object.entries(connectedUsers)) {
          if (socketId === socket.id) {
            delete connectedUsers[userId];
            console.log(`User ${userId} disconnected`);
          }
        }
      });
    });

// Server Listening
const PORT = process.env.PORT || 5002;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));