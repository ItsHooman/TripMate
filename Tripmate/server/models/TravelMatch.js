
const mongoose = require("mongoose");

const travelMatchSchema = new mongoose.Schema(
  {
    pairKey: {
      type: String,
      required: true,
      unique: true,
    },

    userA: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    userB: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    decisionA: {
      type: String,
      enum: ["pending", "like", "pass"],
      default: "pending",
    },

    decisionB: {
      type: String,
      enum: ["pending", "like", "pass"],
      default: "pending",
    },

    isMatched: {
      type: Boolean,
      default: false,
    },

    matchedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

travelMatchSchema.index({ userA: 1, isMatched: 1 });
travelMatchSchema.index({ userB: 1, isMatched: 1 });

module.exports = mongoose.model(
  "TravelMatch",
  travelMatchSchema
);
