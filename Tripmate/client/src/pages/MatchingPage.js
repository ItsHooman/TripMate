import React, { useContext, useEffect, useMemo, useState } from "react";
import TinderCard from "react-tinder-card";
import { Link, useNavigate } from "react-router-dom";
import { io } from "socket.io-client";

import { AuthContext } from "../context/AuthContext";
import API_BASE_URL from "../config/api";
import BottomNav from "../components/BottomNav";
import "../styles/MatchingPage.css";

const SOCKET_SERVER_URL =
  process.env.REACT_APP_SOCKET_URL || "http://localhost:5002";

const defaultProfilePicture =
  "https://i.postimg.cc/rwk4Qqd6/avatar-account-flat-isolated-on-transparent-background-for-graphic-and-web-design-default-social-med.jpg";

function MatchingPage() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const currentUserId = user?.id;

  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [socket, setSocket] = useState(null);

  const childRefs = useMemo(
    () => Array(matches.length).fill(null).map(() => React.createRef()),
    [matches]
  );

  useEffect(() => {
    const newSocket = io(SOCKET_SERVER_URL, { transports: ["websocket"] });
    setSocket(newSocket);

    newSocket.on("connect", () => {
      if (currentUserId) {
        newSocket.emit("joinRoom", currentUserId);
      }
    });

    newSocket.on("connectionAccepted", (data) => {
      const { senderId, senderName } = data;

      let connectedUsers =
        JSON.parse(localStorage.getItem("connectedUsers")) || [];

      if (!connectedUsers.some((connectedUser) => connectedUser._id === senderId)) {
        connectedUsers.push({
          _id: senderId,
          name: senderName || "Anonymous",
        });
        localStorage.setItem("connectedUsers", JSON.stringify(connectedUsers));
      }

      navigate("/messages", {
        state: {
          connectedUsers,
          currentUserId,
        },
      });
    });

    newSocket.on("connectionConfirmed", (data) => {
      const { receiverId, receiverName, senderId, senderName } = data;

      let connectedUsers =
        JSON.parse(localStorage.getItem("connectedUsers")) || [];

      if (
        receiverId &&
        !connectedUsers.some((connectedUser) => connectedUser._id === receiverId)
      ) {
        connectedUsers.push({
          _id: receiverId,
          name: receiverName || "Anonymous",
        });
      }

      if (
        senderId &&
        !connectedUsers.some((connectedUser) => connectedUser._id === senderId)
      ) {
        connectedUsers.push({
          _id: senderId,
          name: senderName || "Anonymous",
        });
      }

      localStorage.setItem("connectedUsers", JSON.stringify(connectedUsers));

      navigate("/messages", {
        state: {
          connectedUsers,
          currentUserId,
        },
      });
    });

    return () => {
      newSocket.off("connectionAccepted");
      newSocket.off("connectionConfirmed");
      newSocket.disconnect();
    };
  }, [currentUserId, navigate]);

  useEffect(() => {
  const fetchMatches = async () => {
    if (!currentUserId) return;

    setLoading(true);
    setError("");

    try {
      const token = localStorage.getItem("token");

      const response = await fetch(`${API_BASE_URL}/matche`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || data.error || `Request failed with status ${response.status}`
        );
      }

      const matchList = Array.isArray(data) ? data : data.matches || [];

      const filteredMatches = matchList.filter(
        (match) => match._id !== currentUserId && match.role !== "admin"
      );

      setMatches(filteredMatches);
      setCurrentIndex(filteredMatches.length - 1);
    } catch (err) {
      console.error("MATCH FETCH ERROR:", err);
      setError(err.message || "Failed to fetch matches.");
    } finally {
      setLoading(false);
    }
  };

  fetchMatches();
}, [currentUserId]);

  const handleSwipe = (direction, match, index) => {
    if (direction === "right") {
      const likedUsers = JSON.parse(localStorage.getItem("likedUsers")) || [];
      const alreadyLiked = likedUsers.some((likedUser) => likedUser._id === match._id);

      if (!alreadyLiked) {
        const updatedLikedUsers = [...likedUsers, match];
        localStorage.setItem("likedUsers", JSON.stringify(updatedLikedUsers));
      }
    }

    setCurrentIndex(index - 1);
  };

  const handleConnect = (match) => {
    let connectedUsers =
      JSON.parse(localStorage.getItem("connectedUsers")) || [];

    if (!connectedUsers.some((connectedUser) => connectedUser._id === match._id)) {
      connectedUsers.push(match);
      localStorage.setItem("connectedUsers", JSON.stringify(connectedUsers));
    }

    if (socket && currentUserId) {
      socket.emit("connectionRequest", {
        senderId: currentUserId,
        receiverId: match._id,
        user: {
          _id: currentUserId,
          name: user?.name || "Anonymous",
        },
      });
    }

    navigate("/messages", {
      state: {
        connectedUsers,
        currentUserId,
      },
    });
  };

  const swipe = async (direction) => {
    if (currentIndex >= 0 && currentIndex < childRefs.length) {
      await childRefs[currentIndex].current.swipe(direction);
    }
  };

  return (
  <div className="matching-page-container">
    <img
      src="/logo.png"
      alt="TripMate Logo"
      className="floating-logo"
    />

    <div className="matching-page-inner">
      {loading ? (
        <p className="matching-status-text">Loading matches...</p>
      ) : error ? (
        <p className="matching-status-text">{error}</p>
      ) : matches.length > 0 ? (
        <div className="matching-main-stack">
          <div className="tinder-cards-container">
            {matches.map((match, index) => (
              <TinderCard
                key={match._id}
                ref={childRefs[index]}
                className="swipe"
                onSwipe={(direction) => handleSwipe(direction, match, index)}
                preventSwipe={["up", "down"]}
              >
                <div className="match-card-simple">
                  <div className="swipe-feedback nope">Nope</div>
                  <div className="swipe-feedback like">Like</div>

                  <img
                    src={match.profile?.profilePicture || defaultProfilePicture}
                    alt={match.profile?.name || "Anonymous"}
                    className="match-profile-image-simple"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = defaultProfilePicture;
                    }}
                  />

                  <div className="match-card-body">
                    <h2 className="match-name">
                      {match.profile?.name || "Anonymous"}
                    </h2>

                    <p className="match-bio">
                      {match.profile?.bio || "No bio added yet."}
                    </p>

                    <div className="match-info-group">
                      <h4>Interests</h4>
                      <p>
                        {match.profile?.interests?.length
                          ? match.profile.interests.join(", ")
                          : "No interests added yet."}
                      </p>
                    </div>

                    <div className="match-card-actions">
                      <button
                        className="match-connect-button"
                        onClick={() => handleConnect(match)}
                      >
                        Connect
                      </button>

                      <Link
                        to={`/user-profile/${match._id}`}
                        className="profile-link-simple"
                      >
                        View Profile
                      </Link>
                    </div>
                  </div>

                  <div className="card-swipe-actions">
                    <button
                      className="swipe-action-btn swipe-no"
                      onClick={() => swipe("left")}
                      disabled={currentIndex < 0}
                    >
                      ✕
                    </button>

                    <button
                      className="swipe-action-btn swipe-yes"
                      onClick={() => swipe("right")}
                      disabled={currentIndex < 0}
                    >
                      ✓
                    </button>
                  </div>
                </div>
              </TinderCard>
            ))}
          </div>
        </div>
      ) : (
        <p className="matching-status-text">No matches found yet.</p>
      )}
    </div>

    <div className="matching-bottom-nav-wrap">
      <BottomNav />
    </div>
  </div>
);
}

export default MatchingPage;