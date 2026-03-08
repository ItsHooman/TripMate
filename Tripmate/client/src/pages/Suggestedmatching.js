import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import "../styles/Suggestedmatching.css"; 
import Navbar from "../components/Navbar";

const MatchingPage = () => {
  const [matches, setMatches] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const { user, logout } = useContext(AuthContext);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const defaultProfilePicture = 'https://i.postimg.cc/rwk4Qqd6/avatar-account-flat-isolated-on-transparent-background-for-graphic-and-web-design-default-social-med.jpg';

  console.log('Current User:', currentUser);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
};

  useEffect(() => {
    fetch("/api/users/me", {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.profile) {
          setCurrentUser(data.profile);
        } else {
          console.error("Profile data missing from API response.");
          setCurrentUser(null);
        }
      })
      .catch((err) => console.error("Error fetching user:", err));
      setCurrentUser(null);

    fetch("/api/matche/match", {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    })
      .then((res) => res.json())
      .then((data) => {
        setMatches(data.matches);
      })
      .catch((err) => console.error("Error fetching matches:", err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="loading-container">
        <div className="shimmer-card"></div>
        <div className="shimmer-card"></div>
        <div className="shimmer-card"></div>
      </div>
    );
  }

  return (
    <section className="matching-section">
        <Navbar />
      <h2 className="matching-title">Suggested Matched Users</h2>
          {/* Check if the user has completed their profile */}
          {!currentUser || !currentUser.name || currentUser.interests.length === 0 || currentUser.preferredDestinations.length === 0 ? (
            <div className="profile-incomplete-message">
              <p className="profile-incomplete-text">Oops! Seems like your profile is incomplete. Please complete your profile to find matches.</p>
              <Link to="/ProfileSetup" className="setup-profile-button">
                Profile Setup
              </Link>
            </div>
          ) : (
            matches && matches.length > 0 ? (
              <div className="match-list">
                {matches.map((match) => (
                  <div key={match.user._id} className="match-card">
                    <div className="match-img-container">
                      <img
                        src={match.user.profilePicture || defaultProfilePicture}
                        alt={match.user.name || "User"}
                        className="match-avatar"
                        onError={(e) => {
                          console.error("Image failed to load, using default.");
                          e.target.onerror = null;
                          e.target.src = defaultProfilePicture;
                        }} 
                      />
                      <div className="progress-bar">
                        <div className="progress-bar-fill" style={{ width: `${match.similarityScore}%` }} />
                      </div>
                    </div>
                    <div className="match-details">
                      <h3 className="match-name">{match.user.name}</h3>
                      <p>Suggested based on interests</p>
                      <Link to={`/user-profile/${match.user._id}`} className="view-profile-link">
                        View Profile
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="no-matches-text">No matches found.</p>
            )
          )}
    </section>
  );
};

export default MatchingPage;
