
const express = require("express");
const mongoose = require("mongoose");

const authenticate = require("../middleware/auth");
const User = require("../models/User");
const TravelMatch = require("../models/TravelMatch");

const router = express.Router();

/* ========================================
   SAVE A LIKE OR PASS
   POST /api/swipes
======================================== */

router.post("/", authenticate, async (req, res) => {
  try {
    const currentUserId = String(req.user.id);
    const { targetUserId, action } = req.body;

    if (
      !mongoose.isValidObjectId(currentUserId) ||
      !mongoose.isValidObjectId(targetUserId)
    ) {
      return res.status(400).json({
        message: "Invalid user ID.",
      });
    }

    if (!["like", "pass"].includes(action)) {
      return res.status(400).json({
        message: "Action must be like or pass.",
      });
    }

    const targetId = String(
      new mongoose.Types.ObjectId(targetUserId)
    );

    if (currentUserId === targetId) {
      return res.status(400).json({
        message: "You cannot swipe on yourself.",
      });
    }

    const targetUser = await User.findOne({
      _id: targetId,
      role: { $ne: "admin" },
      isBanned: { $ne: true },
      isActive: { $ne: false },
    })
      .select("name profile")
      .populate(
        "profile",
        "name profilePicture location interests"
      );

    if (!targetUser || !targetUser.profile) {
      return res.status(404).json({
        message: "Traveler not found.",
      });
    }

    /* CREATE A UNIQUE USER PAIR */

    const [userA, userB] = [
      currentUserId,
      targetId,
    ].sort();

    const pairKey = `${userA}:${userB}`;

    const decisionField =
      currentUserId === userA
        ? "decisionA"
        : "decisionB";

    /* CREATE THE PAIR IF IT DOES NOT EXIST */

    try {
      await TravelMatch.updateOne(
        { pairKey },
        {
          $setOnInsert: {
            pairKey,
            userA,
            userB,
            decisionA: "pending",
            decisionB: "pending",
            isMatched: false,
          },
        },
        { upsert: true }
      );
    } catch (error) {
      // Another request may have created the pair.
      if (error.code !== 11000) throw error;
    }

    /* SAVE THE USER'S DECISION */

    await TravelMatch.updateOne(
      {
        pairKey,
        isMatched: false,
      },
      {
        $set: {
          [decisionField]: action,
        },
      }
    );

    /* CHECK FOR A NEW MUTUAL MATCH */

    const newMatch = await TravelMatch.findOneAndUpdate(
      {
        pairKey,
        decisionA: "like",
        decisionB: "like",
        isMatched: false,
      },
      {
        $set: {
          isMatched: true,
          matchedAt: new Date(),
        },
      },
      { new: true }
    );

    const match = newMatch ||
      await TravelMatch.findOne({ pairKey });

    /* ADD BOTH USERS TO EACH OTHER'S CONTACTS */

    if (match.isMatched) {
      await User.bulkWrite([
        {
          updateOne: {
            filter: { _id: currentUserId },
            update: {
              $addToSet: {
                contacts: targetId,
              },
            },
          },
        },
        {
          updateOne: {
            filter: { _id: targetId },
            update: {
              $addToSet: {
                contacts: currentUserId,
              },
            },
          },
        },
      ]);
    }

    /* REAL-TIME MATCH NOTIFICATION */

    if (newMatch) {
      const io = req.app.get("io");

      const currentUser = await User.findById(
        currentUserId
      )
        .select("name profile")
        .populate(
          "profile",
          "name profilePicture location"
        );

      if (io) {
        io.to(targetId).emit("newMatch", {
          matchId: match._id,
          user: currentUser,
        });
      }
    }

    return res.json({
      success: true,
      action,
      isMatched: match.isMatched,
      isNewMatch: Boolean(newMatch),
      matchId: match._id,
      user: targetUser,
    });

  } catch (error) {
    console.error("Swipe error:", error);

    return res.status(500).json({
      message: "Unable to save your decision.",
    });
  }
});

/* ========================================
   GET ALL MUTUAL MATCHES
   GET /api/swipes/matches
======================================== */

router.get("/matches", authenticate, async (req, res) => {
  try {
    const currentUserId = String(req.user.id);

    const matches = await TravelMatch.find({
      isMatched: true,
      $or: [
        { userA: currentUserId },
        { userB: currentUserId },
      ],
    })
      .populate({
        path: "userA userB",
        select: "name profile",
        populate: {
          path: "profile",
          select: "name profilePicture location",
        },
      })
      .sort({ matchedAt: -1 });

    const result = matches
      .map((match) => {
        const otherUser =
          String(match.userA?._id) === currentUserId
            ? match.userB
            : match.userA;

        if (!otherUser) return null;

        return {
          matchId: match._id,
          matchedAt: match.matchedAt,
          user: otherUser,
        };
      })
      .filter(Boolean);

    return res.json({
      matches: result,
    });

  } catch (error) {
    console.error("Fetch mutual matches error:", error);

    return res.status(500).json({
      message: "Unable to fetch your matches.",
    });
  }
});

/* ========================================
   GET PREVIOUSLY SWIPED USERS
   GET /api/swipes/history
======================================== */

router.get("/history", authenticate, async (req, res) => {
  try {
    const currentUserId = String(req.user.id);

    const history = await TravelMatch.find({
      $or: [
        {
          userA: currentUserId,
          decisionA: { $in: ["like", "pass"] },
        },
        {
          userB: currentUserId,
          decisionB: { $in: ["like", "pass"] },
        },
      ],
    });

    const swipes = history.map((item) => {
      const isUserA =
        String(item.userA) === currentUserId;

      return {
        targetUserId: isUserA
          ? item.userB
          : item.userA,

        action: isUserA
          ? item.decisionA
          : item.decisionB,

        isMatched: item.isMatched,
      };
    });

    return res.json({ swipes });

  } catch (error) {
    console.error("Swipe history error:", error);

    return res.status(500).json({
      message: "Unable to fetch swipe history.",
    });
  }
});

module.exports = router;
