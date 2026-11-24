
import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  FaArrowLeft,
  FaUserAlt,
  FaMapMarkerAlt,
  FaCalendarAlt,
  FaHeart,
  FaGlobeAmericas,
  FaUserPlus,
  FaFlag,
  FaTimes,
  FaSuitcase,
} from "react-icons/fa";

import "../styles/UserProfile.css";
import AppShell from "../components/AppShell";
import API_BASE_URL from "../config/api";

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

  const handleConnect = () => {
    if (!userDetails) return;

    const connectedUsers =
      JSON.parse(localStorage.getItem("connectedUsers")) || [];

    const isAlreadyConnected = connectedUsers.some(
      (user) => user._id === userDetails._id
    );

    if (!isAlreadyConnected) {
      connectedUsers.push(userDetails);

      localStorage.setItem(
        "connectedUsers",
        JSON.stringify(connectedUsers)
      );
    }

    navigate("/messages", {
      state: {
        selectedUser: userDetails,
        connectedUsers,
      },
    });
  };

  const profile = userDetails?.profile || {};

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

              <div className="public-profile-cover">
                <FaGlobeAmericas className="public-cover-globe" />
              </div>

              {/* PROFILE HEADER */}

              <div className="public-profile-header">
                <div className="public-avatar-wrapper">
                  <img
                    src={
                      profile.profilePicture ||
                      defaultProfilePicture
                    }
                    alt={profile.name || "Traveler"}
                    className="public-profile-avatar"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = defaultProfilePicture;
                    }}
                  />
                </div>

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

                <button
                  type="button"
                  className="public-connect-button"
                  onClick={handleConnect}
                >
                  <FaUserPlus />
                  Connect
                </button>
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
    </AppShell>
  );
}

export default UserProfile;
