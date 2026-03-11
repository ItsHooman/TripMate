import React from "react";
import BottomNav from "./BottomNav";
import "../styles/AppShell.css";

function AppShell({ children, className = "" }) {
  return (
    <div className={`app-shell-page ${className}`.trim()}>
      <img
        src="/logo.png"
        alt="TripMate Logo"
        className="app-shell-logo"
      />

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