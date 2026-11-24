import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  FaSearch,
  FaCalendarAlt,
  FaUsers,
  FaMapMarkerAlt,
  FaArrowRight,
  FaCompass,
  FaMusic,
  FaMountain,
  FaGlassCheers,
  FaChalkboardTeacher,
  FaBriefcase,
  FaTimes,
} from "react-icons/fa";

import "../styles/ExploreEvents.css";
import API_BASE_URL from "../config/api";
import AppShell from "../components/AppShell";

const categories = [
  { label: "All events", value: "", icon: FaCompass },
  { label: "Concerts", value: "concert", icon: FaMusic },
  { label: "Adventure", value: "adventure", icon: FaMountain },
  { label: "Parties", value: "party", icon: FaGlassCheers },
  { label: "Workshops", value: "workshop", icon: FaChalkboardTeacher },
  { label: "Conferences", value: "conference", icon: FaBriefcase },
];

function EventImage({ event }) {
  const [failed, setFailed] = useState(false);

  const category = categories.find(
    (item) =>
      item.value &&
      event.type?.toLowerCase().includes(item.value)
  );

  const Icon = category?.icon || FaCompass;

  return (
    <div className="explore-card-media">
      {event.image && !failed ? (
        <img
          src={event.image}
          alt={event.name}
          loading="lazy"
          onError={() => setFailed(true)}
        />
      ) : (
        <div className="explore-image-fallback">
          <Icon />
          <span>{event.type || "Experience"}</span>
        </div>
      )}

      <span className="explore-card-category">
        {event.type || "Experience"}
      </span>
    </div>
  );
}

function ExploreEvents() {
  const [events, setEvents] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchDate, setSearchDate] = useState("");
  const [searchType, setSearchType] = useState("");
  const [visibleCount, setVisibleCount] = useState(6);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/event`);

        if (!response.ok) {
          throw new Error("Failed to load events.");
        }

        const data = await response.json();
        setEvents(Array.isArray(data) ? data : []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  useEffect(() => {
    setVisibleCount(6);
  }, [searchQuery, searchDate, searchType]);

  const clearFilters = () => {
    setSearchQuery("");
    setSearchDate("");
    setSearchType("");
    setVisibleCount(6);
  };

  const filteredEvents = events.filter((event) => {
    const query = searchQuery.trim().toLowerCase();

    const matchesSearch =
      `${event.destination || ""} ${event.name || ""}`
        .toLowerCase()
        .includes(query);

    const matchesDate =
      !searchDate ||
      String(event.startDate || "").slice(0, 10) === searchDate;

    const matchesType =
      !searchType ||
      (event.type || "").toLowerCase().includes(searchType);

    return matchesSearch && matchesDate && matchesType;
  });

  const visibleEvents = filteredEvents.slice(0, visibleCount);

  const hasFilters = searchQuery || searchDate || searchType;

  return (
    <AppShell className="explore-shell">
      <div className="explore-page-inner">

        <header className="explore-heading">
          <span className="explore-eyebrow">
            DISCOVER SOMETHING NEW
          </span>

          <h1>Explore the world.</h1>

          <p>
            Discover experiences, meet new people,
            and make unforgettable memories.
          </p>
        </header>

        <div className="explore-search-panel">
          <div className="explore-search-field">
            <FaSearch />

            <div className="explore-field-content">
              <label htmlFor="explore-destination">
                Where to?
              </label>

              <input
                id="explore-destination"
                type="search"
                placeholder="Search destinations or events"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="explore-date-field">
            <FaCalendarAlt />

            <div className="explore-field-content">
              <label htmlFor="explore-date">
                When?
              </label>

              <input
                id="explore-date"
                type="date"
                value={searchDate}
                onChange={(e) => setSearchDate(e.target.value)}
              />
            </div>
          </div>

          {hasFilters && (
            <button
              type="button"
              className="explore-clear-button"
              onClick={clearFilters}
              aria-label="Clear all filters"
            >
              <FaTimes />
            </button>
          )}
        </div>

        <div className="explore-categories">
          {categories.map(({ label, value, icon: Icon }) => (
            <button
              key={label}
              type="button"
              className={`explore-category ${
                searchType === value ? "active" : ""
              }`}
              onClick={() => setSearchType(value)}
              aria-pressed={searchType === value}
            >
              <Icon />
              <span>{label}</span>
            </button>
          ))}
        </div>

        <div className="explore-results-heading">
          <h2>Discover experiences</h2>

          {!loading && !error && (
            <span>
              {filteredEvents.length}{" "}
              {filteredEvents.length === 1 ? "event" : "events"}
            </span>
          )}
        </div>

        {loading ? (
          <div className="explore-empty-state">
            <FaCompass />
            <h3>Finding experiences...</h3>
          </div>
        ) : error ? (
          <div className="explore-empty-state">
            <h3>Something went wrong</h3>
            <p>{error}</p>
          </div>
        ) : visibleEvents.length === 0 ? (
          <div className="explore-empty-state">
            <FaCompass />

            <h3>No experiences found</h3>

            <p>Try another destination or change your filters.</p>

            {hasFilters && (
              <button onClick={clearFilters}>
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <div className="explore-event-grid">
            {visibleEvents.map((event) => (
              <article
                className="explore-event-card"
                key={event._id}
              >
                <Link
                  to={`/events/${event._id}`}
                  className="explore-image-link"
                >
                  <EventImage event={event} />
                </Link>

                <div className="explore-card-body">
                  <h3>{event.name}</h3>

                  <div className="explore-event-meta">
                    <FaMapMarkerAlt />
                    <span>
                      {event.destination || "Location not specified"}
                    </span>
                  </div>

                  <div className="explore-event-meta">
                    <FaCalendarAlt />

                    <span>
                      {event.startDate
                        ? new Date(event.startDate).toLocaleDateString(
                            "en-US",
                            {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                              timeZone: "UTC",
                            }
                          )
                        : "Date to be announced"}
                    </span>
                  </div>

                  <div className="explore-card-footer">
                    <div className="explore-attendees">
                      <FaUsers />
                      <span>{event.attendees ?? 0} attendees</span>
                    </div>

                    <Link
                      to={`/events/${event._id}`}
                      className="explore-details-link"
                    >
                      Explore
                      <FaArrowRight />
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}

        {!loading &&
          !error &&
          visibleCount < filteredEvents.length && (
            <div className="explore-load-more">
              <button
                onClick={() => setVisibleCount((prev) => prev + 6)}
              >
                Load more experiences
              </button>
            </div>
          )}

      </div>
    </AppShell>
  );
}

export default ExploreEvents;