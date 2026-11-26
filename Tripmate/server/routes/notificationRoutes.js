
const express = require("express");

const authenticate = require("../middleware/auth");
const Notification = require("../models/Notification");
const User = require("../models/User");

const {
  connectUsers,
  isValidUserId,
} = require("../utils/connectionService");

const router = express.Router();

router.use(authenticate);

/* GET MY NOTIFICATIONS */

router.get("/", async (req, res) => {
  try {
    const notifications = await Notification.find({
      userId: req.user.id,
      type: { $ne: "connectionIgnored" },
    }).sort({ timestamp: -1 });

    res.json(notifications);
  } catch (error) {
    console.error("Notifications error:", error);

    res.status(500).json({
      message: "Unable to load notifications.",
    });
  }
});

/* ACCEPT CONNECTION REQUEST */

router.post("/:notificationId/accept", async (req, res) => {
  try {
    const { notificationId } = req.params;
    const userId = req.user.id;

    if (!isValidUserId(notificationId)) {
      return res.status(400).json({
        message: "Invalid notification.",
      });
    }

    const notification = await Notification.findOne({
      _id: notificationId,
      userId,
      type: "connectionRequest",
    });

    if (!notification) {
      return res.status(404).json({
        message: "Connection request not found.",
      });
    }

    const senderId = String(notification.senderId);

    await connectUsers(userId, senderId);

    notification.read = true;
    notification.type = "connectionAccepted";

    await notification.save();

    const sender = await User.findById(senderId)
      .select("_id name profile")
      .populate(
        "profile",
        "name profilePicture location"
      )
      .lean();

    const receiver = await User.findById(userId)
      .select("_id name profile")
      .populate(
        "profile",
        "name profilePicture location"
      )
      .lean();

    const io = req.app.get("io");

    if (io) {
      io.to(senderId).emit("connectionAccepted", {
        senderId: userId,
        senderName: receiver?.name,
        user: receiver,
      });

      io.to(userId).emit("connectionAccepted", {
        senderId,
        senderName: sender?.name,
        user: sender,
      });
    }

    res.json({
      success: true,
      user: sender,
    });
  } catch (error) {
    console.error("Accept connection error:", error);

    res.status(500).json({
      message: "Unable to accept connection.",
    });
  }
});

/* IGNORE CONNECTION REQUEST */

router.post("/:notificationId/ignore", async (req, res) => {
  try {
    const { notificationId } = req.params;

    if (!isValidUserId(notificationId)) {
      return res.status(400).json({
        message: "Invalid notification.",
      });
    }

    const notification =
      await Notification.findOneAndUpdate(
        {
          _id: notificationId,
          userId: req.user.id,
          type: "connectionRequest",
        },
        {
          $set: {
            type: "connectionIgnored",
            read: true,
          },
        },
        { new: true }
      );

    if (!notification) {
      return res.status(404).json({
        message: "Connection request not found.",
      });
    }

    res.json({
      success: true,
    });
  } catch (error) {
    console.error("Ignore connection error:", error);

    res.status(500).json({
      message: "Unable to ignore connection.",
    });
  }
});

/* MARK NOTIFICATION AS READ */

router.patch("/:notificationId/read", async (req, res) => {
  try {
    const { notificationId } = req.params;

    if (!isValidUserId(notificationId)) {
      return res.status(400).json({
        message: "Invalid notification.",
      });
    }

    const notification =
      await Notification.findOneAndUpdate(
        {
          _id: notificationId,
          userId: req.user.id,
        },
        {
          $set: { read: true },
        },
        { new: true }
      );

    if (!notification) {
      return res.status(404).json({
        message: "Notification not found.",
      });
    }

    res.json({
      success: true,
      notification,
    });
  } catch (error) {
    res.status(500).json({
      message: "Unable to update notification.",
    });
  }
});

module.exports = router;
