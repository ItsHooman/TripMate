
import React, {
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

import TinderCard from "react-tinder-card";
import { Link, useNavigate } from "react-router-dom";
import { io } from "socket.io-client";

import {
  FaUserAlt,
  FaMapMarkerAlt,
  FaGlobeAmericas,
  FaHeart,
  FaTimes,
  FaUserPlus,
  FaCompass,
  FaRedo,
  FaCheckCircle,
  FaStar,
  FaArrowRight,
} from "react-icons/fa";

import AppShell from "../components/AppShell";
import { AuthContext } from "../context/AuthContext";
import API_BASE_URL from "../config/api";
import "../styles/MatchingPage.css";

const SOCKET_SERVER_URL =
  process.env.REACT_APP_SOCKET_URL || "http://localhost:5002";

const normalizeList = (value) => {
  if (Array.isArray(value)) return value.filter(Boolean);

  if (typeof value === "string") {
    return value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
};

const normalizeText = (value) =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");

const readStorage = (key) => {
  try {
    const value = JSON.parse(localStorage.getItem(key));
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
};

const getImageUrl = (value) => {
  if (!value) return "";

  if (value.startsWith("/uploads/")) {
    return `${API_BASE_URL.replace(/\/api\/?$/, "")}${value}`;
  }

  return value;
};

/* COMPATIBILITY INDICATOR */

function CompatibilityRing({ score }) {
  const available =
    typeof score === "number" && Number.isFinite(score);

  const percentage = available
    ? Math.max(0, Math.min(100, Math.round(score)))
    : 0;

  const radius = 35;
  const circumference = 2 * Math.PI * radius;

  const color =
    percentage >= 75
      ? "#39865b"
      : percentage >= 50
      ? "#a17a36"
      : "#9b8071";

  return (
    <div
      className="match-score-ring"
      aria-label={
        available
          ? `${percentage}% profile compatibility`
          : "Compatibility unavailable"
      }
    >
      <svg viewBox="0 0 84 84" aria-hidden="true">
        <circle
          cx="42"
          cy="42"
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="5"
          className="match-ring-track"
        />

        <circle
          cx="42"
          cy="42"
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="5"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={
            circumference * (1 - percentage / 100)
          }
          transform="rotate(-90 42 42)"
        />
      </svg>

      <div className="match-score-content" style={{ color }}>
        <strong>
          {available ? `${percentage}%` : "—"}
        </strong>
        <span>Match</span>
      </div>
    </div>
  );
}

/* MAIN MATCHING PAGE */

function MatchingPage() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const currentUserId = user?.id || user?._id;

  const [matches, setMatches] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [profileIncomplete, setProfileIncomplete] =
    useState(false);

  const [socket, setSocket] = useState(null);
  const [socketConnected, setSocketConnected] =
    useState(false);

  const [swipeDirection, setSwipeDirection] =
    useState("");

  const [isSwiping, setIsSwiping] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [actionMessage, setActionMessage] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  const cardRef = useRef(null);
  const swipeLock = useRef(false);

  const currentMatch = matches[currentIndex];
  const profile = currentMatch?.profile || {};

  const interests = normalizeList(profile.interests);

  const destinations = normalizeList(
    profile.preferredDestinations
  );

  const sharedInterests = normalizeList(
    currentMatch?.sharedInterests
  );

  const sharedDestinations = normalizeList(
    currentMatch?.sharedDestinations
  );

  const score = currentMatch?.similarityScore;

  const sharedInterestSet = new Set(
    sharedInterests.map(normalizeText)
  );

  const sharedDestinationSet = new Set(
    sharedDestinations.map(normalizeText)
  );

  const remaining = Math.max(
    0,
    matches.length - currentIndex
  );

  /* SOCKET CONNECTION */

  useEffect(() => {
    if (!currentUserId) return;

    const newSocket = io(SOCKET_SERVER_URL, {
      transports: ["websocket"],
    });

    setSocket(newSocket);

    const handleConnect = () => {
      setSocketConnected(true);
      newSocket.emit("joinRoom", currentUserId);
    };

    const handleDisconnect = () => {
      setSocketConnected(false);
    };

    const openConnection = (id, name) => {
      if (!id || String(id) === String(currentUserId)) {
        return;
      }

      const connectedUsers = readStorage("connectedUsers");

      if (
        !connectedUsers.some(
          (item) => String(item._id) === String(id)
        )
      ) {
        connectedUsers.push({
          _id: id,
          name: name || "Traveler",
          profile: {
            name: name || "Traveler",
          },
        });
      }

      localStorage.setItem(
        "connectedUsers",
        JSON.stringify(connectedUsers)
      );

      navigate("/messages", {
        state: {
          connectedUsers,
          currentUserId,
          selectedUser: connectedUsers.find(
            (item) => String(item._id) === String(id)
          ),
        },
      });
    };

    const handleAccepted = ({ senderId, senderName }) => {
      openConnection(senderId, senderName);
    };

    const handleConfirmed = (data) => {
      const id =
        data.receiverId &&
        String(data.receiverId) !== String(currentUserId)
          ? data.receiverId
          : data.senderId;

      const name =
        id === data.receiverId
          ? data.receiverName
          : data.senderName;

      openConnection(id, name);
    };

    newSocket.on("connect", handleConnect);
    newSocket.on("disconnect", handleDisconnect);
    newSocket.on("connectionAccepted", handleAccepted);
    newSocket.on("connectionConfirmed", handleConfirmed);

    return () => {
      newSocket.off("connect", handleConnect);
      newSocket.off("disconnect", handleDisconnect);
      newSocket.off("connectionAccepted", handleAccepted);
      newSocket.off("connectionConfirmed", handleConfirmed);
      newSocket.disconnect();
    };
  }, [currentUserId, navigate]);

  /* FETCH RANKED RECOMMENDATIONS */

  useEffect(() => {
    if (!currentUserId) return;

    const controller = new AbortController();

    const fetchMatches = async () => {
      setLoading(true);
      setError("");
      setProfileIncomplete(false);

      try {
        const token = localStorage.getItem("token");

        const response = await fetch(
          `${API_BASE_URL}/matche`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
            signal: controller.signal,
          }
        );

        const data = await response.json();

        if (data.code === "PROFILE_INCOMPLETE") {
          setProfileIncomplete(true);
          setMatches([]);
          return;
        }

        if (!response.ok) {
          throw new Error(
            data.message ||
              data.error ||
              "Unable to find travelers."
          );
        }

        const matchList = Array.isArray(data)
          ? data
          : data.matches;

        if (!Array.isArray(matchList)) {
          throw new Error("Invalid matching API response.");
        }

        const rankedMatches = matchList
          .filter(
            (match) =>
              match.profile &&
              String(match._id) !== String(currentUserId) &&
              match.role !== "admin"
          )
          .sort(
            (a, b) =>
              (b.similarityScore ?? -1) -
              (a.similarityScore ?? -1)
          );

        setMatches(rankedMatches);

        // Highest compatibility is now index zero.
        setCurrentIndex(0);
      } catch (err) {
        if (err.name !== "AbortError") {
          console.error("Matching error:", err);
          setError(err.message);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    fetchMatches();

    return () => controller.abort();
  }, [currentUserId, refreshKey]);

  /* RESET CARD STATE */

  useEffect(() => {
    setSwipeDirection("");
    setIsSwiping(false);
    setImageFailed(false);
    setShowBreakdown(false);
    setActionMessage("");
    swipeLock.current = false;
  }, [currentIndex, currentMatch?._id, refreshKey]);

  /* SWIPE ACTIONS */

  const handleSwipe = (direction, match) => {
    swipeLock.current = true;
    setIsSwiping(true);
    setSwipeDirection(direction);

    if (direction === "right") {
      const likedUsers = readStorage("likedUsers");

      if (
        !likedUsers.some(
          (item) => String(item._id) === String(match._id)
        )
      ) {
        localStorage.setItem(
          "likedUsers",
          JSON.stringify([...likedUsers, match])
        );
      }
    }
  };

  const handleCardLeftScreen = () => {
    // Move from highest compatibility to lowest.
    setCurrentIndex((previous) => previous + 1);
  };

  const swipe = async (direction) => {
    if (!cardRef.current || swipeLock.current) return;

    swipeLock.current = true;
    setIsSwiping(true);
    setSwipeDirection(direction);

    try {
      await cardRef.current.swipe(direction);
    } catch (err) {
      console.error("Swipe failed:", err);

      swipeLock.current = false;
      setIsSwiping(false);
      setSwipeDirection("");
    }
  };

  /* EXISTING CONNECTION FLOW */

  const handleConnect = (match) => {
    if (swipeLock.current) return;

    if (!socket || !socketConnected || !currentUserId) {
      setActionMessage(
        "Connection unavailable. Please try again."
      );
      return;
    }

    socket.emit("connectionRequest", {
      senderId: currentUserId,
      receiverId: match._id,
      user: {
        _id: currentUserId,
        name: user?.name || "Traveler",
      },
    });

    setActionMessage(
      "Connection requested. You can keep discovering travelers."
    );
  };

  const restartDiscovery = () => {
    setRefreshKey((previous) => previous + 1);
  };

  const breakdown = currentMatch?.breakdown;

  const breakdownItems = [
    {
      name: "Destinations",
      value: breakdown?.destinations,
      weight: 40,
    },
    {
      name: "Interests",
      value: breakdown?.interests,
      weight: 35,
    },
    {
      name: "Travel style",
      value: breakdown?.travelStyle,
      weight: 20,
    },
    {
      name: "Location",
      value: breakdown?.location,
      weight: 5,
    },
  ];

  return (
    <AppShell className="matching-page-container">
      <div className="matching-page-inner">

        {/* PAGE HEADER */}

        <header className="discovery-header">
          <span className="discovery-eyebrow">
            YOUR NEXT ADVENTURE
          </span>

          <h1>Find your travel mate.</h1>

          <p>
            Discover people who share your sense of adventure.
          </p>
        </header>

        {/* LOADING */}

        {loading ? (
          <div className="matching-state">
            <div className="matching-spinner" />

            <h2>Finding your travel mates</h2>

            <p>
              Comparing your interests and dream destinations...
            </p>
          </div>

        ) : profileIncomplete ? (

          /* INCOMPLETE PROFILE */

          <div className="matching-state">
            <div className="matching-empty-icon">
              <FaUserAlt />
            </div>

            <h2>Let's get to know you first.</h2>

            <p>
              Complete your travel profile so we can find
              people who share your interests and destinations.
            </p>

            <Link
              to="/profile-setup"
              className="match-connect-button"
            >
              Complete my profile
              <FaArrowRight />
            </Link>
          </div>

        ) : error ? (

          /* ERROR */

          <div className="matching-state">
            <FaCompass />

            <h2>Something went wrong</h2>

            <p>{error}</p>

            <button
              className="match-connect-button"
              onClick={restartDiscovery}
            >
              Try again
            </button>
          </div>

        ) : currentMatch ? (

          <div className="matching-main-stack">

            {/* RANKING INFORMATION */}

            <div className="match-discovery-toolbar">
              <div className="match-ranked-label">
                <FaStar />
                Best matches first
              </div>

              <span>
                {currentIndex + 1} of {matches.length}
              </span>
            </div>

            {/* DISCOVERY CARD */}

            <div className="tinder-cards-container">
              <TinderCard
                key={currentMatch._id}
                ref={cardRef}
                className="matching-swipe"
                preventSwipe={["up", "down"]}
                onSwipe={(direction) =>
                  handleSwipe(direction, currentMatch)
                }
                onCardLeftScreen={handleCardLeftScreen}
                onSwipeRequirementFulfilled={setSwipeDirection}
                onSwipeRequirementUnfulfilled={() => {
                  if (!swipeLock.current) {
                    setSwipeDirection("");
                  }
                }}
              >
                <article className="match-card-simple">

                  {/* PROFILE PHOTO */}

                  <div className="match-image-container">
                    {profile.profilePicture && !imageFailed ? (
                      <img
                        src={getImageUrl(profile.profilePicture)}
                        alt={profile.name || "Traveler"}
                        className="match-profile-image"
                        onError={() => setImageFailed(true)}
                        draggable={false}
                      />
                    ) : (
                      <div className="match-default-avatar">
                        <FaUserAlt />
                      </div>
                    )}

                    {currentIndex === 0 && score >= 75 && (
                      <div className="match-top-label">
                        <FaStar />
                        Top recommendation
                      </div>
                    )}

                    <div
                      className={`swipe-feedback nope ${
                        swipeDirection === "left"
                          ? "visible"
                          : ""
                      }`}
                    >
                      <FaTimes /> Pass
                    </div>

                    <div
                      className={`swipe-feedback like ${
                        swipeDirection === "right"
                          ? "visible"
                          : ""
                      }`}
                    >
                      <FaHeart /> Like
                    </div>
                  </div>

                  {/* PROFILE BODY */}

                  <div className="match-card-body">

                    <div className="match-identity-row">
                      <div className="match-identity">
                        <h2 className="match-name">
                          {profile.name || "Traveler"}
                        </h2>

                        <div className="match-location">
                          <FaMapMarkerAlt />

                          <span>
                            {profile.location ||
                              "Location not specified"}
                          </span>
                        </div>

                        <span className="match-compatibility-label">
                          {currentMatch.matchLabel ||
                            "Travel compatibility"}
                        </span>
                      </div>

                      <CompatibilityRing score={score} />
                    </div>

                    {profile.bio && (
                      <p className="match-bio">
                        {profile.bio}
                      </p>
                    )}

                    {/* MATCH EXPLANATION */}

                    <section className="match-why-section">
                      <h3>
                        <FaStar />
                        Why you match
                      </h3>

                      {sharedInterests.length > 0 && (
                        <div className="match-reason">
                          <FaCheckCircle />

                          <span>
                            {sharedInterests.length} shared{" "}
                            {sharedInterests.length === 1
                              ? "interest"
                              : "interests"}
                          </span>
                        </div>
                      )}

                      {sharedDestinations.length > 0 && (
                        <div className="match-reason">
                          <FaCheckCircle />

                          <span>
                            {sharedDestinations.length}{" "}
                            {sharedDestinations.length === 1
                              ? "destination"
                              : "destinations"}{" "}
                            in common
                          </span>
                        </div>
                      )}

                      {currentMatch.sameTravelStyle && (
                        <div className="match-reason">
                          <FaCheckCircle />
                          <span>Same travel style</span>
                        </div>
                      )}

                      {!currentMatch.sameTravelStyle &&
                        breakdown?.travelStyle === 75 && (
                          <div className="match-reason">
                            <FaCheckCircle />
                            <span>Compatible travel styles</span>
                          </div>
                        )}

                      {currentMatch.sameLocation && (
                        <div className="match-reason">
                          <FaCheckCircle />
                          <span>Same location</span>
                        </div>
                      )}

                      {!sharedInterests.length &&
                        !sharedDestinations.length &&
                        !breakdown?.travelStyle &&
                        !currentMatch.sameLocation && (
                          <p className="match-empty-text">
                            Different preferences can still
                            lead to new adventures.
                          </p>
                        )}

                      {breakdown && (
                        <>
                          <button
                            type="button"
                            className="match-breakdown-toggle pressable"
                            aria-expanded={showBreakdown}
                            onClick={() =>
                              setShowBreakdown((previous) => !previous)
                            }
                          >
                            {showBreakdown
                              ? "Hide compatibility details"
                              : "How is this score calculated?"}
                          </button>

                          {showBreakdown && (
                            <div className="match-breakdown">
                              {breakdownItems.map((item) => (
                                <div
                                  className="match-breakdown-item"
                                  key={item.name}
                                >
                                  <div className="match-breakdown-label">
                                    <span>{item.name}</span>
                                    <strong>
                                      {item.value ?? 0}%
                                    </strong>
                                  </div>

                                  <div className="match-breakdown-track">
                                    <div
                                      style={{
                                        width: `${Math.max(
                                          0,
                                          Math.min(100, item.value ?? 0)
                                        )}%`,
                                      }}
                                    />
                                  </div>

                                  <small>
                                    {item.weight}% of overall score
                                  </small>
                                </div>
                              ))}

                              <p>
                                This score compares profile
                                preferences, not personal chemistry.
                              </p>
                            </div>
                          )}
                        </>
                      )}
                    </section>

                    {/* INTERESTS */}

                    <section className="match-interests-section">
                      <h3>Interests</h3>

                      <div className="match-interest-tags">
                        {interests.map((interest, index) => {
                          const isShared = sharedInterestSet.has(
                            normalizeText(interest)
                          );

                          return (
                            <span
                              key={`${interest}-${index}`}
                              className={`match-interest-tag ${
                                isShared ? "match-tag-shared" : ""
                              }`}
                            >
                              {isShared && <FaCheckCircle />}
                              {interest}
                            </span>
                          );
                        })}
                      </div>
                    </section>

                    {/* DESTINATIONS */}

                    <section className="match-destination-section">
                      <h3>
                        <FaGlobeAmericas />
                        Dream destinations
                      </h3>

                      <div className="match-interest-tags">
                        {destinations.map((destination, index) => {
                          const isShared =
                            sharedDestinationSet.has(
                              normalizeText(destination)
                            );

                          return (
                            <span
                              key={`${destination}-${index}`}
                              className={`match-interest-tag ${
                                isShared ? "match-tag-shared" : ""
                              }`}
                            >
                              {isShared && <FaCheckCircle />}
                              {destination}
                            </span>
                          );
                        })}
                      </div>
                    </section>

                    {/* TRAVEL STYLE */}

                    {profile.travelStyle && (
                      <div className="match-travel-style">
                        <FaCompass />

                        <div>
                          <span className="match-detail-label">
                            Travel style
                          </span>

                          <p>{profile.travelStyle}</p>
                        </div>

                        {currentMatch.sameTravelStyle && (
                          <span className="match-same-style">
                            <FaCheckCircle />
                            Same as you
                          </span>
                        )}
                      </div>
                    )}

                    {/* PROFILE ACTIONS */}

                    <div className="match-card-actions">
                      <button
                        type="button"
                        className="match-connect-button pressable"
                        disabled={
                          isSwiping ||
                          !socketConnected ||
                          actionMessage.startsWith(
                            "Connection requested"
                          )
                        }
                        onClick={() => handleConnect(currentMatch)}
                      >
                        <FaUserPlus />

                        {actionMessage.startsWith(
                          "Connection requested"
                        )
                          ? "Request sent"
                          : "Connect"}
                      </button>

                      {actionMessage && (
                        <p
                          className="match-action-message"
                          role="status"
                        >
                          {actionMessage}
                        </p>
                      )}

                      <Link
                        to={`/user-profile/${currentMatch._id}`}
                        className="profile-link-simple pressable"
                      >
                        View full profile
                        <FaArrowRight />
                      </Link>
                    </div>

                  </div>
                </article>
              </TinderCard>
            </div>

            {/* PASS AND LIKE BUTTONS */}

            <div className="card-swipe-actions">
              <div className="swipe-action-group">
                <button
                  type="button"
                  className="swipe-action-btn swipe-no"
                  aria-label="Pass on traveler"
                  disabled={isSwiping}
                  onClick={() => swipe("left")}
                >
                  <FaTimes />
                </button>

                <span>Pass</span>
              </div>

              <div className="swipe-action-group">
                <button
                  type="button"
                  className="swipe-action-btn swipe-yes"
                  aria-label="Like traveler"
                  disabled={isSwiping}
                  onClick={() => swipe("right")}
                >
                  <FaHeart />
                </button>

                <span>Like</span>
              </div>
            </div>

            <p className="matching-remaining">
              {remaining}{" "}
              {remaining === 1 ? "traveler" : "travelers"} remaining
            </p>
          </div>

        ) : (

          /* EMPTY STATE */

          <div className="matching-state">
            <div className="matching-empty-icon">
              <FaCompass />
            </div>

            <h2>
              {matches.length
                ? "You're all caught up!"
                : "Your next adventure awaits."}
            </h2>

            <p>
              {matches.length
                ? "You've explored all your current recommendations."
                : "We couldn't find any eligible travelers right now."}
            </p>

            <button
              className="match-connect-button"
              onClick={restartDiscovery}
            >
              <FaRedo />
              Refresh recommendations
            </button>

            <Link
              to="/profile-setup"
              className="profile-link-simple"
            >
              Update my travel preferences
            </Link>

            <Link
              to="/explore-events"
              className="profile-link-simple"
            >
              Explore events instead
            </Link>
          </div>
        )}
      </div>
    </AppShell>
  );
}

export default MatchingPage;
