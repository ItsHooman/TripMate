
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const User = require("../models/User");

require("dotenv").config();

const authenticate = async (req, res, next) => {
  const authorization = req.header("Authorization");

  if (!authorization?.startsWith("Bearer ")) {
    return res.status(401).json({
      message: "Authentication required.",
    });
  }

  const token = authorization.split(" ")[1];

  try {
    const verified = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    if (!mongoose.isValidObjectId(verified.id)) {
      return res.status(401).json({
        message: "Invalid user identity.",
      });
    }

    const user = await User.findById(verified.id)
      .select("_id role status isActive isBanned")
      .lean();

    if (!user) {
      return res.status(401).json({
        message: "User not found.",
      });
    }

    if (
      user.isBanned ||
      user.status === "banned" ||
      user.isActive === false
    ) {
      return res.status(403).json({
        message: "Your account is unavailable.",
      });
    }

    req.user = {
      ...verified,
      id: String(user._id),
      role: user.role,
    };

    next();

  } catch (error) {
    return res.status(401).json({
      message: "Invalid or expired token.",
    });
  }
};

module.exports = authenticate;
