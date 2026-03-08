import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../styles/LikedUsersPage.css";

function LikedUsersPage() {
  const [likedUsers, setLikedUsers] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const storedUsers = JSON.parse(localStorage.getItem("likedUsers")) || [];
    setLikedUsers(storedUsers);
  }, []);

  const addLikedUser = (newUser) => {
    const storedUsers = JSON.parse(localStorage.getItem("likedUsers")) || [];
    
    if (!storedUsers.find(user => user._id === newUser._id)) {
      const updatedUsers = [...storedUsers, newUser];
      
      localStorage.setItem("likedUsers", JSON.stringify(updatedUsers));
      setLikedUsers(updatedUsers);
    }
  };

  const handleUnmatch = (userToRemove) => {
    const updatedUsers = likedUsers.filter(user => user._id !== userToRemove._id);
    localStorage.setItem("likedUsers", JSON.stringify(updatedUsers));
    setLikedUsers(updatedUsers);
  };

  return (
    <div className="liked-users-container">
      <nav className="navbar color-7">
        <div className="logo">
          <a href="/matching">
            <img className="app-image" src="/logo-1-Photoroom.png" alt="App Logo" />
          </a>
        </div>
        <div className="navbar-links">
          <a href="/matching">Back to Matching</a>
        </div>
      </nav>

      <h2 className="liked-users-title">Liked Users</h2>

      {likedUsers.length > 0 ? (
        <div className="liked-users-grid">
          {likedUsers.map((user) => (
            <div key={user._id} className="liked-user-card">
              {user.profile?.profilePicture ? (
                <img src={user.profile.profilePicture} alt={user.profile.name} className="profile-image" />
              ) : (
                <p>No profile picture available</p>
              )}
              <h3>{user.profile?.name || "Anonymous"}</h3>
              <p><strong>Interests:</strong> {user.profile?.interests?.join(", ") || "N/A"}</p>
              <Link to={`/user-profile/${user._id}`} className="profile-link">View Profile</Link>
              
              {/* "Unmatch" or "Unlike" button */}
              <button
                onClick={() => handleUnmatch(user)}
                className="unmatch-btn"
              >
                Unmatch
              </button>
            </div>
          ))}
        </div>
      ) : (
        <p className="no-liked-users-text">No liked users yet.</p>
      )}
    </div>
  );
}

export default LikedUsersPage;
