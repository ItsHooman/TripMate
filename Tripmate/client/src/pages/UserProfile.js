import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  FaUserAlt,
  FaMapMarkedAlt,
  FaCalendarAlt,
  FaHeart,
  FaGlobeAmericas,
} from "react-icons/fa";

import "../styles/UserProfile.css";
import AppShell from "../components/AppShell";
import API_BASE_URL from "../config/api";

function UserProfile() {
  const { userId } = useParams();
  const navigate = useNavigate();

  const [userDetails, setUserDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedReasons, setSelectedReasons] = useState([]);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  const defaultProfilePicture =
    "https://i.postimg.cc/rwk4Qqd6/avatar-account-flat-isolated-on-transparent-background-for-graphic-and-web-design-default-social-med.jpg";

  const openReportModal = () => {
    setIsReportModalOpen(true);
  };

  const closeReportModal = () => {
    setIsReportModalOpen(false);
    setSelectedReasons([]);
  };

  const handleCheckboxChange = (e) => {
    const { value, checked } = e.target;

    setSelectedReasons((prev) =>
      checked ? [...prev, value] : prev.filter((reason) => reason !== value)
    );
  };

  const handleReportSubmit = async () => {
    if (selectedReasons.length === 0) {
      alert("Please select at least one reason for reporting.");
      return;
    }

    try {
      const token = localStorage.getItem("token");

      const response = await fetch(`${API_BASE_URL}/reports/report`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          reportedUserId: userDetails._id,
          reason: selectedReasons.join(", "),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to report user");
      }

      closeReportModal();
      alert("User reported successfully");
    } catch (err) {
      console.error(err);
      alert("There was an issue reporting the user");
    }
  };

  useEffect(() => {
    const fetchUserDetails = async () => {
      setLoading(true);
      setError("");

      try {
        const token = localStorage.getItem("token");

        const response = await fetch(`${API_BASE_URL}/matche/users/${userId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error(`Error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        setUserDetails(data);
      } catch (err) {
        console.error(err);
        setError("Failed to fetch user details. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchUserDetails();
  }, [userId]);

  const handleConnect = () => {
    const connectedUsers =
      JSON.parse(localStorage.getItem("connectedUsers")) || [];

    const isAlreadyConnected = connectedUsers.some(
      (user) => user._id === userDetails._id
    );

    if (!isAlreadyConnected) {
      connectedUsers.push(userDetails);
      localStorage.setItem("connectedUsers", JSON.stringify(connectedUsers));
    }

    navigate("/messages", {
      state: { selectedUser: userDetails },
    });
  };

  return (
    <AppShell className="profilePage-container">
      <div className="app-page user-profile-page-inner">
        {loading ? (
          <p className="profile-loading-text">Loading user profile...</p>
        ) : error ? (
          <p className="error-message">{error}</p>
        ) : (
          <>
            <div className="profilePage-card">
              <div className="profilePage-image-container">
                <img
                  src={
                    userDetails?.profile?.profilePicture || defaultProfilePicture
                  }
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
                      <strong>Name:</strong>{" "}
                      {userDetails?.profile?.name || "Not provided"}
                    </p>
                  </div>

                  <div className="profilePage-detail">
                    <FaUserAlt className="profilePage-icon" />
                    <p>
                      <strong>Email:</strong>{" "}
                      {userDetails?.profile?.email || "Not provided"}
                    </p>
                  </div>

                  <div className="profilePage-detail">
                    <FaHeart className="profilePage-icon" />
                    <p>
                      <strong>Bio:</strong>{" "}
                      {userDetails?.profile?.bio || "No bio added yet."}
                    </p>
                  </div>

                  <div className="profilePage-detail">
                    <FaGlobeAmericas className="profilePage-icon" />
                    <p>
                      <strong>Interests:</strong>{" "}
                      {userDetails?.profile?.interests?.length
                        ? userDetails.profile.interests.join(", ")
                        : "No interests added yet."}
                    </p>
                  </div>

                  <div className="profilePage-detail">
                    <FaMapMarkedAlt className="profilePage-icon" />
                    <p>
                      <strong>Location:</strong>{" "}
                      {userDetails?.profile?.location || "Not provided"}
                    </p>
                  </div>

                  <div className="profilePage-detail">
                    <FaCalendarAlt className="profilePage-icon" />
                    <p>
                      <strong>Travel Dates:</strong>{" "}
                      {userDetails?.profile?.travelDates?.start &&
                      userDetails?.profile?.travelDates?.end
                        ? `${new Date(
                            userDetails.profile.travelDates.start
                          ).toLocaleDateString()} - ${new Date(
                            userDetails.profile.travelDates.end
                          ).toLocaleDateString()}`
                        : "No travel dates specified"}
                    </p>
                  </div>
                </div>

                <div className="profilePage-actions">
                  <button onClick={handleConnect} className="edit-button">
                    Connect
                  </button>
                  <button onClick={openReportModal} className="edit-button">
                    Report
                  </button>
                </div>
              </div>
            </div>

            {isReportModalOpen && (
              <div className="report-modal">
                <div className="report-modal-content">
                  <h2>Report User</h2>

                  <div>
                    <input
                      type="checkbox"
                      id="inappropriate"
                      value="Inappropriate behavior"
                      checked={selectedReasons.includes(
                        "Inappropriate behavior"
                      )}
                      onChange={handleCheckboxChange}
                    />
                    <label htmlFor="inappropriate">
                      Inappropriate behavior
                    </label>
                  </div>

                  <div>
                    <input
                      type="checkbox"
                      id="spam"
                      value="Spam"
                      checked={selectedReasons.includes("Spam")}
                      onChange={handleCheckboxChange}
                    />
                    <label htmlFor="spam">Spam</label>
                  </div>

                  <div>
                    <input
                      type="checkbox"
                      id="harassment"
                      value="Harassment"
                      checked={selectedReasons.includes("Harassment")}
                      onChange={handleCheckboxChange}
                    />
                    <label htmlFor="harassment">Harassment</label>
                  </div>

                  <div className="report-modal-actions">
                    <button onClick={closeReportModal}>Cancel</button>
                    <button onClick={handleReportSubmit}>Submit Report</button>
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