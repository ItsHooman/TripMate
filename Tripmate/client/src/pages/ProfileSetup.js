import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import TripMateLogo from "../components/TripMateLogo";
import "../styles/ProfileSetup.css";

const INTEREST_OPTIONS = [
  "Adventure",
  "Nature",
  "Nightlife",
  "Music",
  "Food",
  "Culture",
  "Beaches",
  "Hiking",
  "Photography",
  "Shopping",
  "Festivals",
  "Road Trips",
  "History",
  "Fitness",
  "Camping",
  "Art",
];

const TRAVEL_STYLES = [
  {
    name: "Solo",
    icon: "fas fa-user",
    description: "Explore independently",
  },
  {
    name: "Group",
    icon: "fas fa-users",
    description: "Share the adventure",
  },
  {
    name: "Flexible",
    icon: "fas fa-compass",
    description: "Open to anything",
  },
];

const DEFAULT_PROFILE_PICTURE =
  "https://i.postimg.cc/rwk4Qqd6/avatar-account-flat-isolated-on-transparent-background-for-graphic-and-web-design-default-social-med.jpg";

const toArray = (value) => {
  if (Array.isArray(value)) return value;

  if (typeof value === "string") {
    return value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
};

function ProfileSetup() {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [interests, setInterests] = useState([]);
  const [preferredDestinations, setPreferredDestinations] =
    useState([]);
  const [destinationInput, setDestinationInput] = useState("");
  const [customInterest, setCustomInterest] = useState("");
  const [travelStyle, setTravelStyle] = useState("");
  const [bio, setBio] = useState("");
  const [location, setLocation] = useState("");

  const [profilePicture, setProfilePicture] = useState("");
  const [profileFile, setProfileFile] = useState(null);
  const [preview, setPreview] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Load existing profile
  useEffect(() => {
    const token = localStorage.getItem("token");

    fetch("/api/profile", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error(`Profile request failed (${res.status})`);
        }

        return res.json();
      })
      .then((data) => {
        if (!data) return;

        setName(data.name ?? "");
        setEmail(data.email ?? "");
        setInterests(toArray(data.interests));
        setPreferredDestinations(
          toArray(data.preferredDestinations)
        );
        setTravelStyle(data.travelStyle ?? "");
        setBio(data.bio ?? "");
        setLocation(data.location ?? "");
        setProfilePicture(data.profilePicture ?? "");
      })
      .catch((err) => {
        console.error("Could not load profile:", err);
        setError(
          "We couldn't load your existing profile. Please check your details."
        );
      })
      .finally(() => setLoading(false));
  }, []);

  // Generate and clean up image preview
  useEffect(() => {
    if (!profileFile) {
      setPreview("");
      return;
    }

    const imageUrl = URL.createObjectURL(profileFile);

    setPreview(imageUrl);

    return () => URL.revokeObjectURL(imageUrl);
  }, [profileFile]);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please select a valid image file.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Please select an image smaller than 5 MB.");
      return;
    }

    setError("");
    setProfileFile(file);
  };

  const toggleInterest = (interest) => {
    setInterests((previous) =>
      previous.includes(interest)
        ? previous.filter((item) => item !== interest)
        : [...previous, interest]
    );
  };

  const addCustomInterest = () => {
    const value = customInterest.trim();

    if (!value) return;

    setInterests((previous) =>
      previous.some(
        (item) => item.toLowerCase() === value.toLowerCase()
      )
        ? previous
        : [...previous, value]
    );

    setCustomInterest("");
  };

  const addDestination = () => {
    const value = destinationInput.trim();

    if (!value) return;

    setPreferredDestinations((previous) =>
      previous.some(
        (item) => item.toLowerCase() === value.toLowerCase()
      )
        ? previous
        : [...previous, value]
    );

    setDestinationInput("");
  };

  const removeDestination = (destination) => {
    setPreferredDestinations((previous) =>
      previous.filter((item) => item !== destination)
    );
  };

  const handleEnter = (e, callback) => {
    if (e.key === "Enter") {
      e.preventDefault();
      callback();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const finalInterests = [
      ...interests,
      ...(customInterest.trim() ? [customInterest.trim()] : []),
    ];

    const finalDestinations = [
      ...preferredDestinations,
      ...(destinationInput.trim()
        ? [destinationInput.trim()]
        : []),
    ];

    if (!name.trim() || !email.trim() || !location.trim()) {
      setError("Please complete your personal information.");
      return;
    }

    if (finalInterests.length === 0) {
      setError("Please select at least one interest.");
      return;
    }

    if (finalDestinations.length === 0) {
      setError("Please add at least one destination.");
      return;
    }

    if (!travelStyle) {
      setError("Please select your travel style.");
      return;
    }

    setSaving(true);

    try {
      const token = localStorage.getItem("token");
      const formData = new FormData();

      formData.append("name", name.trim());
      formData.append("email", email.trim());
      formData.append("interests", finalInterests.join(", "));
      formData.append(
        "preferredDestinations",
        finalDestinations.join(", ")
      );
      formData.append("travelStyle", travelStyle);
      formData.append("bio", bio.trim());
      formData.append("location", location.trim());

      if (profileFile) {
        formData.append("profilePicture", profileFile);
      } else if (profilePicture) {
        formData.append("profilePicture", profilePicture);
      }

      const response = await fetch("/api/profile", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Could not save profile.");
      }

      navigate("/welcome");
    } catch (err) {
      console.error("Profile update failed:", err);

      setError(
        "Something went wrong while saving your profile. Please try again."
      );
    } finally {
      setSaving(false);
    }
  };

  const allInterests = [
    ...new Set([...INTEREST_OPTIONS, ...interests]),
  ];

  const allTravelStyles =
    travelStyle &&
    !TRAVEL_STYLES.some((style) => style.name === travelStyle)
      ? [
          ...TRAVEL_STYLES,
          {
            name: travelStyle,
            icon: "fas fa-globe",
            description: "Your travel style",
          },
        ]
      : TRAVEL_STYLES;

  return (
    <div className="ps-page">

      {/* Header */}
      <header className="ps-header">
        <div className="ps-header-inner">
          <TripMateLogo />

          <span className="ps-header-label">
            Your travel profile
          </span>
        </div>
      </header>

      <main className="ps-main">

        {/* Introduction */}
        <div className="ps-intro">
          <span className="ps-eyebrow">
            YOUR NEXT ADVENTURE STARTS HERE
          </span>

          <h1>Let's get to know you.</h1>

          <p>
            Tell us a little about yourself so we can connect
            you with like-minded travellers.
          </p>
        </div>

        {loading ? (
          <div className="ps-loading">
            <div className="ps-spinner" />
            <p>Loading your profile...</p>
          </div>
        ) : (
          <form className="ps-form" onSubmit={handleSubmit}>

            {/* Profile photo */}
            <div className="ps-photo-section">

              <div className="ps-avatar-wrapper">
                <img
                  className="ps-avatar"
                  src={
                    preview ||
                    profilePicture ||
                    DEFAULT_PROFILE_PICTURE
                  }
                  alt="Your profile"
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src =
                      DEFAULT_PROFILE_PICTURE;
                  }}
                />

                <label
                  htmlFor="ps-photo-upload"
                  className="ps-camera-button"
                  aria-label="Change profile photo"
                >
                  <i className="fas fa-camera" />
                </label>
              </div>

              <input
                id="ps-photo-upload"
                className="ps-file-input"
                type="file"
                accept="image/*"
                onChange={handleFileChange}
              />

              <label
                htmlFor="ps-photo-upload"
                className="ps-upload-label"
              >
                {profilePicture || profileFile
                  ? "Change profile photo"
                  : "Upload profile photo"}
              </label>

              <span className="ps-hint">
                JPG, PNG or other images · Max 5 MB
              </span>
            </div>

            {/* Personal information */}
            <section className="ps-section">

              <div className="ps-section-heading">
                <div className="ps-section-icon">
                  <i className="fas fa-user" />
                </div>

                <div>
                  <h2>Personal information</h2>
                  <p>Introduce yourself to other travellers.</p>
                </div>
              </div>

              <div className="ps-grid">

                <div className="ps-field">
                  <label htmlFor="ps-name">Full name</label>

                  <input
                    id="ps-name"
                    type="text"
                    placeholder="Your name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>

                <div className="ps-field">
                  <label htmlFor="ps-email">Email address</label>

                  <input
                    id="ps-email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                <div className="ps-field ps-full-width">
                  <label htmlFor="ps-location">
                    Where are you based?
                  </label>

                  <div className="ps-input-icon">
                    <i className="fas fa-map-marker-alt" />

                    <input
                      id="ps-location"
                      type="text"
                      placeholder="e.g. Toronto, Canada"
                      value={location}
                      onChange={(e) =>
                        setLocation(e.target.value)
                      }
                      required
                    />
                  </div>
                </div>

                <div className="ps-field ps-full-width">
                  <label htmlFor="ps-bio">About me</label>

                  <textarea
                    id="ps-bio"
                    placeholder="Tell us about yourself, your favourite adventures and what makes you excited to travel..."
                    value={bio}
                    maxLength={500}
                    rows={4}
                    onChange={(e) => setBio(e.target.value)}
                  />

                  <span className="ps-character-count">
                    {bio.length}/500
                  </span>
                </div>

              </div>
            </section>

            {/* Interests */}
            <section className="ps-section">

              <div className="ps-section-heading">
                <div className="ps-section-icon">
                  <i className="fas fa-heart" />
                </div>

                <div>
                  <h2>What do you love?</h2>
                  <p>
                    Select the interests that describe you best.
                  </p>
                </div>
              </div>

              <div className="ps-chips">
                {allInterests.map((interest) => (
                  <button
                    key={interest}
                    type="button"
                    aria-pressed={interests.includes(interest)}
                    className={`ps-chip ${
                      interests.includes(interest)
                        ? "ps-chip-active"
                        : ""
                    }`}
                    onClick={() => toggleInterest(interest)}
                  >
                    {interests.includes(interest) && (
                      <i className="fas fa-check" />
                    )}

                    {interest}
                  </button>
                ))}
              </div>

              <div className="ps-add-row">
                <input
                  aria-label="Custom interest"
                  type="text"
                  placeholder="Add your own interest..."
                  value={customInterest}
                  onChange={(e) =>
                    setCustomInterest(e.target.value)
                  }
                  onKeyDown={(e) =>
                    handleEnter(e, addCustomInterest)
                  }
                />

                <button
                  type="button"
                  className="ps-add-button"
                  onClick={addCustomInterest}
                  disabled={!customInterest.trim()}
                >
                  <i className="fas fa-plus" />
                  Add
                </button>
              </div>

              <span className="ps-hint">
                {interests.length} interests selected
              </span>
            </section>

            {/* Destinations */}
            <section className="ps-section">

              <div className="ps-section-heading">
                <div className="ps-section-icon">
                  <i className="fas fa-globe" />
                </div>

                <div>
                  <h2>Dream destinations</h2>
                  <p>Where would you love to travel next?</p>
                </div>
              </div>

              <div className="ps-add-row">
                <input
                  aria-label="Dream destination"
                  type="text"
                  placeholder="e.g. Amsterdam, Tokyo, Spain"
                  value={destinationInput}
                  onChange={(e) =>
                    setDestinationInput(e.target.value)
                  }
                  onKeyDown={(e) =>
                    handleEnter(e, addDestination)
                  }
                />

                <button
                  type="button"
                  className="ps-add-button"
                  onClick={addDestination}
                  disabled={!destinationInput.trim()}
                >
                  <i className="fas fa-plus" />
                  Add
                </button>
              </div>

              {preferredDestinations.length > 0 && (
                <div className="ps-destinations">
                  {preferredDestinations.map((destination) => (
                    <span
                      key={destination}
                      className="ps-destination"
                    >
                      <i className="fas fa-map-marker-alt" />

                      {destination}

                      <button
                        type="button"
                        aria-label={`Remove ${destination}`}
                        onClick={() =>
                          removeDestination(destination)
                        }
                      >
                        <i className="fas fa-times" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </section>

            {/* Travel style */}
            <section className="ps-section">

              <div className="ps-section-heading">
                <div className="ps-section-icon">
                  <i className="fas fa-suitcase" />
                </div>

                <div>
                  <h2>Your travel style</h2>
                  <p>How do you prefer to explore the world?</p>
                </div>
              </div>

              <div className="ps-style-grid">
                {allTravelStyles.map((style) => (
                  <button
                    key={style.name}
                    type="button"
                    aria-pressed={travelStyle === style.name}
                    className={`ps-style-card ${
                      travelStyle === style.name
                        ? "ps-style-active"
                        : ""
                    }`}
                    onClick={() => setTravelStyle(style.name)}
                  >
                    <i className={style.icon} />

                    <strong>{style.name}</strong>

                    <span>{style.description}</span>

                    {travelStyle === style.name && (
                      <div className="ps-style-check">
                        <i className="fas fa-check" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </section>

            {/* Save profile */}
            <div className="ps-actions">

              {error && (
                <div className="ps-error" role="alert">
                  <i className="fas fa-exclamation-circle" />
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                className="ps-save-button"
                disabled={saving}
              >
                {saving ? (
                  <>
                    <i className="fas fa-spinner fa-spin" />
                    Saving profile...
                  </>
                ) : (
                  <>
                    Save profile &amp; continue
                    <i className="fas fa-arrow-right" />
                  </>
                )}
              </button>

              <Link to="/profile" className="ps-back-link">
                Back to profile
              </Link>

              <p className="ps-footer-note">
                You can always update your preferences later.
              </p>

            </div>
          </form>
        )}
      </main>
    </div>
  );
}

export default ProfileSetup;