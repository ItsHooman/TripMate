import React from "react";
import { Link } from "react-router-dom";

function TripMateLogo() {
  return (
    <Link
      to="/matching"
      className="tripmate-brand"
      aria-label="TripMate Home"
    >
      <svg
        className="tripmate-brand-icon"
        viewBox="0 0 64 64"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <rect
          width="64"
          height="64"
          rx="18"
          fill="currentColor"
        />

        <path
          d="M32 51S15 34 15 24a17 17 0 0 1 34 0C49 34 32 51 32 51Z"
          stroke="#ffffff"
          strokeWidth="2.6"
          fill="none"
        />

        <path
          d="m24 31 17-15-6 22-5-9Z"
          fill="#ffffff"
          stroke="#ffffff"
          strokeLinejoin="round"
        />
      </svg>

      <span className="tripmate-brand-name">
        TripMate
      </span>
    </Link>
  );
}

export default TripMateLogo;