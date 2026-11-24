
import React, { useEffect } from "react";

import {
  FaHeart,
  FaCommentDots,
  FaUserAlt,
  FaTimes,
} from "react-icons/fa";

import API_BASE_URL from "../config/api";
import "../styles/TripMatchModal.css";

const getImageUrl = (value) => {
  if (!value) return "";

  if (value.startsWith("/uploads/")) {
    return `${API_BASE_URL.replace(/\/api\/?$/, "")}${value}`;
  }

  return value;
};

function MatchAvatar({ user }) {
  const picture =
    user?.profile?.profilePicture ||
    user?.profilePicture;

  const name =
    user?.profile?.name ||
    user?.name ||
    "Traveler";

  return (
    <div className="tm-avatar">
      {picture ? (
        <img
          src={getImageUrl(picture)}
          alt={name}
        />
      ) : (
        <FaUserAlt />
      )}
    </div>
  );
}

function TripMatchModal({
  currentUser,
  matchedUser,
  onClose,
  onMessage,
}) {
  useEffect(() => {
    if (!matchedUser) return;

    const previousOverflow =
      document.body.style.overflow;

    document.body.style.overflow = "hidden";

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener(
      "keydown",
      handleKeyDown
    );

    return () => {
      document.body.style.overflow =
        previousOverflow;

      document.removeEventListener(
        "keydown",
        handleKeyDown
      );
    };
  }, [matchedUser, onClose]);

  if (!matchedUser) return null;

  const matchedName =
    matchedUser.profile?.name ||
    matchedUser.name ||
    "your travel mate";

  return (
    <div className="tm-overlay">
      <section
        className="tm-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="tm-title"
      >
        <button
          className="tm-close"
          onClick={onClose}
          aria-label="Close match celebration"
          autoFocus
        >
          <FaTimes />
        </button>

        <div className="tm-celebration">
          <FaHeart />
        </div>

        <span className="tm-eyebrow">
          A NEW ADVENTURE BEGINS
        </span>

        <h2 id="tm-title">
          It's a TripMatch!
        </h2>

        <p>
          You and {matchedName} liked each other.
          Your next adventure starts here.
        </p>

        <div className="tm-avatars">
          <MatchAvatar user={currentUser} />

          <div className="tm-heart">
            <FaHeart />
          </div>

          <MatchAvatar user={matchedUser} />
        </div>

        <button
          className="tm-message-button"
          onClick={() => onMessage(matchedUser)}
        >
          <FaCommentDots />
          Start a conversation
        </button>

        <button
          className="tm-continue-button"
          onClick={onClose}
        >
          Keep discovering
        </button>
      </section>
    </div>
  );
}

export default TripMatchModal;
