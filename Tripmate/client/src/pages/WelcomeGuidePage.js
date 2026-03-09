import React from "react";
import { useNavigate } from "react-router-dom";
import "../styles/WelcomeGuidePage.css";

function WelcomeGuidePage() {
  const navigate = useNavigate();

  const handleStart = () => {
    localStorage.setItem("tripmateOnboardingSeen", "true");
    navigate("/matching");
  };

  return (
    <div className="welcome-guide-page">
      <div className="welcome-guide-shell">
        <div className="welcome-guide-header">
          <img
            src="/logo-1-Photoroom.png"
            alt="TripMate Logo"
            className="welcome-guide-logo"
          />
          <p className="welcome-guide-eyebrow">Welcome to TripMate</p>
          <h1 className="welcome-guide-title">
            Here’s how your travel journey starts.
          </h1>
          <p className="welcome-guide-subtitle">
            TripMate helps you discover travel companions, explore events, chat
            with your matches, and improve your results by keeping your profile
            updated.
          </p>
        </div>

        <div className="welcome-guide-grid">
          <article className="welcome-guide-card">
            <div className="welcome-guide-icon">💘</div>
            <h2>Home</h2>
            <p>
              Your main screen is the matching page. Swipe through travelers and
              connect with people who share your interests, destinations, and
              travel style.
            </p>
          </article>

          <article className="welcome-guide-card">
            <div className="welcome-guide-icon">🌍</div>
            <h2>Explore</h2>
            <p>
              Discover events, destinations, and later API-powered travel info
              like weather and city-based suggestions that fit your vibe.
            </p>
          </article>

          <article className="welcome-guide-card">
            <div className="welcome-guide-icon">💬</div>
            <h2>Messages</h2>
            <p>
              Once you connect with someone, you can continue the conversation,
              get to know each other, and plan trips together.
            </p>
          </article>

          <article className="welcome-guide-card">
            <div className="welcome-guide-icon">⚙️</div>
            <h2>Profile</h2>
            <p>
              Keep your profile updated so TripMate can show better matches
              based on your interests, preferred destinations, and travel
              preferences.
            </p>
          </article>
        </div>

        <div className="welcome-guide-footer">
          <button className="welcome-guide-button" onClick={handleStart}>
            Start Matching
          </button>
        </div>
      </div>
    </div>
  );
}

export default WelcomeGuidePage;