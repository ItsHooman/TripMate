
import React from "react";
import { NavLink } from "react-router-dom";
import { FiBell } from "react-icons/fi";

import BottomNav from "./BottomNav";
import TripMateLogo from "./TripMateLogo";

import { useSocket } from "../context/SocketContext";

import "../styles/AppShell.css";

function AppShell({ children, className = "" }) {
  const { notificationCount } = useSocket();

  return (
    <div
      className={`app-shell-page ${className}`.trim()}
    >

      <header className="app-shell-header">
        <div className="app-shell-header-inner">

          <TripMateLogo />

          <div className="app-shell-header-actions">

            <span className="app-shell-tagline">
              Discover. Connect. Travel.
            </span>

            <NavLink
              to="/notifications"
              className={({ isActive }) =>
                `app-shell-notification-button ${
                  isActive ? "active" : ""
                }`
              }
              aria-label={
                notificationCount > 0
                  ? `Notifications, ${notificationCount} unread`
                  : "Notifications"
              }
            >
              <FiBell aria-hidden="true" />

              {notificationCount > 0 && (
                <span className="tripmate-unread-badge">
                  {notificationCount > 99
                    ? "99+"
                    : notificationCount}
                </span>
              )}

            </NavLink>

          </div>

        </div>
      </header>

      <main className="app-shell-content">
        {children}
      </main>

      <div className="app-shell-bottom-nav">
        <BottomNav />
      </div>

    </div>
  );
}

export default AppShell;
