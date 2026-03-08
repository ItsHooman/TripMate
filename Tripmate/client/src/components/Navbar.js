import React, { useContext, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";


function Navbar() {
  const { logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <header className="app-header">
      <div className="app-shell">
        <nav className="app-navbar">
          <div className="app-navbar-left">
            <NavLink to="/matching" className="app-logo">
              <img
                src="/logo-1-Photoroom.png"
                alt="TripMate Logo"
                className="app-logo-image"
              />
            </NavLink>
          </div>

          <button
            className="app-menu-toggle"
            onClick={() => setIsMenuOpen((prev) => !prev)}
            aria-label="Toggle navigation"
          >
            <i className="fas fa-bars"></i>
          </button>

          <div className={`app-navbar-links ${isMenuOpen ? "open" : ""}`}>
            <NavLink
              to="/matching"
              className={({ isActive }) =>
                isActive ? "app-nav-link active" : "app-nav-link"
              }
            >
              Home
            </NavLink>

            <NavLink
              to="/explore-events"
              className={({ isActive }) =>
                isActive ? "app-nav-link active" : "app-nav-link"
              }
            >
              Explore
            </NavLink>

            <NavLink
              to="/messages"
              className={({ isActive }) =>
                isActive ? "app-nav-link active" : "app-nav-link"
              }
            >
              Messages
            </NavLink>

            <NavLink
              to="/profile"
              className={({ isActive }) =>
                isActive ? "app-nav-link active" : "app-nav-link"
              }
            >
              Profile
            </NavLink>

            <button className="app-logout-btn" onClick={handleLogout}>
              Logout
            </button>
          </div>
        </nav>
      </div>
    </header>
  );
}

export default Navbar;