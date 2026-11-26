
const Message = require("../models/Message");

const {
  areConnected,
  isValidUserId,
} = require("./connectionService");

async function saveMessage(
  senderId,
  recipientId,
  message
) {
  senderId = String(senderId || "");
  recipientId = String(recipientId || "");

  if (
    !isValidUserId(senderId) ||
    !isValidUserId(recipientId) ||
    senderId === recipientId
  ) {
    const error = new Error("Invalid recipient.");
    error.status = 400;
    throw error;
  }

  if (
    typeof message !== "string" ||
    !message.trim() ||
    message.trim().length > 4000
  ) {
    const error = new Error(
      "Message must contain between 1 and 4000 characters."
    );

    error.status = 400;
    throw error;
  }

  const connected = await areConnected(
    senderId,
    recipientId
  );

  if (!connected) {
    const error = new Error(
      "You can only message confirmed connections."
    );

    error.status = 403;
    throw error;
  }

  const savedMessage = await Message.create({
    senderId,
    recipientId,
    message: message.trim(),
    timestamp: new Date(),
  });

  return savedMessage.toObject();
}

function broadcastMessage(io, message) {
  if (!io) return;

  io.to(String(message.senderId))
    .to(String(message.recipientId))
    .emit("receiveMessage", message);
}

module.exports = {
  saveMessage,
  broadcastMessage,
};
