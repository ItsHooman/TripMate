import React from "react";
import BottomNav from "./BottomNav";
import TripMateLogo from "./TripMateLogo";
import "../styles/AppShell.css";

function AppShell({ children, className = "" }) {
  return (
    <div className={`app-shell-page ${className}`.trim()}>

      <header className="app-shell-header">
        <div className="app-shell-header-inner">

          <TripMateLogo />

          <span className="app-shell-tagline">
            Discover. Connect. Travel.
          </span>

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