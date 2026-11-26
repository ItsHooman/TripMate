
const mongoose = require("mongoose");
const User = require("../models/User");

const isValidUserId = (id) =>
  typeof id === "string" &&
  mongoose.isValidObjectId(id);

const activeUserFilter = {
  status: { $ne: "banned" },
  isBanned: { $ne: true },
  isActive: { $ne: false },
};

async function areConnected(firstId, secondId) {
  firstId = String(firstId || "");
  secondId = String(secondId || "");

  if (
    !isValidUserId(firstId) ||
    !isValidUserId(secondId) ||
    firstId === secondId
  ) {
    return false;
  }

  const [firstUser, secondUser] = await Promise.all([
    User.exists({
      _id: firstId,
      contacts: secondId,
      ...activeUserFilter,
    }),

    User.exists({
      _id: secondId,
      contacts: firstId,
      ...activeUserFilter,
    }),
  ]);

  return Boolean(firstUser && secondUser);
}

async function getConnections(userId) {
  const user = await User.findById(userId)
    .select("contacts")
    .populate({
      path: "contacts",
      match: {
        ...activeUserFilter,
        contacts: userId,
      },
      select: "_id name profile",
      populate: {
        path: "profile",
        select: "name profilePicture location",
      },
    })
    .lean();

  return user?.contacts || [];
}

async function connectUsers(firstId, secondId) {
  firstId = String(firstId || "");
  secondId = String(secondId || "");

  if (
    !isValidUserId(firstId) ||
    !isValidUserId(secondId) ||
    firstId === secondId
  ) {
    throw new Error("Invalid connection.");
  }

  const count = await User.countDocuments({
    _id: { $in: [firstId, secondId] },
    ...activeUserFilter,
  });

  if (count !== 2) {
    throw new Error("One of the users is unavailable.");
  }

  await User.bulkWrite([
    {
      updateOne: {
        filter: { _id: firstId },
        update: {
          $addToSet: { contacts: secondId },
        },
      },
    },
    {
      updateOne: {
        filter: { _id: secondId },
        update: {
          $addToSet: { contacts: firstId },
        },
      },
    },
  ]);
}

async function disconnectUsers(firstId, secondId) {
  await User.bulkWrite([
    {
      updateOne: {
        filter: { _id: firstId },
        update: {
          $pull: { contacts: secondId },
        },
      },
    },
    {
      updateOne: {
        filter: { _id: secondId },
        update: {
          $pull: { contacts: firstId },
        },
      },
    },
  ]);
}

module.exports = {
  isValidUserId,
  activeUserFilter,
  areConnected,
  getConnections,
  connectUsers,
  disconnectUsers,
};
