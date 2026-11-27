import React, {
  useState,
  useEffect,
  useContext,
} from "react";

import { Link, useNavigate } from "react-router-dom";
import TripMateLogo from "../components/TripMateLogo";
import "../styles/ProfileSetup.css";
import { AuthContext } from "../context/AuthContext";
import ProfilePhotoGallery from "../components/ProfilePhotoGallery";
import LocationAutocomplete from "../components/LocationAutocomplete";

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
  const { user, authLoading } = useContext(AuthContext);

  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [interests, setInterests] = useState([]);
  const [preferredDestinations, setPreferredDestinations] =
    useState([]);
  const [destinationInput, setDestinationInput] = useState("");
  const [destinationType, setDestinationType] = useState("city");
  const [customInterest, setCustomInterest] = useState("");
  const [travelStyle, setTravelStyle] = useState("");
  const [bio, setBio] = useState("");
  const [location, setLocation] = useState("");
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [destinationDetails, setDestinationDetails] = useState([]);

  const [photos, setPhotos] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  
  // Load existing profile and account information
useEffect(() => {
  if (authLoading) return;

  const token = localStorage.getItem("token");
  const controller = new AbortController();

  setName(user?.name || "");
  setEmail(user?.email || "");

  fetch("/api/profile", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    signal: controller.signal,
  })
    .then((res) => {
      if (res.status === 404) return null;

      if (!res.ok) {
        throw new Error(
          `Profile request failed (${res.status})`
        );
      }

      return res.json();
    })
    .then((data) => {
      if (!data) return;

      setName(data.name || user?.name || "");
      setEmail(user?.email || data.email || "");

      setInterests(toArray(data.interests));

      setPreferredDestinations(
        toArray(data.preferredDestinations)
      );

      setTravelStyle(data.travelStyle || "");
      setBio(data.bio || "");
      setLocation(data.location || "");
      setSelectedLocation(
  data.locationDetails || null
);

setDestinationDetails(
  Array.isArray(data.destinationDetails)
    ? data.destinationDetails
    : []
);
      const existingPhotos =
  Array.isArray(data.profilePictures) &&
  data.profilePictures.length > 0
    ? data.profilePictures
    : data.profilePicture
      ? [data.profilePicture]
      : [];

setPhotos(
  existingPhotos.map(url => ({
    id: url,
    url,
  }))
);
    })
    .catch((err) => {
      if (err.name === "AbortError") return;

      console.error("Could not load profile:", err);

      setError(
        "We couldn't load your existing profile."
      );
    })
    .finally(() => {
      if (!controller.signal.aborted) {
        setLoading(false);
      }
    });

  return () => controller.abort();
}, [user, authLoading]);

  

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

  const addDestination = (place) => {
  if (!place?.placeId || !place?.label) return;

  const label = place.label.trim();

  const alreadySelected = preferredDestinations.some(
    item => item.toLowerCase() === label.toLowerCase()
  );

  if (
    !alreadySelected &&
    preferredDestinations.length >= 10
  ) {
    setError("You can add up to 10 destinations.");
    return;
  }

  setPreferredDestinations(previous => {
    const exists = previous.some(
      item => item.toLowerCase() === label.toLowerCase()
    );

    return exists ? previous : [...previous, label];
  });

  setDestinationDetails(previous => [
    ...previous.filter(
      item =>
        item.placeId !== place.placeId &&
        item.label.toLowerCase() !== label.toLowerCase()
    ),
    { ...place, label }
  ]);

  setDestinationInput("");
  setError("");
};

  const removeDestination = (destination) => {
  const label = destination.trim().toLowerCase();

  setPreferredDestinations(previous =>
    previous.filter(
      item => item.trim().toLowerCase() !== label
    )
  );

  setDestinationDetails(previous =>
    previous.filter(
      item => item.label.trim().toLowerCase() !== label
    )
  );

  setError("");
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

    const finalDestinations = [...preferredDestinations];

    if (
        !selectedLocation ||
        selectedLocation.label !== location
      ) {
        setError("Please select your city from the location search results.");
        return;
      }

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

    if (!bio.trim()) {
      setError("Please write a short introduction about yourself.");
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
      JSON.stringify(finalDestinations)
    );
      formData.append("travelStyle", travelStyle);
      formData.append("bio", bio.trim());
      formData.append("location", location.trim());
      formData.append(
  "locationDetails",
  JSON.stringify(selectedLocation)
);

const validDestinationDetails = destinationDetails.filter(
  place => finalDestinations.includes(place.label)
);

formData.append(
  "destinationDetails",
  JSON.stringify(validDestinationDetails)
);

     const retainedPhotos = photos.filter(
  photo => !photo.file
);

const newPhotos = photos.filter(
  photo => photo.file
);

formData.append(
  "retainedPhotos",
  JSON.stringify(
    retainedPhotos.map(photo => photo.url)
  )
);

newPhotos.forEach(photo => {
  formData.append(
    "profilePictures",
    photo.file
  );
});

const uploadOrder = [
  ...retainedPhotos,
  ...newPhotos,
];

const photoOrder = photos.map(photo =>
  uploadOrder.findIndex(
    item => item.id === photo.id
  )
);

formData.append(
  "photoOrder",
  JSON.stringify(photoOrder)
);

      const response = await fetch("/api/profile", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
  const errorData = await response.json().catch(() => ({}));

  console.error("Backend validation error:", errorData);

  throw new Error(
    errorData.message || "Could not save profile."
  );
}

      navigate("/welcome");
    } catch (err) {
  console.error("Profile update failed:", err);

  setError(
    err.message ||
    "Something went wrong while saving your profile."
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

            {/* Profile photo gallery */}

              <ProfilePhotoGallery
                photos={photos}
                onChange={setPhotos}
                disabled={saving}
              />
            

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
                    value={email}
                    readOnly
                    required
                  />

                    <span className="ps-hint">
                      Email linked to your TripMate account.
                    </span>
                </div>

                <div className="ps-field ps-full-width">
                  <label htmlFor="ps-location">
                    Where are you based?
                  </label>

                  <LocationAutocomplete
                      id="ps-location"
                      value={location}
                      placeholder="Search for your city..."
                      type="city"
                      disabled={saving}
                      onChange={(value) => {
                        setLocation(value);
                        setSelectedLocation(null);
                      }}
                      onSelect={(place) => {
                        setLocation(place.label);
                        setSelectedLocation(place);
                      }}
                    />

                    <span className="ps-hint">
                      Select your city from the search results.
                    </span>
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

              <div className="ps-location-type">
                    <button
                      type="button"
                      className={
                        destinationType === "city"
                          ? "ps-location-option active"
                          : "ps-location-option"
                      }
                      onClick={() => {
                        setDestinationType("city");
                        setDestinationInput("");
                      }}
                    >
                      Cities
                    </button>

                    <button
                      type="button"
                      className={
                        destinationType === "country"
                          ? "ps-location-option active"
                          : "ps-location-option"
                      }
                      onClick={() => {
                        setDestinationType("country");
                        setDestinationInput("");
                      }}
                    >
                      Countries
                    </button>
                  </div>

<LocationAutocomplete
  value={destinationInput}
  type={destinationType}
  placeholder={
    destinationType === "city"
      ? "Search for a city..."
      : "Search for a country..."
  }
  disabled={
    saving || preferredDestinations.length >= 10
  }
  onChange={setDestinationInput}
  onSelect={addDestination}
/>

<span className="ps-hint">
  {preferredDestinations.length} of 10 destinations selected
</span>

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