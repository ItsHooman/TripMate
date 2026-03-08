import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Link, useNavigate } from "react-router-dom";
import '../styles/EventDetails.scss';
import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import Navbar from '../components/Navbar';
import API_BASE_URL from "../config/api";

function EventDetails() {
    const { id } = useParams();
    const [event, setEvent] = useState(null);
    const [author, setAuthor] = useState("");
    const [text, setText] = useState("");
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const navigate = useNavigate();
    const [rsvpName, setRSVPName] = useState('');
    const [rsvpEmail, setRSVPEmail] = useState('');
    const [rsvpMessage, setRSVPMessage] = useState('');
    const { user, logout } = useContext(AuthContext);
    const [participants, setParticipants] = useState([]);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [lightboxImage, setLightboxImage] = useState(null);
    

    const toggleMenu = () => {
      setIsMenuOpen(!isMenuOpen);
    };

      useEffect(() => {
        const handleScroll = () => {
          const banners = document.querySelectorAll('.welcome-banner-image');
          
          banners.forEach(banner => {
            const scrollPosition = window.pageYOffset;
            banner.style.transform = `translateY(${scrollPosition * 0.8}px)`; 
          });
        };
      
        window.addEventListener('scroll', handleScroll);
      
        return () => {
          window.removeEventListener('scroll', handleScroll);
        };
      }, []);

      
    useEffect(() => {
        const fetchEventAndParticipants = async () => {
            try {
                const response = await fetch(`${API_BASE_URL}/event/${id}`);
                const eventData = await response.json();
                setEvent(eventData);

                const participantsResponse = await fetch(`${API_BASE_URL}/event/${id}/participants`);
                const participantsData = await participantsResponse.json();

                if (participantsResponse.ok) {
                    setParticipants(participantsData.participants);
                    localStorage.setItem('eventParticipants', JSON.stringify(participantsData.participants));
                } else {
                    setError(participantsData.error || "Failed to fetch participants.");
                }

            } catch (error) {
                setError("An error occurred while fetching the event details and participants.");
                const savedParticipants = JSON.parse(localStorage.getItem('eventParticipants'));
                if (savedParticipants) {
                    setParticipants(savedParticipants);
                }
            }
        };

        fetchEventAndParticipants();
    }, [id]);  

    const handleReviewSubmit = async (e) => {
        e.preventDefault();

        try {
            const response = await fetch(`${API_BASE_URL}/event/${id}/rsvp`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ author, text }),
            });

            const data = await response.json();
            if (response.ok) {
                setEvent((prevEvent) => ({
                    ...prevEvent,
                    reviews: data.reviews,
                }));
                setSuccess("Thanks for sharing your review!");
                setAuthor("");
                setText("");
            } else {
                setError(data.error || "Failed to submit review.");
            }
        } catch (err) {
            setError("An error occurred. Please try again.");
        }
    };

    if (!event) return <p>Loading...</p>;

    const handleLogout = () => {
        logout();
        navigate("/login");
    };

    const handleRSVPSubmit = async (e) => {
        e.preventDefault();
    
        if (!rsvpName || !rsvpEmail) {
            setRSVPMessage("Please fill in all fields.");
            return;
        }
    
        const storedParticipants = JSON.parse(localStorage.getItem('eventParticipants')) || [];
    
        const isAlreadyRSVPd = storedParticipants.some(
            (participant) => participant.user.email === rsvpEmail && participant.user.name === rsvpName
        );
    
        if (isAlreadyRSVPd) {
            setRSVPMessage("You've already RSVP'd for this event.");
            return;
        }
    
        try {
            const response = await fetch(`${API_BASE_URL}/event/${id}/reviews`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: rsvpName, email: rsvpEmail }),
            });
    
            const data = await response.json();
    
            if (response.ok) {
                const updatedParticipants = data.participants;
    
                setParticipants(updatedParticipants);
                localStorage.setItem('eventParticipants', JSON.stringify(updatedParticipants));
    
                setRSVPMessage("See you there! Check your email for further details.");
                setRSVPName("");
                setRSVPEmail("");
            } else {
                setRSVPMessage(data.error || "Failed to RSVP.");
            }
        } catch (error) {
            setRSVPMessage("An error occurred. Please try again.");
        }
        
    }; 
    

    return (

        <div className="event-details-page">
            <Navbar />
            <div className="app-page">
            <div className="event-details-container">
            {/* Event Header */}
                <div className="dashboard-banner">
                <img
                    src={event.image}
                    alt="Welcome Banner"
                    className="welcome-banner-image"
                />
                </div>
                <div className="event-banner-content">
                    <h1>{event.name}</h1>
                    <p>{event.description}</p>
                    <div className="event-location">
                        <i className="fa-solid fa-map-location-dot"></i>{event.destination}
                    </div>
                    <div className="event-date">
                        <i className="fa-solid fa-calendar-days"></i>{new Date(event.startDate).toLocaleDateString()}
                    </div>
                </div>
                <section className="event-features-section">
                    <h2>Event Features</h2>
                    <div className="event-features-list">
                        {/* Feature 1 */}
                        <div className="event-feature-item" data-aos="fade-right">
                        <div className="event-feature-image-wrapper">
                            <div className="event-feature-description" data-aos="fade-right">
                                <h2>Event Details</h2>
                                <ul className="event-details-list">
                                    <li><strong>Type:</strong> {event.type}</li>
                                    <li><strong>Attendees:</strong> {event.attendees}</li>
                                    <li><strong>Difficulty:</strong> {event.difficulty}</li>
                                </ul>
                            </div>
                        </div>
                        </div>

                        {/* Feature 2 */}
                        <div className="event-feature-item" data-aos="fade-left" data-aos-delay="100">
                        <div className="event-feature-image-wrapper">
                            <div className="event-feature-description" data-aos="fade-left">
                            <h2>Event Schedule</h2>
                                <ul className="event-details-list">
                                    {event.schedule.map((item, index) => (
                                        <li key={index}>{item}</li>
                                    ))}
                                </ul>
                                <h2>Packing List</h2>
                                <ul className="event-details-list">
                                    {event.packingList.map((item, index) => (
                                        <li key={index}>{item}</li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                        </div>

                        {/* Feature 3 */}
                        <div className="event-feature-item" data-aos="fade-right" data-aos-delay="200">
                        <div className="event-feature-image-wrapper">
                            <div className="event-feature-description" data-aos="fade-right">
                            <h2>Host Information</h2>
                                <p><strong>{event.host.name}</strong></p>
                                <p>Email: {event.host.email}</p>
                                <p>Phone: {event.host.phone}</p>
                            </div>
                        </div>
                        </div>
                    </div>
                    </section>

            {/* Event Gallery */}
            <div className="event-details-gallery-container">
                {/* Event Gallery */}
                <div className="event-details-gallery">
                    <h2>Event Gallery</h2>
                    <div className="event-gallery-grid">
                    {event.gallery.map((image, index) => (
                        <img
                        key={index}
                        src={image}
                        alt={`Gallery ${index + 1}`}
                        className="event-gallery-image"
                        onClick={() => setLightboxImage(image)}
                        />
                    ))}
                    </div>
                </div>
            </div>

                {/* Lightbox for Image Preview */}
                {lightboxImage && (
                    <div className="lightbox" onClick={() => setLightboxImage(null)}>
                    <img src={lightboxImage} alt="Full Preview" className="lightbox-image" />
                    </div>
                )}

            <div className="event-participants-section">
                <h2>Participants</h2>
                {participants.length > 0 ? (
                    <ul className="participants-list">
                        {participants.map((participant, index) => (
                            <li key={index} className="participant-item">
                                <div className="participant">
                                    <img
                                        src={participant.user.profilePicture}
                                        alt={`${participant.user.name}'s profile`}
                                        className="participant-avatar"
                                    />
                                    <div className="participant-info">
                                        <p className="participant-name">{participant.user.name}</p>
                                        <p className="participant-email">{participant.user.email}</p>
                                    </div>
                                </div>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="no-participants">No participants yet. Be the first to join!</p>
                )}
            </div>

            {/* RSVP and Reviews Grid Container */}
            <div className="event-rsvp-reviews">
                {/* RSVP Section */}
                <div className="event-rsvp-section">
                    {rsvpMessage && <div className="event-rsvp-message">{rsvpMessage}</div>}
                    <div className="event-rsvp">
                        <h2>Excited to see you there!</h2>
                        <p>wanna join? Please fill in your name and email here to confirm your participation.</p>
                        <form onSubmit={handleRSVPSubmit} className="rsvp-form">
                            <input
                                type="text"
                                placeholder="Your Name"
                                value={rsvpName}
                                onChange={(e) => setRSVPName(e.target.value)}
                                required
                                className="rsvp-input"
                            />
                            <input
                                type="email"
                                placeholder="Your Email"
                                value={rsvpEmail}
                                onChange={(e) => setRSVPEmail(e.target.value)}
                                required
                                className="rsvp-input"
                            />
                            <button type="submit" className="rsvp-submit">Attend</button>
                        </form>
                    </div>
                </div>
                {/* Reviews Section */}
                <div className="event-reviews-section">
                    <div className="event-reviews">
                        <h3>Reviews</h3>
                        {event.reviews && event.reviews.length > 0 ? (
                            event.reviews.map((review, index) => (
                                <div key={index} className="review">
                                    <div className="review-avatar">
                                        <i className="fa-solid fa-user-circle"></i>
                                    </div>
                                    <div className="review-content">
                                        <p><strong>{review.author}</strong></p>
                                        <p>{review.text}</p>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className="no-reviews">No reviews available.</p>
                        )}

                        {/* Review Submission Form */}
                        <form className="review-form" onSubmit={handleReviewSubmit}>
                            <h4>Write a Review</h4>
                            {error && <p className="error-message">{error}</p>}
                            {success && <p className="success-message">{success}</p>}
                            <input
                                type="text"
                                placeholder="Your name"
                                value={author}
                                onChange={(e) => setAuthor(e.target.value)}
                                required
                                className="review-input"
                            />
                            <input
                                type="text"
                                placeholder="Your review"
                                value={text}
                                onChange={(e) => setText(e.target.value)}
                                required
                                className="review-textarea"
                            />
                            <button className="review-submit" type="submit">Submit</button>
                        </form>
                    </div>
                </div>
            </div>
        </div></div>
        </div>
    );
}

export default EventDetails;
