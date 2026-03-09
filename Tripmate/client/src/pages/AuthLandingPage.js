import React, { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import "../styles/AuthLandingPage.css";
import backgroundImage from "../assets/main-back2.webp";

function AuthLandingPage() {
  const navigate = useNavigate();
  const { login } = useContext(AuthContext);

  const [activeTab, setActiveTab] = useState("register");
  const [loading, setLoading] = useState(false);

  const [registerData, setRegisterData] = useState({
    name: "",
    email: "",
    password: "",
  });

  const [loginData, setLoginData] = useState({
    email: "",
    password: "",
  });

  const [errorMessage, setErrorMessage] = useState("");

  const handleRegisterChange = (e) => {
    setRegisterData({ ...registerData, [e.target.name]: e.target.value });
  };

  const handleLoginChange = (e) => {
    setLoginData({ ...loginData, [e.target.name]: e.target.value });
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    setLoading(true);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(registerData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || data.error || "Registration failed");
      }
      localStorage.removeItem("tripmateOnboardingSeen");

      // after successful register, switch to login tab
      setActiveTab("login");
      setLoginData({
        email: registerData.email,
        password: "",
      });

      setRegisterData({
        name: "",
        email: "",
        password: "",
      });

      setErrorMessage("Account created successfully. Please log in.");
    } catch (error) {
      setErrorMessage(error.message || "Something went wrong during registration.");
    } finally {
      setLoading(false);
    }
  };

  const handleLoginSubmit = async (e) => {
  e.preventDefault();
  setErrorMessage("");
  setLoading(true);

  try {
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(loginData),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || data.error || "Login failed");
    }

    localStorage.setItem("token", data.token);
    localStorage.setItem("user", JSON.stringify(data.user));
    localStorage.setItem("role", data.user?.role || "user");

    login(data.user, data.token);

    const profileResponse = await fetch("/api/profile", {
      headers: {
        Authorization: `Bearer ${data.token}`,
      },
    });

    const profileData = await profileResponse.json();

    const profileComplete =
      profileResponse.ok &&
      profileData.name &&
      profileData.bio &&
      profileData.location &&
      profileData.travelStyle &&
      Array.isArray(profileData.interests) &&
      profileData.interests.length > 0 &&
      Array.isArray(profileData.preferredDestinations) &&
      profileData.preferredDestinations.length > 0;

    const onboardingSeen =
      localStorage.getItem("tripmateOnboardingSeen") === "true";

    if (profileComplete) {
      if (onboardingSeen) {
        navigate("/matching");
      } else {
        navigate("/welcome");
      }
    } else {
      navigate("/profile-setup");
    }
  } catch (error) {
    setErrorMessage(error.message || "Something went wrong during login.");
  } finally {
    setLoading(false);
  }
};

  return (
    <div
        className="auth-landing-page"
        style={{
            background: `linear-gradient(135deg, rgba(8,15,40,0.92), rgba(18,42,66,0.88)), url(${backgroundImage}) center/cover no-repeat`
        }}
        >
      <div className="auth-landing-overlay" />

      <div className="auth-landing-content">
        <section className="auth-landing-left">
          <div className="brand-badge">TripMate</div>

          <h1>
            Find travel events, connect with like-minded people, and plan better
            trips together.
          </h1>

          <p className="hero-text">
            TripMate helps solo travelers and adventure seekers discover events,
            match with compatible travel companions, and chat before the journey
            begins.
          </p>

          <div className="feature-list">
            <div className="feature-card">
              <h3>Explore Events</h3>
              <p>
                Discover curated travel experiences, group outings, and exciting
                destinations.
              </p>
            </div>

            <div className="feature-card">
              <h3>Find Companions</h3>
              <p>
                Match with travelers who share your interests, vibe, and travel
                style.
              </p>
            </div>

            <div className="feature-card">
              <h3>Message & Connect</h3>
              <p>
                Chat with potential travel buddies and make plans before the trip
                starts.
              </p>
            </div>
          </div>
        </section>

        <section className="auth-landing-right">
          <div className="auth-card">
            <div className="auth-tabs">
              <button
                className={activeTab === "register" ? "auth-tab active" : "auth-tab"}
                onClick={() => {
                  setActiveTab("register");
                  setErrorMessage("");
                }}
                type="button"
              >
                Sign Up
              </button>

              <button
                className={activeTab === "login" ? "auth-tab active" : "auth-tab"}
                onClick={() => {
                  setActiveTab("login");
                  setErrorMessage("");
                }}
                type="button"
              >
                Log In
              </button>
            </div>

            <div className="auth-card-body">
              {activeTab === "register" ? (
                <>
                  <h2>Create your account</h2>
                  <p className="auth-subtext">
                    Start exploring events and meeting travel companions.
                  </p>

                  <form onSubmit={handleRegisterSubmit} className="auth-form">
                    <input
                      type="text"
                      name="name"
                      placeholder="Full name"
                      value={registerData.name}
                      onChange={handleRegisterChange}
                      required
                    />

                    <input
                      type="email"
                      name="email"
                      placeholder="Email address"
                      value={registerData.email}
                      onChange={handleRegisterChange}
                      required
                    />

                    <input
                      type="password"
                      name="password"
                      placeholder="Password"
                      value={registerData.password}
                      onChange={handleRegisterChange}
                      required
                    />

                    {errorMessage && (
                      <div className="auth-message">{errorMessage}</div>
                    )}

                    <button
                      type="submit"
                      className="auth-submit-btn"
                      disabled={loading}
                    >
                      {loading ? "Creating account..." : "Create Account"}
                    </button>
                  </form>
                </>
              ) : (
                <>
                  <h2>Welcome back</h2>
                  <p className="auth-subtext">
                    Log in to continue your travel journey.
                  </p>

                  <form onSubmit={handleLoginSubmit} className="auth-form">
                    <input
                      type="email"
                      name="email"
                      placeholder="Email address"
                      value={loginData.email}
                      onChange={handleLoginChange}
                      required
                    />

                    <input
                      type="password"
                      name="password"
                      placeholder="Password"
                      value={loginData.password}
                      onChange={handleLoginChange}
                      required
                    />

                    {errorMessage && (
                      <div className="auth-message">{errorMessage}</div>
                    )}

                    <button
                      type="submit"
                      className="auth-submit-btn"
                      disabled={loading}
                    >
                      {loading ? "Logging in..." : "Log In"}
                    </button>
                  </form>
                </>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

export default AuthLandingPage;