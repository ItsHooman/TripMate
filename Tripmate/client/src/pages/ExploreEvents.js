import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  FaChevronLeft,
  FaChevronRight,
  FaCalendarAlt,
  FaUsers,
  FaMapMarkerAlt,
} from "react-icons/fa";

import "../styles/ExploreEvents.css";
import API_BASE_URL from "../config/api";
import AppShell from "../components/AppShell";

function ExploreEvents() {
  const [events, setEvents] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchDate, setSearchDate] = useState("");
  const [searchType, setSearchType] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const eventsPerPage = 3;

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/event`);
        const data = await response.json();
        setEvents(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Failed to fetch events:", error);
        setEvents([]);
      }
    };

    fetchEvents();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, searchDate, searchType]);

  const filteredEvents = events.filter((event) => {
    const matchesDestination = event.destination
      ?.toLowerCase()
      .includes(searchQuery.toLowerCase());

    const matchesDate = searchDate
      ? new Date(event.startDate).toLocaleDateString() ===
        new Date(searchDate).toLocaleDateString()
      : true;

    const matchesType = searchType
      ? event.type?.toLowerCase().includes(searchType.toLowerCase())
      : true;

    return matchesDestination && matchesDate && matchesType;
  });

  const totalPages = Math.max(1, Math.ceil(filteredEvents.length / eventsPerPage));

  const currentEvents = filteredEvents.slice(
    (currentPage - 1) * eventsPerPage,
    currentPage * eventsPerPage
  );

  return (
    <AppShell className="event-container">
      <div className="app-page explore-page-inner">
        <h2 className="event-title">Explore Events</h2>

        <div className="search-container">
          <input
            className="search-input"
            type="text"
            placeholder="Search by destination"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />

          <input
            className="search-input"
            type="date"
            value={searchDate}
            onChange={(e) => setSearchDate(e.target.value)}
          />

          <select
            className="search-input"
            value={searchType}
            onChange={(e) => setSearchType(e.target.value)}
          >
            <option value="">All event types</option>
            <option value="concert">Concert</option>
            <option value="adventure">Adventure</option>
            <option value="conference">Conference</option>
            <option value="workshop">Workshop</option>
            <option value="party">Party</option>
          </select>
        </div>

        <div className="event-list">
          {currentEvents.length > 0 ? (
            currentEvents.map((event) => (
              <div className="event-card" key={event._id}>
                <img
                  className="event-image"
                  src={event.image}
                  alt={event.name}
                />

                <h3>{event.name}</h3>

                <div className="event-details">
                  <FaMapMarkerAlt className="event-icon" />
                  <p>{event.destination}</p>
                </div>

                <div className="event-details">
                  <FaCalendarAlt className="event-icon" />
                  <p>
                    {new Date(event.startDate).toLocaleDateString("en-US", {
                      timeZone: "UTC",
                    })}
                  </p>
                </div>

                <div className="event-details">
                  <FaUsers className="event-icon" />
                  <p>{event.attendees} attendees</p>
                </div>

                <Link to={`/events/${event._id}`} style={{ textDecoration: "none" }}>
                  <button className="view-details-button">View Details</button>
                </Link>
              </div>
            ))
          ) : (
            <p className="no-events-text">No events found.</p>
          )}
        </div>

        <div className="pagination">
          <button
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
          >
            <FaChevronLeft />
          </button>

          <span>
            {currentPage} of {totalPages}
          </span>

          <button
            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
          >
            <FaChevronRight />
          </button>
        </div>
      </div>
    </AppShell>
  );
}

export default ExploreEvents;