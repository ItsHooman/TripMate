import React from "react";
import { NavLink } from "react-router-dom";
import "../styles/global.css";

function BottomNav() {
  return (
    <nav className="bottom-nav">
      <NavLink
        to="/matching"
        className={({ isActive }) =>
          isActive ? "bottom-nav-link active" : "bottom-nav-link"
        }
      >
        <span className="bottom-nav-icon">🏠</span>
        <span>Home</span>
      </NavLink>

      <NavLink
        to="/explore-events"
        className={({ isActive }) =>
          isActive ? "bottom-nav-link active" : "bottom-nav-link"
        }
      >
        <span className="bottom-nav-icon">🌍</span>
        <span>Explore</span>
      </NavLink>

      <NavLink
        to="/messages"
        className={({ isActive }) =>
          isActive ? "bottom-nav-link active" : "bottom-nav-link"
        }
      >
        <span className="bottom-nav-icon">💬</span>
        <span>Messages</span>
      </NavLink>

      <NavLink
        to="/profile"
        className={({ isActive }) =>
          isActive ? "bottom-nav-link active" : "bottom-nav-link"
        }
      >
        <span className="bottom-nav-icon">👤</span>
        <span>Profile</span>
      </NavLink>
    </nav>
  );
}

export default BottomNav;