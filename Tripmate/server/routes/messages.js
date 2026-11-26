
const express = require("express");
const authenticate = require("../middleware/auth");
const Message = require("../models/Message");
const TravelMatch = require("../models/TravelMatch");

const {
  areConnected,
  getConnections,
  disconnectUsers,
  isValidUserId,
} = require("../utils/connectionService");

const {
  saveMessage,
  broadcastMessage,
} = require("../utils/messageService");

const router = express.Router();

router.use(authenticate);

/* GET ALL CONNECTIONS */

router.get("/connections", async (req, res) => {
  try {
    const connections = await getConnections(req.user.id);

    res.json(connections);
  } catch (error) {
    console.error("Connections error:", error);

    res.status(500).json({
      message: "Unable to load connections.",
    });
  }
});

/* SEND A MESSAGE */

router.post("/messages", async (req, res) => {
  try {
    const { recipientId, message } = req.body;

    const savedMessage = await saveMessage(
      req.user.id,
      recipientId,
      message
    );

    broadcastMessage(
      req.app.get("io"),
      savedMessage
    );

    res.status(201).json({
      data: savedMessage,
    });
  } catch (error) {
    console.error("Send message error:", error);

    res.status(error.status || 500).json({
      message: error.status
        ? error.message
        : "Unable to send message.",
    });
  }
});

/* GET CONVERSATION HISTORY */

router.get("/messages", async (req, res) => {
  try {
    const userId = req.user.id;
    const { recipientId } = req.query;

    if (!isValidUserId(recipientId)) {
      return res.status(400).json({
        message: "Invalid recipient.",
      });
    }

    const connected = await areConnected(
      userId,
      recipientId
    );

    if (!connected) {
      return res.status(403).json({
        message: "You are not connected to this traveler.",
      });
    }

    const messages = await Message.find({
      $or: [
        {
          senderId: userId,
          recipientId,
        },
        {
          senderId: recipientId,
          recipientId: userId,
        },
      ],
    })
      .sort({ timestamp: 1 })
      .lean();

    res.json(messages);
  } catch (error) {
    console.error("Message history error:", error);

    res.status(500).json({
      message: "Unable to load messages.",
    });
  }
});

/* DISCONNECT FROM A USER */

router.delete(
  "/connections/:recipientId",
  async (req, res) => {
    try {
      const userId = req.user.id;
      const { recipientId } = req.params;

      if (
        !isValidUserId(recipientId) ||
        userId === recipientId
      ) {
        return res.status(400).json({
          message: "Invalid recipient.",
        });
      }

      const pairKey = [
        userId,
        recipientId,
      ].sort().join(":");

      await TravelMatch.updateOne(
        { pairKey },
        {
          $set: {
            decisionA: "pass",
            decisionB: "pass",
            isMatched: false,
            matchedAt: null,
          },
        }
      );

      await disconnectUsers(
        userId,
        recipientId
      );

      const io = req.app.get("io");

      if (io) {
        io.to(userId).emit("connectionRemoved", {
          userId: recipientId,
        });

        io.to(recipientId).emit("connectionRemoved", {
          userId,
        });
      }

      res.json({
        success: true,
        message: "Connection removed.",
      });
    } catch (error) {
      console.error("Disconnect error:", error);

      res.status(500).json({
        message: "Unable to disconnect.",
      });
    }
  }
);


/* GET UNREAD MESSAGE COUNTS */

router.get("/unread", async (req, res) => {
  try {
    const connections = await getConnections(req.user.id);

    const connectionIds = connections.map(
      (connection) => connection._id
    );

    const unreadMessages = await Message.find({
      recipientId: req.user.id,
      senderId: { $in: connectionIds },
      isRead: false,
    })
      .select("senderId")
      .lean();

    const bySender = {};

    unreadMessages.forEach((message) => {
      const senderId = String(message.senderId);

      bySender[senderId] =
        (bySender[senderId] || 0) + 1;
    });

    res.json({
      total: unreadMessages.length,
      bySender,
    });
  } catch (error) {
    console.error("Unread messages error:", error);

    res.status(500).json({
      message: "Unable to load unread messages.",
    });
  }
});

/* MARK CONVERSATION AS READ */

router.patch(
  "/read/:senderId",
  async (req, res) => {
    try {
      const userId = req.user.id;
      const { senderId } = req.params;

      if (!isValidUserId(senderId)) {
        return res.status(400).json({
          message: "Invalid sender.",
        });
      }

      if (!(await areConnected(userId, senderId))) {
        return res.status(403).json({
          message: "You are not connected.",
        });
      }

      const result = await Message.updateMany(
        {
          senderId,
          recipientId: userId,
          isRead: false,
        },
        {
          $set: {
            isRead: true,
          },
        }
      );

      const io = req.app.get("io");

      if (io) {
        io.to(userId).emit("messagesRead", {
          senderId,
        });
      }

      res.json({
        success: true,
        markedAsRead: result.modifiedCount,
      });
    } catch (error) {
      console.error("Mark as read error:", error);

      res.status(500).json({
        message: "Unable to mark messages as read.",
      });
    }
  }
);


module.exports = router;
