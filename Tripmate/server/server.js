
const express = require("express");
const cors = require("cors");
const path = require("path");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const http = require("http");

require("dotenv").config();

const User = require("./models/User");
const Notification = require("./models/Notification");

const {
  isValidUserId,
  activeUserFilter,
  areConnected,
} = require("./utils/connectionService");

const {
  saveMessage,
  broadcastMessage,
} = require("./utils/messageService");

/* ROUTES */

const userRoutes = require("./routes/auth");
const adminRoutes = require("./routes/adminRoutes");
const profileRoutes = require("./routes/profile");
const matchRoutes = require("./routes/matching");
const eventRoutes = require("./routes/event");
const usersRoutes = require("./routes/user");
const reportRoutes = require("./routes/reportRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const checkBan = require("./routes/checkban");
const messageRoutes = require("./routes/messages");
const swipeRoutes = require("./routes/swipes");
const locationRoutes = require('./routes/locations');

/* SERVER CONFIGURATION */

const app = express();
const server = http.createServer(app);

const CLIENT_URL =
  process.env.CLIENT_URL || "http://localhost:3000";

app.use(
  cors({
    origin: CLIENT_URL,
    credentials: true,
  })
);

app.use(express.json());

/* API ROUTES */

app.use("/api/auth", userRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/event", eventRoutes);
app.use("/api/matche", matchRoutes);
app.use("/api/message", messageRoutes);
app.use("/api/users", usersRoutes);
app.use("/api", checkBan);
app.use("/api/notifications", notificationRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/swipes", swipeRoutes);
app.use('/api/locations', locationRoutes);

/* STATIC FILES */

app.use(
  "/uploads",
  express.static(path.join(__dirname, "uploads"))
);

/* SOCKET.IO */

const io = require("socket.io")(server, {
  cors: {
    origin: CLIENT_URL,
    methods: ["GET", "POST"],
    credentials: true,
  },
});

app.set("io", io);

/* SOCKET AUTHENTICATION */

io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth?.token;

    if (!token) {
      return next(new Error("Authentication required."));
    }

    const verified = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    const userId = String(verified.id || "");

    if (!isValidUserId(userId)) {
      return next(new Error("Invalid user identity."));
    }

    const user = await User.findOne({
      _id: userId,
      ...activeUserFilter,
    })
      .select("_id name role")
      .lean();

    if (!user) {
      return next(new Error("Account unavailable."));
    }

    socket.data.userId = String(user._id);
    socket.data.name = user.name;
    socket.data.token = token;

    next();
  } catch (error) {
    next(new Error("Invalid or expired token."));
  }
});

/* REAL-TIME EVENTS */

io.on("connection", (socket) => {
  const userId = socket.data.userId;

  // Users automatically join their own private room.
  socket.join(userId);

  console.log(`Authenticated socket: ${userId}`);

  /* VERIFY TOKEN AND ACCOUNT FOR INCOMING EVENTS */

  socket.use(async (packet, next) => {
    try {
      jwt.verify(
        socket.data.token,
        process.env.JWT_SECRET
      );

      const active = await User.exists({
        _id: userId,
        ...activeUserFilter,
      });

      if (!active) {
        throw new Error("Account unavailable.");
      }

      next();
    } catch (error) {
      next(new Error("Authentication expired."));
      socket.disconnect(true);
    }
  });

  /* LEGACY ROOM EVENTS */

  // Existing frontend components can still emit these,
  // but cannot join another user's private room.

  socket.on("joinRoom", () => {
    socket.join(userId);
  });

  socket.on("registerUser", () => {
    socket.join(userId);
  });

  /* SEND MESSAGE */

  socket.on("sendMessage", async (data, callback) => {
    const reply =
      typeof callback === "function"
        ? callback
        : () => {};

    try {
      const savedMessage = await saveMessage(
        userId,
        data?.recipientId,
        data?.message
      );

      broadcastMessage(io, savedMessage);

      reply({
        success: true,
        message: savedMessage,
      });
    } catch (error) {
      console.error("Socket message error:", error);

      reply({
        success: false,
        message: error.status
          ? error.message
          : "Unable to send message.",
      });
    }
  });

  /* CONNECTION REQUEST */

  socket.on("connectionRequest", async (data, callback) => {
    const reply =
      typeof callback === "function"
        ? callback
        : () => {};

    try {
      const receiverId = String(
        data?.receiverId || ""
      );

      if (
        !isValidUserId(receiverId) ||
        receiverId === userId
      ) {
        return reply({
          success: false,
          message: "Invalid recipient.",
        });
      }

      const receiver = await User.findOne({
        _id: receiverId,
        role: { $ne: "admin" },
        ...activeUserFilter,
      })
        .select("_id")
        .lean();

      if (!receiver) {
        return reply({
          success: false,
          message: "Traveler unavailable.",
        });
      }

      if (await areConnected(userId, receiverId)) {
        return reply({
          success: false,
          message: "You are already connected.",
        });
      }

      const sender = await User.findById(userId)
        .select("_id name profile")
        .populate("profile", "name profilePicture")
        .lean();

      const senderName =
        sender?.profile?.name ||
        sender?.name ||
        "Traveler";

      const notification =
        await Notification.findOneAndUpdate(
          {
            userId: receiverId,
            senderId: userId,
            type: "connectionRequest",
          },
          {
            $setOnInsert: {
              userId: receiverId,
              senderId: userId,
              senderName,
              type: "connectionRequest",
              message:
                `${senderName} wants to connect with you.`,
              read: false,
              timestamp: new Date(),
            },
          },
          {
            upsert: true,
            new: true,
            setDefaultsOnInsert: true,
          }
        );

      io.to(receiverId).emit(
        "connectionRequest",
        {
          senderId: userId,
          user: sender,
          notification,
        }
      );

      reply({
        success: true,
        message: "Connection requested.",
      });
    } catch (error) {
      console.error("Connection request error:", error);

      reply({
        success: false,
        message: "Unable to request connection.",
      });
    }
  });

  /*
    Connection acceptance is now handled through:

    POST /api/notifications/:notificationId/accept

    The old acceptConnection and connectionAccepted
    client-side events are intentionally removed.
  */

  socket.on("disconnect", () => {
    console.log(`Socket disconnected: ${userId}`);
  });

  socket.on("error", (error) => {
    console.error("Socket error:", error.message);
  });
});

/* HEALTH CHECK */

app.get("/", (req, res) => {
  res.send("TripMate Backend is Running!");
});

/* START SERVER */

const PORT = process.env.PORT || 5002;

async function startServer() {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    console.log("MongoDB Connected");

    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Server startup failed:", error);
    process.exit(1);
  }
}

startServer();
