import React, { useState, useEffect, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FaMapMarkedAlt,
  FaCalendarAlt,
  FaHeart,
  FaGlobeAmericas,
  FaEnvelope,
  FaPen,
  FaSignOutAlt,
  FaUserAlt,
} from "react-icons/fa";

import "../styles/ProfilePage.css";
import AppShell from "../components/AppShell";
import API_BASE_URL from "../config/api";
import { AuthContext } from "../context/AuthContext";

function ProfilePage() {
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState("");

  const navigate = useNavigate();
  const { logout } = useContext(AuthContext);

  useEffect(() => {
    const fetchProfile = async () => {
      const token = localStorage.getItem("token");

      if (!token) {
        setError("You must be logged in to view the profile.");
        return;
      }

      try {
        const response = await fetch(`${API_BASE_URL}/profile/`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await response.json();

        if (!response.ok) {
          setError(data.message || "Failed to fetch profile.");
          return;
        }

        setProfile(data);
      } catch (err) {
        console.error(err);
        setError("An error occurred while fetching the profile.");
      }
    };

    fetchProfile();
  }, []);

  const handleLogout = async () => {
    if (typeof logout !== "function") {
      setError("Logout is not configured in AuthContext.");
      return;
    }

    try {
      await logout();

      localStorage.removeItem("token");
      localStorage.removeItem("user");
      localStorage.removeItem("connectedUsers");
      localStorage.removeItem("likedUsers");

      navigate("/", { replace: true });
    } catch (err) {
      console.error(err);
      setError("Unable to log out. Please try again.");
    }
  };

  const interests = Array.isArray(profile?.interests)
    ? profile.interests
    : typeof profile?.interests === "string"
    ? profile.interests
        .split(",")
        .map((interest) => interest.trim())
        .filter(Boolean)
    : [];

  return (
    <AppShell className="profilePage-container">
      <div className="app-page profile-page-inner">

        {!profile ? (
          <p className={error ? "error-message" : "profile-loading-text"}>
            {error || "Loading your profile..."}
          </p>
        ) : (
          <div className="profilePage-card">

            {/* PROFILE HEADER */}

            <div className="profilePage-header">
              <h1 className="profilePage-title">My Profile</h1>

              <div className="profilePage-image-container">
                {profile.profilePicture ? (
                  <img
                    src={profile.profilePicture}
                    alt="Profile"
                    className="profilePage-image"
                    onError={() =>
                      setProfile((previous) => ({
                        ...previous,
                        profilePicture: null,
                      }))
                    }
                  />
                ) : (
                  <FaUserAlt className="profilePage-default-avatar" />
                )}
              </div>

              <h2 className="profilePage-name">
                {profile.name || "Anonymous"}
              </h2>

              <div className="profilePage-location">
                <FaMapMarkedAlt />
                <span>
                  {profile.location || "Location not specified"}
                </span>
              </div>
            </div>

            {/* PERSONAL INFORMATION */}

            <div className="profilePage-info">
              <h3 className="profilePage-section-title">
                Personal Information
              </h3>

              <div className="profilePage-details">

                {/* EMAIL */}

                <div className="profilePage-detail">
                  <FaEnvelope className="profilePage-icon" />

                  <div className="profilePage-detail-content">
                    <span className="profilePage-label">Email</span>
                    <p>{profile.email || "Not provided"}</p>
                  </div>
                </div>

                {/* BIO */}

                <div className="profilePage-detail">
                  <FaHeart className="profilePage-icon" />

                  <div className="profilePage-detail-content">
                    <span className="profilePage-label">Bio</span>
                    <p>{profile.bio || "No bio added yet."}</p>
                  </div>
                </div>

                {/* INTERESTS */}

                <div className="profilePage-detail">
                  <FaGlobeAmericas className="profilePage-icon" />

                  <div className="profilePage-detail-content">
                    <span className="profilePage-label">
                      Interests
                    </span>

                    {interests.length > 0 ? (
                      <div className="profilePage-interests">
                        {interests.map((interest, index) => (
                          <span
                            key={index}
                            className="profilePage-interest-tag"
                          >
                            {interest}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p>No interests added yet.</p>
                    )}
                  </div>
                </div>

                {/* TRAVEL DATES */}

                <div className="profilePage-detail">
                  <FaCalendarAlt className="profilePage-icon" />

                  <div className="profilePage-detail-content">
                    <span className="profilePage-label">
                      Travel Dates
                    </span>

                    <p>
                      {profile.travelDates?.start &&
                      profile.travelDates?.end
                        ? `${new Date(
                            profile.travelDates.start
                          ).toLocaleDateString()} - ${new Date(
                            profile.travelDates.end
                          ).toLocaleDateString()}`
                        : "No travel dates specified"}
                    </p>
                  </div>
                </div>

              </div>
            </div>

            {/* PROFILE ACTIONS */}

            <div className="profilePage-actions">
              <Link
                to="/profile-setup"
                className="profile-edit-button"
              >
                <FaPen />
                Edit Profile
              </Link>

              <button
                type="button"
                className="profile-logout-button"
                onClick={handleLogout}
              >
                <FaSignOutAlt />
                Log Out
              </button>
            </div>

            {error && (
              <p className="error-message">{error}</p>
            )}

          </div>
        )}
      </div>
    </AppShell>
  );
}

export default ProfilePage;