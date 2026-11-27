
import React, {
  useEffect,
  useState,
  useContext,
} from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  FaArrowLeft,
  FaUserAlt,
  FaMapMarkerAlt,
  FaCalendarAlt,
  FaHeart,
  FaGlobeAmericas,
  FaChevronLeft,
FaChevronRight,
FaComment,
FaCheckCircle,
FaExpand,
  FaFlag,
  FaTimes,
  FaSuitcase,
} from "react-icons/fa";

import "../styles/UserProfile.css";
import AppShell from "../components/AppShell";
import API_BASE_URL from "../config/api";
import { AuthContext } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";
import TripMatchModal from "../components/TripMatchModal";

const defaultProfilePicture =
  "https://i.postimg.cc/rwk4Qqd6/avatar-account-flat-isolated-on-transparent-background-for-graphic-and-web-design-default-social-med.jpg";

const reportReasons = [
  "Inappropriate behavior",
  "Spam",
  "Harassment",
];

const normalizeList = (value) => {
  if (Array.isArray(value)) {
    return value.filter(Boolean);
  }

  if (typeof value === "string") {
    return value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
};

function UserProfile() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
const { refreshCounts } = useSocket();

const currentUserId = user?.id || user?._id;

const isOwnProfile =
  String(currentUserId) === String(userId);

const [relationship, setRelationship] =
  useState("loading");

const [swipeSubmitting, setSwipeSubmitting] =
  useState(false);

const [relationshipError, setRelationshipError] =
  useState("");

const [matchedUser, setMatchedUser] =
  useState(null);

const [photoIndex, setPhotoIndex] = useState(0);

const [galleryOpen, setGalleryOpen] =
  useState(false);

  const [userDetails, setUserDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedReasons, setSelectedReasons] = useState([]);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportSubmitting, setReportSubmitting] = useState(false);
  const [reportError, setReportError] = useState("");

  useEffect(() => {
    const fetchUserDetails = async () => {
      setLoading(true);
      setError("");

      try {
        const token = localStorage.getItem("token");

        const response = await fetch(
          `${API_BASE_URL}/matche/users/${userId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error("Failed to fetch user details.");
        }

        const data = await response.json();
        setUserDetails(data);
      } catch (err) {
        console.error(err);
        setError(
          "Failed to fetch user details. Please try again later."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchUserDetails();
  }, [userId]);

  const openReportModal = () => {
    setReportError("");
    setIsReportModalOpen(true);
  };

  const closeReportModal = () => {
    if (reportSubmitting) return;

    setIsReportModalOpen(false);
    setSelectedReasons([]);
    setReportError("");
  };

  useEffect(() => {
    if (!isReportModalOpen) return;

    const handleEscape = (event) => {
      if (event.key === "Escape" && !reportSubmitting) {
        setIsReportModalOpen(false);
        setSelectedReasons([]);
        setReportError("");
      }
    };

    window.addEventListener("keydown", handleEscape);

    return () => {
      window.removeEventListener("keydown", handleEscape);
    };
  }, [isReportModalOpen, reportSubmitting]);

  const handleCheckboxChange = (e) => {
    const { value, checked } = e.target;

    setReportError("");

    setSelectedReasons((prev) =>
      checked
        ? [...prev, value]
        : prev.filter((reason) => reason !== value)
    );
  };

  const handleReportSubmit = async () => {
    if (selectedReasons.length === 0) {
      setReportError("Please select at least one reason.");
      return;
    }

    setReportSubmitting(true);
    setReportError("");

    try {
      const token = localStorage.getItem("token");

      const response = await fetch(
        `${API_BASE_URL}/reports/report`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            reportedUserId: userDetails._id,
            reason: selectedReasons.join(", "),
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to report user.");
      }

      setIsReportModalOpen(false);
      setSelectedReasons([]);

      alert("Your report has been submitted successfully.");
    } catch (err) {
      console.error(err);
      setReportError(
        "Unable to submit your report. Please try again."
      );
    } finally {
      setReportSubmitting(false);
    }
  };
useEffect(() => {
  if (!currentUserId || !userId) return;

  const controller = new AbortController();

  setRelationship("loading");
  setRelationshipError("");
  setPhotoIndex(0);
  setGalleryOpen(false);

  const checkRelationship = async () => {
    if (isOwnProfile) {
      setRelationship("own");
      return;
    }

    try {
      const headers = {
        Authorization:
          `Bearer ${localStorage.getItem("token")}`,
      };

      const [connectionsResponse, historyResponse] =
        await Promise.all([
          fetch(`${API_BASE_URL}/message/connections`, {
            headers,
            signal: controller.signal,
          }),

          fetch(`${API_BASE_URL}/swipes/history`, {
            headers,
            signal: controller.signal,
          }),
        ]);

      if (
        !connectionsResponse.ok ||
        !historyResponse.ok
      ) {
        throw new Error(
          "Unable to check connection status."
        );
      }

      const connections =
        await connectionsResponse.json();

      const history =
        await historyResponse.json();

      if (controller.signal.aborted) return;

      const connected = connections.some(
        item => String(item._id) === String(userId)
      );

      if (connected) {
        setRelationship("connected");
        return;
      }

      const previousSwipe = history.swipes?.find(
        item =>
          String(item.targetUserId) === String(userId)
      );

      if (previousSwipe?.action === "like") {
        setRelationship("liked");
      } else if (previousSwipe?.action === "pass") {
        setRelationship("passed");
      } else {
        setRelationship("none");
      }

    } catch (error) {
      if (error.name === "AbortError") return;

      setRelationship("error");
      setRelationshipError(error.message);
    }
  };

  checkRelationship();

  return () => controller.abort();

}, [userId, currentUserId, isOwnProfile]);

const handleProfileSwipe = async (action) => {
  if (
    swipeSubmitting ||
    relationship !== "none" ||
    !userDetails ||
    isOwnProfile
  ) {
    return;
  }

  setSwipeSubmitting(true);
  setRelationshipError("");

  try {
    const response = await fetch(
      `${API_BASE_URL}/swipes`,
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
          Authorization:
            `Bearer ${localStorage.getItem("token")}`,
        },

        body: JSON.stringify({
          targetUserId: userId,
          action,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.message || "Unable to save your decision."
      );
    }

    if (data.isMatched) {
      setRelationship("connected");
      setMatchedUser(data.user || userDetails);
      refreshCounts();
    } else {
      setRelationship(
        action === "like" ? "liked" : "passed"
      );

      navigate("/matching");
    }

  } catch (error) {
    setRelationshipError(error.message);
  } finally {
    setSwipeSubmitting(false);
  }
};

const handleMessage = () => {
  if (
    relationship !== "connected" ||
    !userDetails
  ) {
    return;
  }

  setMatchedUser(null);

  navigate("/messages", {
    state: {
      selectedUser: userDetails,
    },
  });
};

  const profile = userDetails?.profile || {};
const getImageUrl = (value) => {
  if (!value) return defaultProfilePicture;

  if (value.startsWith("/uploads/")) {
    return `${
      API_BASE_URL.replace(/\/api\/?$/, "")
    }${value}`;
  }

  return value;
};

const photos = [...new Set([
  profile.profilePicture,

  ...(Array.isArray(profile.profilePictures)
    ? profile.profilePictures
    : []),

].filter(photo =>
  typeof photo === "string" && photo.trim()
))].slice(0, 6);

const activePhotoIndex = Math.min(
  photoIndex,
  Math.max(0, photos.length - 1)
);

const activePhoto = photos[activePhotoIndex];

const changePhoto = (direction) => {
  if (photos.length <= 1) return;

  setPhotoIndex(previous =>
    (previous + direction + photos.length) %
    photos.length
  );
};
  const interests = normalizeList(profile.interests);

  const destinations = normalizeList(
    profile.preferredDestinations
  );

  const travelDates =
    profile.travelDates?.start && profile.travelDates?.end
      ? `${new Date(
          profile.travelDates.start
        ).toLocaleDateString()} – ${new Date(
          profile.travelDates.end
        ).toLocaleDateString()}`
      : "No upcoming travel dates added yet.";


        useEffect(() => {
  if (!galleryOpen) return;

  const previousOverflow =
    document.body.style.overflow;

  document.body.style.overflow = "hidden";

  const handleKeyDown = (event) => {
    if (event.key === "Escape") {
      setGalleryOpen(false);
    }

    if (
      event.key === "ArrowRight" &&
      photos.length > 1
    ) {
      setPhotoIndex(previous =>
        (previous + 1) % photos.length
      );
    }

    if (
      event.key === "ArrowLeft" &&
      photos.length > 1
    ) {
      setPhotoIndex(previous =>
        (previous - 1 + photos.length) %
        photos.length
      );
    }
  };

  window.addEventListener("keydown", handleKeyDown);

  return () => {
    document.body.style.overflow =
      previousOverflow;

    window.removeEventListener(
      "keydown",
      handleKeyDown
    );
  };
}, [galleryOpen, photos.length]);

  return (
    <AppShell className="public-profile-page">
      <div className="public-profile-inner">

        {/* BACK BUTTON */}

        <Link
          to="/matching"
          className="public-profile-back"
        >
          <FaArrowLeft />
          <span>Back to Matching</span>
        </Link>

        {loading ? (
          <p className="public-profile-status">
            Loading traveler profile...
          </p>
        ) : error ? (
          <p className="public-profile-status public-profile-error">
            {error}
          </p>
        ) : (
          <>
            <article className="public-profile-card">

              {/* COVER */}

              <div className="public-photo-gallery">

  <button
    type="button"
    className="public-main-photo"
    onClick={() => setGalleryOpen(true)}
    disabled={!photos.length}
    aria-label="Open full-screen photo gallery"
  >
    <img
      src={getImageUrl(activePhoto)}
      alt={`${profile.name || "Traveler"} — photo ${
        activePhotoIndex + 1
      }`}
      onError={event => {
        event.currentTarget.onerror = null;
        event.currentTarget.src = defaultProfilePicture;
      }}
    />

    {photos.length > 0 && (
      <span className="public-expand-photo">
        <FaExpand />
      </span>
    )}
  </button>

  {photos.length > 1 && (
    <>
      <button
        type="button"
        className="public-gallery-arrow previous"
        onClick={() => changePhoto(-1)}
        aria-label="Previous photo"
      >
        <FaChevronLeft />
      </button>

      <button
        type="button"
        className="public-gallery-arrow next"
        onClick={() => changePhoto(1)}
        aria-label="Next photo"
      >
        <FaChevronRight />
      </button>

      <span className="public-gallery-counter">
        {activePhotoIndex + 1} / {photos.length}
      </span>
    </>
  )}

</div>

{photos.length > 1 && (
  <div className="public-photo-thumbnails">
    {photos.map((photo, index) => (
      <button
        type="button"
        key={photo}
        className={`public-photo-thumbnail ${
          index === activePhotoIndex ? "active" : ""
        }`}
        onClick={() => setPhotoIndex(index)}
        aria-label={`View photo ${index + 1}`}
        aria-pressed={index === activePhotoIndex}
      >
        <img
          src={getImageUrl(photo)}
          alt={`Profile photo ${index + 1}`}
        />
      </button>
    ))}
  </div>
)}

              {/* PROFILE HEADER */}

              <div className="public-profile-header">
                

                <h1 className="public-profile-name">
                  {profile.name || "Anonymous Traveler"}
                </h1>

                <div className="public-profile-location">
                  <FaMapMarkerAlt />
                  <span>
                    {profile.location || "Location not specified"}
                  </span>
                </div>

                {profile.travelStyle && (
                  <div className="public-travel-style">
                    <FaSuitcase />
                    {profile.travelStyle}
                  </div>
                )}

                <div className="public-relationship-actions">

  {relationship === "loading" && (
    <p>Checking connection status...</p>
  )}

  {relationship === "none" && (
    <div className="public-swipe-actions">
      <button
        type="button"
        className="public-pass-button"
        disabled={swipeSubmitting}
        onClick={() => handleProfileSwipe("pass")}
      >
        <FaTimes />
        Pass
      </button>

      <button
        type="button"
        className="public-like-button"
        disabled={swipeSubmitting}
        onClick={() => handleProfileSwipe("like")}
      >
        <FaHeart />
        Like
      </button>
    </div>
  )}

  {relationship === "liked" && (
    <div className="public-relationship-status">
      <FaHeart />
      Liked — waiting for a mutual match
    </div>
  )}

  {relationship === "passed" && (
    <div className="public-relationship-status">
      You passed on this traveler
    </div>
  )}

  {relationship === "connected" && (
    <button
      type="button"
      className="public-connect-button"
      onClick={handleMessage}
    >
      <FaComment />
      Send message
    </button>
  )}

  {relationship === "own" && (
    <Link
      to="/profile-setup"
      className="public-connect-button"
    >
      Edit profile
    </Link>
  )}

  {relationshipError && (
    <p className="public-profile-error">
      {relationshipError}
    </p>
  )}

</div>
              </div>

              {/* PROFILE INFORMATION */}

              <div className="public-profile-body">

                {/* ABOUT */}

                <section className="public-profile-section">
                  <h2>
                    <FaUserAlt />
                    About me
                  </h2>

                  <p>
                    {profile.bio || "No bio added yet."}
                  </p>
                </section>

                {/* INTERESTS */}

                <section className="public-profile-section">
                  <h2>
                    <FaHeart />
                    Travel interests
                  </h2>

                  {interests.length > 0 ? (
                    <div className="public-profile-tags">
                      {interests.map((interest, index) => (
                        <span
                          className="public-profile-tag"
                          key={`${interest}-${index}`}
                        >
                          {interest}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p>No interests added yet.</p>
                  )}
                </section>

                {/* DESTINATIONS */}

                <section className="public-profile-section">
                  <h2>
                    <FaGlobeAmericas />
                    Preferred destinations
                  </h2>

                  {destinations.length > 0 ? (
                    <div className="public-profile-tags">
                      {destinations.map((destination, index) => (
                        <span
                          className="public-profile-tag"
                          key={`${destination}-${index}`}
                        >
                          {destination}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p>No destinations specified yet.</p>
                  )}
                </section>

                {/* TRAVEL DATES */}

                <section className="public-profile-section">
                  <h2>
                    <FaCalendarAlt />
                    Upcoming travel plans
                  </h2>

                  <div className="public-travel-dates">
                    <FaCalendarAlt />
                    <span>{travelDates}</span>
                  </div>
                </section>

              </div>
            </article>

            {/* REPORT BUTTON */}

            <button
              type="button"
              className="public-report-button"
              onClick={openReportModal}
            >
              <FaFlag />
              Report this profile
            </button>

            {/* REPORT MODAL */}

            {isReportModalOpen && (
              <div
                className="public-report-overlay"
                onClick={closeReportModal}
              >
                <div
                  className="public-report-modal"
                  role="dialog"
                  aria-modal="true"
                  aria-labelledby="public-report-title"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    type="button"
                    className="public-report-close"
                    onClick={closeReportModal}
                    aria-label="Close report dialog"
                    disabled={reportSubmitting}
                  >
                    <FaTimes />
                  </button>

                  <div className="public-report-icon">
                    <FaFlag />
                  </div>

                  <h2 id="public-report-title">
                    Report profile
                  </h2>

                  <p className="public-report-description">
                    Help us keep TripMate a safe and welcoming
                    community. Select the reason for your report.
                  </p>

                  <div className="public-report-options">
                    {reportReasons.map((reason) => (
                      <label
                        key={reason}
                        className={`public-report-option ${
                          selectedReasons.includes(reason)
                            ? "selected"
                            : ""
                        }`}
                      >
                        <input
                          type="checkbox"
                          value={reason}
                          checked={selectedReasons.includes(reason)}
                          onChange={handleCheckboxChange}
                          disabled={reportSubmitting}
                        />

                        <span>{reason}</span>
                      </label>
                    ))}
                  </div>

                  {reportError && (
                    <p
                      className="public-report-error"
                      role="alert"
                    >
                      {reportError}
                    </p>
                  )}

                  <div className="public-report-actions">
                    <button
                      type="button"
                      className="public-report-cancel"
                      onClick={closeReportModal}
                      disabled={reportSubmitting}
                    >
                      Cancel
                    </button>

                    <button
                      type="button"
                      className="public-report-submit"
                      onClick={handleReportSubmit}
                      disabled={reportSubmitting}
                    >
                      {reportSubmitting
                        ? "Submitting..."
                        : "Submit Report"}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
      {galleryOpen && photos.length > 0 && (
  <div
    className="public-lightbox"
    role="dialog"
    aria-modal="true"
    aria-label="Profile photo gallery"
    onClick={() => setGalleryOpen(false)}
  >
    <button
      type="button"
      className="public-lightbox-close"
      onClick={() => setGalleryOpen(false)}
      aria-label="Close photo gallery"
      autoFocus
    >
      <FaTimes />
    </button>

    <img
      src={getImageUrl(activePhoto)}
      alt={`Profile photo ${activePhotoIndex + 1}`}
      onClick={event => event.stopPropagation()}
    />

    {photos.length > 1 && (
      <>
        <button
          type="button"
          className="public-lightbox-arrow previous"
          onClick={event => {
            event.stopPropagation();
            changePhoto(-1);
          }}
          aria-label="Previous photo"
        >
          <FaChevronLeft />
        </button>

        <button
          type="button"
          className="public-lightbox-arrow next"
          onClick={event => {
            event.stopPropagation();
            changePhoto(1);
          }}
          aria-label="Next photo"
        >
          <FaChevronRight />
        </button>
      </>
    )}

    <span className="public-lightbox-counter">
      {activePhotoIndex + 1} / {photos.length}
    </span>
  </div>
)}

<TripMatchModal
  currentUser={user}
  matchedUser={matchedUser}
  onClose={() => setMatchedUser(null)}
  onMessage={handleMessage}
/>
    </AppShell>
  );
}

export default UserProfile;
