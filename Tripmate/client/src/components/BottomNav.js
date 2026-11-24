import React from "react";
import { NavLink } from "react-router-dom";
import {
  FiHome,
  FiGlobe,
  FiMessageCircle,
  FiUser,
} from "react-icons/fi";

import "../styles/global.css";

function BottomNav() {
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
        ({ path, label, icon: Icon }) => (
          <NavLink
            key={path}
            to={path}
            className={({ isActive }) =>
              isActive
                ? "bottom-nav-link active"
                : "bottom-nav-link"
            }
          >
            <Icon
              className="bottom-nav-icon"
              aria-hidden="true"
            />

            <span>{label}</span>
          </NavLink>
        )
      )}
    </nav>
  );
}

export default BottomNav;