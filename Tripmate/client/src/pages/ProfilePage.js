import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  FaUserAlt,
  FaMapMarkedAlt,
  FaCalendarAlt,
  FaHeart,
  FaGlobeAmericas,
  FaEnvelope,
} from "react-icons/fa";

import "../styles/ProfilePage.css";
import AppShell from "../components/AppShell";
import API_BASE_URL from "../config/api";

function ProfilePage() {
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState("");
  const defaultProfilePicture =
    "https://i.postimg.cc/rwk4Qqd6/avatar-account-flat-isolated-on-transparent-background-for-graphic-and-web-design-default-social-med.jpg";

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

  return (
    <AppShell className="profilePage-container">
      <div className="app-page profile-page-inner">
        {error ? (
          <p className="error-message">{error}</p>
        ) : !profile ? (
          <p className="profile-loading-text">Loading...</p>
        ) : (
          <div className="profilePage-card">
            <div className="profilePage-image-container">
              <img
                src={profile.profilePicture || defaultProfilePicture}
                alt="Profile"
                className="profilePage-image"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = defaultProfilePicture;
                }}
              />
            </div>

            <div className="profilePage-info">
              <div className="profilePage-details">
                <div className="profilePage-detail">
                  <FaUserAlt className="profilePage-icon" />
                  <p>
                    <strong>Name:</strong> {profile.name || "Not provided"}
                  </p>
                </div>

                <div className="profilePage-detail">
                  <FaEnvelope className="profilePage-icon" />
                  <p>
                    <strong>Email:</strong> {profile.email || "Not provided"}
                  </p>
                </div>

                <div className="profilePage-detail">
                  <FaHeart className="profilePage-icon" />
                  <p>
                    <strong>Bio:</strong> {profile.bio || "No bio added yet."}
                  </p>
                </div>

                <div className="profilePage-detail">
                  <FaGlobeAmericas className="profilePage-icon" />
                  <p>
                    <strong>Interests:</strong>{" "}
                    {profile.interests?.length
                      ? profile.interests.join(", ")
                      : "No interests added yet."}
                  </p>
                </div>

                <div className="profilePage-detail">
                  <FaMapMarkedAlt className="profilePage-icon" />
                  <p>
                    <strong>Location:</strong>{" "}
                    {profile.location || "Not provided"}
                  </p>
                </div>

                <div className="profilePage-detail">
                  <FaCalendarAlt className="profilePage-icon" />
                  <p>
                    <strong>Travel Dates:</strong>{" "}
                    {profile.travelDates?.start && profile.travelDates?.end
                      ? `${new Date(profile.travelDates.start).toLocaleDateString()} - ${new Date(profile.travelDates.end).toLocaleDateString()}`
                      : "No travel dates specified"}
                  </p>
                </div>
              </div>

              <div className="profilePage-actions">
                <Link to="/profile-setup">
                  <button className="profile-edit-button">Edit Profile</button>
                </Link>

                <Link className="dashboard-link" to="/matching">
                  Back to Matching
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}

export default ProfilePage;