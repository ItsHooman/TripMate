
import React from "react";
import { NavLink } from "react-router-dom";

import {
  FiHome,
  FiGlobe,
  FiMessageCircle,
  FiUser,
} from "react-icons/fi";

import { useSocket } from "../context/SocketContext";

import "../styles/global.css";

function BottomNav() {
  const { unreadCount } = useSocket();

  const navigation = [
    {
      path: "/matching",
      label: "Home",
      icon: FiHome,
    },
    {
      path: "/explore-events",
      label: "Explore",
      icon: FiGlobe,
    },
    {
      path: "/messages",
      label: "Messages",
      icon: FiMessageCircle,
      count: unreadCount,
    },
    {
      path: "/profile",
      label: "Profile",
      icon: FiUser,
    },
  ];

  return (
    <nav
      className="bottom-nav"
      aria-label="Main navigation"
    >
      {navigation.map(
        ({ path, label, icon: Icon, count }) => (
          <NavLink
            key={path}
            to={path}
            aria-label={
              count > 0
                ? `${label}, ${count} unread`
                : label
            }
            className={({ isActive }) =>
              isActive
                ? "bottom-nav-link active"
                : "bottom-nav-link"
            }
          >
            <div className="bottom-nav-icon-wrapper">

              <Icon
                className="bottom-nav-icon"
                aria-hidden="true"
              />

              {count > 0 && (
                <span className="tripmate-unread-badge">
                  {count > 99 ? "99+" : count}
                </span>
              )}

            </div>

            <span>{label}</span>
          </NavLink>
        )
      )}
    </nav>
  );
}

export default BottomNav;
