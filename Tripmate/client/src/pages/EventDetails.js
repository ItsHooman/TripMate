import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import {
  FaArrowLeft,
  FaMapMarkerAlt,
  FaCalendarAlt,
  FaUsers,
  FaCompass,
  FaEnvelope,
  FaPhone,
  FaUserCircle,
  FaCheck,
  FaTimes,
  FaClock,
  FaSuitcase,
} from "react-icons/fa";

import "../styles/EventDetails.scss";
import AppShell from "../components/AppShell";
import API_BASE_URL from "../config/api";

function EventDetails() {
  const { id } = useParams();

  const [event, setEvent] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [author, setAuthor] = useState("");
  const [text, setText] = useState("");
  const [reviewMessage, setReviewMessage] = useState("");

  const [rsvpName, setRSVPName] = useState("");
  const [rsvpEmail, setRSVPEmail] = useState("");
  const [rsvpMessage, setRSVPMessage] = useState("");

  const [rsvpSubmitting, setRSVPSubmitting] = useState(false);
  const [reviewSubmitting, setReviewSubmitting] = useState(false);

  const [imageFailed, setImageFailed] = useState(false);
  const [lightboxImage, setLightboxImage] = useState(null);

  useEffect(() => {
    const fetchEvent = async () => {
      setLoading(true);
      setError("");
      setImageFailed(false);
      setEvent(null);
      setParticipants([]);
      setRSVPMessage("");
      setReviewMessage("");

      try {
        const response = await fetch(
          `${API_BASE_URL}/event/${id}`
        );

        if (!response.ok) {
          throw new Error("Unable to load this event.");
        }

        const eventData = await response.json();
        setEvent(eventData);

        try {
          const participantsResponse = await fetch(
            `${API_BASE_URL}/event/${id}/participants`
          );

          const participantsData =
            await participantsResponse.json();

          if (participantsResponse.ok) {
            setParticipants(
              Array.isArray(participantsData.participants)
                ? participantsData.participants
                : []
            );
          }
        } catch (err) {
          console.error("Could not load participants:", err);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchEvent();
  }, [id]);

  useEffect(() => {
    if (!lightboxImage) return;

    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        setLightboxImage(null);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () =>
      window.removeEventListener("keydown", handleKeyDown);
  }, [lightboxImage]);

  const handleRSVPSubmit = async (e) => {
    e.preventDefault();

    const name = rsvpName.trim();
    const email = rsvpEmail.trim();

    if (!name || !email) {
      setRSVPMessage("Please complete all fields.");
      return;
    }

    const alreadyJoined = participants.some(
      (participant) =>
        participant.user?.email?.toLowerCase() ===
        email.toLowerCase()
    );

    if (alreadyJoined) {
      setRSVPMessage(
        "You have already registered for this event."
      );
      return;
    }

    setRSVPSubmitting(true);
    setRSVPMessage("");

    try {
      const response = await fetch(
        `${API_BASE_URL}/event/${id}/reviews`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ name, email }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to join event.");
      }

      if (Array.isArray(data.participants)) {
        setParticipants(data.participants);
      }

      setRSVPMessage("You're going! See you there.");
      setRSVPName("");
      setRSVPEmail("");
    } catch (err) {
      setRSVPMessage(err.message);
    } finally {
      setRSVPSubmitting(false);
    }
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();

    if (!author.trim() || !text.trim()) {
      setReviewMessage("Please complete your review.");
      return;
    }

    setReviewSubmitting(true);
    setReviewMessage("");

    try {
      const response = await fetch(
        `${API_BASE_URL}/event/${id}/rsvp`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            author: author.trim(),
            text: text.trim(),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Unable to submit review."
        );
      }

      if (Array.isArray(data.reviews)) {
        setEvent((prev) => ({
          ...prev,
          reviews: data.reviews,
        }));
      }

      setReviewMessage("Thank you for sharing your experience!");
      setAuthor("");
      setText("");
    } catch (err) {
      setReviewMessage(err.message);
    } finally {
      setReviewSubmitting(false);
    }
  };

  const formatDate = (date) => {
    if (!date) return "Date to be announced";

    return new Date(date).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
      timeZone: "UTC",
    });
  };

  return (
    <AppShell className="event-detail-shell">
      <div className="ed-page">

        <Link to="/explore-events" className="ed-back-link">
          <FaArrowLeft />
          Back to Explore
        </Link>

        {loading ? (
          <div className="ed-status">
            Loading experience...
          </div>
        ) : error || !event ? (
          <div className="ed-status">
            {error || "Event not found."}
          </div>
        ) : (
          <>
            {/* EVENT HEADER */}

            <header className="ed-heading">
              <span className="ed-category">
                {event.type || "Experience"}
              </span>

              <h1>{event.name}</h1>

              <div className="ed-heading-meta">
                <span>
                  <FaMapMarkerAlt />
                  {event.destination || "Location not specified"}
                </span>

                <span>
                  <FaCalendarAlt />
                  {formatDate(event.startDate)}
                </span>

                <span>
                  <FaUsers />
                  {event.attendees ?? 0} attendees
                </span>
              </div>
            </header>

            {/* COVER IMAGE */}

            <div className="ed-cover">
              {event.image && !imageFailed ? (
                <img
                  src={event.image}
                  alt={event.name}
                  onError={() => setImageFailed(true)}
                />
              ) : (
                <div className="ed-cover-fallback">
                  <FaCompass />
                  <span>{event.name}</span>
                </div>
              )}
            </div>

            {/* MAIN CONTENT */}

            <div className="ed-layout">
              <div className="ed-main-content">

                {/* DESCRIPTION */}

                <section className="ed-panel">
                  <h2>About this experience</h2>

                  <p className="ed-description">
                    {event.description ||
                      "More information will be available soon."}
                  </p>

                  <div className="ed-facts">
                    <div className="ed-fact">
                      <FaCompass />

                      <div>
                        <span>Experience type</span>
                        <strong>
                          {event.type || "Not specified"}
                        </strong>
                      </div>
                    </div>

                    <div className="ed-fact">
                      <FaUsers />

                      <div>
                        <span>Attendees</span>
                        <strong>{event.attendees ?? 0}</strong>
                      </div>
                    </div>

                    <div className="ed-fact">
                      <FaMountainIcon />

                      <div>
                        <span>Difficulty</span>
                        <strong>
                          {event.difficulty || "Not specified"}
                        </strong>
                      </div>
                    </div>
                  </div>
                </section>

                {/* SCHEDULE */}

                {Array.isArray(event.schedule) &&
                  event.schedule.length > 0 && (
                    <section className="ed-panel">
                      <h2>
                        <FaClock />
                        What to expect
                      </h2>

                      <div className="ed-timeline">
                        {event.schedule.map((item, index) => (
                          <div
                            className="ed-timeline-item"
                            key={index}
                          >
                            <span className="ed-timeline-number">
                              {index + 1}
                            </span>

                            <p>{item}</p>
                          </div>
                        ))}
                      </div>
                    </section>
                  )}

                {/* PACKING LIST */}

                {Array.isArray(event.packingList) &&
                  event.packingList.length > 0 && (
                    <section className="ed-panel">
                      <h2>
                        <FaSuitcase />
                        What to bring
                      </h2>

                      <div className="ed-packing-list">
                        {event.packingList.map((item, index) => (
                          <div
                            className="ed-packing-item"
                            key={index}
                          >
                            <FaCheck />
                            <span>{item}</span>
                          </div>
                        ))}
                      </div>
                    </section>
                  )}

                {/* GALLERY */}

                {Array.isArray(event.gallery) &&
                  event.gallery.length > 0 && (
                    <section className="ed-panel">
                      <h2>Experience gallery</h2>

                      <div className="ed-gallery">
                        {event.gallery.map((image, index) => (
                          <button
                            key={index}
                            className="ed-gallery-item"
                            onClick={() => setLightboxImage(image)}
                            aria-label={`View photo ${index + 1}`}
                          >
                            <img
                              src={image}
                              alt={`Event gallery ${index + 1}`}
                              loading="lazy"
                              onError={(e) => {
                                e.currentTarget.style.visibility =
                                  "hidden";
                              }}
                            />
                          </button>
                        ))}
                      </div>
                    </section>
                  )}

                {/* PARTICIPANTS */}

                <section className="ed-panel">
                  <h2>Who's going?</h2>

                  <p className="ed-muted">
                    {participants.length} registered participants
                  </p>

                  {participants.length > 0 ? (
                    <div className="ed-participants">
                      {participants.map((participant, index) => (
                        <div
                          className="ed-participant"
                          key={participant._id || index}
                        >
                          {participant.user?.profilePicture ? (
                            <img
                              src={participant.user.profilePicture}
                              alt={
                                participant.user?.name ||
                                "Participant"
                              }
                            />
                          ) : (
                            <FaUserCircle />
                          )}

                          <span>
                            {participant.user?.name || "Traveler"}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="ed-muted">
                      Be the first to join this experience.
                    </p>
                  )}
                </section>

                {/* REVIEWS */}

                <section className="ed-panel">
                  <h2>Traveler reviews</h2>

                  {Array.isArray(event.reviews) &&
                  event.reviews.length > 0 ? (
                    <div className="ed-reviews">
                      {event.reviews.map((review, index) => (
                        <div className="ed-review" key={index}>
                          <FaUserCircle />

                          <div>
                            <strong>
                              {review.author || "Traveler"}
                            </strong>

                            <p>{review.text}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="ed-muted">
                      No reviews yet. Share your experience!
                    </p>
                  )}

                  <form
                    className="ed-form ed-review-form"
                    onSubmit={handleReviewSubmit}
                  >
                    <h3>Write a review</h3>

                    <label htmlFor="ed-review-name">
                      Your name
                    </label>

                    <input
                      id="ed-review-name"
                      type="text"
                      placeholder="Enter your name"
                      value={author}
                      onChange={(e) => setAuthor(e.target.value)}
                      required
                    />

                    <label htmlFor="ed-review-text">
                      Your experience
                    </label>

                    <textarea
                      id="ed-review-text"
                      placeholder="Tell other travelers about your experience..."
                      value={text}
                      onChange={(e) => setText(e.target.value)}
                      rows={4}
                      required
                    />

                    {reviewMessage && (
                      <p className="ed-form-message" role="status">
                        {reviewMessage}
                      </p>
                    )}

                    <button
                      className="ed-primary-button"
                      type="submit"
                      disabled={reviewSubmitting}
                    >
                      {reviewSubmitting
                        ? "Submitting..."
                        : "Submit review"}
                    </button>
                  </form>
                </section>
              </div>

              {/* SIDEBAR */}

              <aside className="ed-sidebar">

                {/* RSVP CARD */}

                <section className="ed-booking-card">
                  <span className="ed-booking-eyebrow">
                    MAKE NEW MEMORIES
                  </span>

                  <h2>Join this experience</h2>

                  <p className="ed-muted">
                    Meet fellow travelers and be part of
                    something unforgettable.
                  </p>

                  <div className="ed-booking-meta">
                    <span>
                      <FaCalendarAlt />
                      {formatDate(event.startDate)}
                    </span>

                    <span>
                      <FaMapMarkerAlt />
                      {event.destination || "To be announced"}
                    </span>
                  </div>

                  <form
                    className="ed-form"
                    onSubmit={handleRSVPSubmit}
                  >
                    <label htmlFor="ed-rsvp-name">
                      Full name
                    </label>

                    <input
                      id="ed-rsvp-name"
                      type="text"
                      placeholder="Your name"
                      value={rsvpName}
                      onChange={(e) => setRSVPName(e.target.value)}
                      required
                    />

                    <label htmlFor="ed-rsvp-email">
                      Email address
                    </label>

                    <input
                      id="ed-rsvp-email"
                      type="email"
                      placeholder="Your email"
                      value={rsvpEmail}
                      onChange={(e) => setRSVPEmail(e.target.value)}
                      required
                    />

                    <button
                      type="submit"
                      className="ed-primary-button"
                      disabled={rsvpSubmitting}
                    >
                      {rsvpSubmitting
                        ? "Joining..."
                        : "Join experience"}
                    </button>

                    {rsvpMessage && (
                      <p className="ed-form-message" role="status">
                        {rsvpMessage}
                      </p>
                    )}
                  </form>
                </section>

                {/* HOST INFORMATION */}

                {event.host && (
                  <section className="ed-panel ed-host-card">
                    <h2>Meet your host</h2>

                    <div className="ed-host-profile">
                      <FaUserCircle />

                      <div>
                        <strong>
                          {event.host.name || "Event organizer"}
                        </strong>

                        <span>Event host</span>
                      </div>
                    </div>

                    {event.host.email && (
                      <a href={`mailto:${event.host.email}`}>
                        <FaEnvelope />
                        {event.host.email}
                      </a>
                    )}

                    {event.host.phone && (
                      <a href={`tel:${event.host.phone}`}>
                        <FaPhone />
                        {event.host.phone}
                      </a>
                    )}
                  </section>
                )}

              </aside>
            </div>

            {/* IMAGE LIGHTBOX */}

            {lightboxImage && (
              <div
                className="ed-lightbox"
                onClick={() => setLightboxImage(null)}
                role="dialog"
                aria-modal="true"
                aria-label="Event photo preview"
              >
                <button
                  className="ed-lightbox-close"
                  onClick={() => setLightboxImage(null)}
                  aria-label="Close photo"
                >
                  <FaTimes />
                </button>

                <img
                  src={lightboxImage}
                  alt="Event photo preview"
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            )}
          </>
        )}
      </div>
    </AppShell>
  );
}

function FaMountainIcon() {
  return <FaCompass />;
}

export default EventDetails;