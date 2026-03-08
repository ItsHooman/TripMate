import React, { useContext, useState, useEffect, useMemo, useRef } from "react";
import TinderCard from "react-tinder-card";
import { FaChevronLeft, FaChevronRight, FaCalendarAlt, FaUsers, FaMapMarkerAlt } from "react-icons/fa"; 
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import "../styles/MatchingPage.css";
import { io } from 'socket.io-client';
import Navbar from '../components/Navbar';
import API_BASE_URL from "../config/api";

const SOCKET_SERVER_URL =
  process.env.REACT_APP_SOCKET_URL || "http://localhost:5002";

function MatchingPage() {
  const { user, logout } = useContext(AuthContext);
  const currentUserId = user?.id;
  const [matches, setMatches] = useState([]);
  const [events, setEvents] = useState([]); 
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [likedUsers, setLikedUsers] = useState([]);
  const [connectedUsers, setConnectedUsers] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const navigate = useNavigate();
  const defaultProfilePicture = 'https://i.postimg.cc/rwk4Qqd6/avatar-account-flat-isolated-on-transparent-background-for-graphic-and-web-design-default-social-med.jpg';
    

  // currentIndex tracks the index of the top card (last in array)
  const [currentIndex, setCurrentIndex] = useState(-1);
  
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    const newSocket = io(SOCKET_SERVER_URL, { transports: ['websocket'] });
    setSocket(newSocket);
  
    newSocket.on("connect", () => {
      console.log("Connected to WebSocket Server");
      if (currentUserId) {
        newSocket.emit("joinRoom", currentUserId);
      }
    });
  
    newSocket.on("newConnection", (newUser) => {
      // Instead of alert, we'll update notifications state
      let notifications = JSON.parse(localStorage.getItem('notifications')) || [];
      const newNotification = {
        type: 'newConnection',
        senderId: newUser.id,
        senderName: newUser.name,
        message: `${newUser.name} has connected with you!`,
        read: false,
      };
      notifications.push(newNotification);
      localStorage.setItem('notifications', JSON.stringify(notifications));
  
      setNotifications((prevNotifications) => [...prevNotifications, newNotification]);
    });
  
    return () => {
      newSocket.off("newConnection");
      newSocket.disconnect();
    };
  }, [currentUserId]);

  useEffect(() => {
    if (!socket) return;

    // Listen for incoming connection requests
    socket.on("connectionRequest", (data) => {
      const { senderId, user } = data;

      // Add the notification to localStorage
      let notifications = JSON.parse(localStorage.getItem('notifications')) || [];
      notifications.push({
        type: 'connectionRequest',
        senderId: senderId,
        senderName: user.name,
        message: `${user.name} wants to connect with you.`,
        read: false,
      });
      localStorage.setItem('notifications', JSON.stringify(notifications));

      // Update state or trigger UI changes (e.g., badge count)
      setNotifications(notifications);
    });

    return () => {
      socket.off("connectionRequest");
    };
  }, [socket]);
  
  // Listen for the connection acceptance on User A's side (this can be inside a separate useEffect)
  useEffect(() => {
    if (!socket) return;
  
    // Listen for connection acceptance (from User B)
    socket.on("connectionAccepted", (data) => {
      console.log("Connection Accepted Event Received:", data);
      const { senderId, senderName } = data;
    
      let connectedUsers = JSON.parse(localStorage.getItem('connectedUsers')) || [];
    
      if (!connectedUsers.some((user) => user._id === senderId)) {
        connectedUsers.push({ _id: senderId, name: senderName  || "Anonymous" }); 
        localStorage.setItem('connectedUsers', JSON.stringify(connectedUsers));
        setConnectedUsers([...connectedUsers]);
        console.log("LocalStorage Connected Users:", localStorage.getItem('connectedUsers'));
      }
    
      navigate('/messages', {
        state: {
          connectedUsers: connectedUsers,
          currentUserId: currentUserId,
        },
      });
    });    
  
    // Clean up socket listener when the component is unmounted or when the effect is re-run
    return () => {
      socket.off("connectionAccepted");
    };
  }, [socket, currentUserId, navigate]);
  
  
  useEffect(() => {
    if (!socket) return;
      socket.on("connectionConfirmed", (data) => {
        const { receiverId, receiverName, senderId, senderName } = data;
    
        let connectedUsers = JSON.parse(localStorage.getItem('connectedUsers')) || [];
    
        if (!connectedUsers.some(user => user._id === receiverId)) {
            connectedUsers.push({ _id: receiverId, name: receiverName });
        }
        if (!connectedUsers.some(user => user._id === senderId)) {
            connectedUsers.push({ _id: senderId, name: senderName });
        }
    
        localStorage.setItem('connectedUsers', JSON.stringify(connectedUsers));
        setConnectedUsers([...connectedUsers]);
    
        navigate('/messages', {
            state: { connectedUsers, currentUserId }
        });
    });
  
    return () => {
      socket.off("connectionConfirmed");
    };
  }, [socket, navigate, currentUserId]);  
  

  // Create refs for each card. When matches update, re-create refs.
  const childRefs = useMemo(
    () => Array(matches.length).fill(0).map((_, i) => React.createRef()),
    [matches]
  );

  useEffect(() => {
    const fetchMatches = async () => {
      if (!currentUserId) return;
      setLoading(true);
      setError(null);

      try {
        const token = localStorage.getItem("token");
        const response = await fetch(`${API_BASE_URL}/matche`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) throw new Error(`Error: ${response.statusText}`);

        const data = await response.json();
        const filteredMatches = data.filter(
          (match) => match._id !== currentUserId && match.role !== "admin"
        );
        setMatches(filteredMatches);
        setCurrentIndex(filteredMatches.length - 1);
      } catch (err) {
        setError("Failed to fetch matches. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchMatches();
  }, [currentUserId]);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/event/with-participants`);
        if (!response.ok) throw new Error("Failed to fetch events");
        const data = await response.json();
        setEvents(data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchEvents();
  }, []);

  const handleSwipe = (direction, match, index) => {
    if (direction === "right") {
      setLikedUsers((prevLikedUsers) => {
        const storedUsers = JSON.parse(localStorage.getItem("likedUsers")) || [];
        const isAlreadyLiked = storedUsers.some(user => user._id === match._id);
        
        if (!isAlreadyLiked) {
          const updatedLikedUsers = [...storedUsers, match];
          localStorage.setItem("likedUsers", JSON.stringify(updatedLikedUsers));
          return updatedLikedUsers;
        }
        return prevLikedUsers;
      });
    }

    setCurrentIndex(index - 1);
  };  

  const handleConnect = (match) => {
    let selectedUsers = JSON.parse(localStorage.getItem('connectedUsers')) || [];
  
    if (!selectedUsers.some((user) => user._id === match._id)) {
      selectedUsers.push(match);
      localStorage.setItem('connectedUsers', JSON.stringify(selectedUsers));
      setConnectedUsers([...selectedUsers]);  
  

      if (socket) {
        socket.emit("connectionRequest", {
          senderId: currentUserId,
          receiverId: match._id,
          user: { _id: currentUserId, name: user.name },
        });
      }
    }
  
    navigate('/messages', {
      state: { 
        connectedUsers: selectedUsers,
        currentUserId: currentUserId,
      },
    });
  };
  

  const swipe = async (dir) => {
    if (currentIndex >= 0 && currentIndex < childRefs.length) {
      await childRefs[currentIndex].current.swipe(dir); 
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="matching-page-container">
      <Navbar />
      <div className="app-page">
      <section className="home-hero">
  <div className="home-hero-copy">
    <p className="home-eyebrow">TripMate Home</p>
    <h1 className="home-title">Find people who match your travel vibe.</h1>
    <p className="home-subtitle">
      Discover compatible travelers based on shared interests, preferred destinations,
      and travel style. You can connect with people, explore events, and start
      planning better trips together.
    </p>
  </div>

  <div className="home-quick-actions">
    <Link to="/explore-events" className="home-action-card">
      <h3>Explore Events</h3>
      <p>See what is happening and discover trips, activities, and destinations.</p>
    </Link>

    <Link to="/messages" className="home-action-card">
      <h3>Open Messages</h3>
      <p>Continue conversations with your matches and travel connections.</p>
    </Link>

    <Link to="/profile" className="home-action-card">
      <h3>Profile</h3>
      <p>Update your interests and preferences to get better matches.</p>
    </Link>
  </div>
</section>

      {loading ? (
        <p>Loading matches...</p>
      ) : error ? (
        <p>{error}</p>
      ) : matches.length > 0 ? (
        <div className="tinder-cards-container">
          {matches.map((match, index) => (
              <TinderCard
              key={match._id}
              ref={childRefs[index]}
              className="swipe"
              onSwipe={(dir) => handleSwipe(dir, match, index)}
            >
              <div className="match-card">
                <h3>{match.profile?.name || "Anonymous"}</h3>
                <p>
                  <strong>Interests:</strong> {match.profile?.interests?.join(", ") || "No interests has been added."}
                </p>
                <img 
                  src={match.profile?.profilePicture || defaultProfilePicture} 
                  alt={match.profile?.name || "Anonymous"} 
                  className="match-profile-image" 
                  onError={(e) => { e.target.onerror = null; e.target.src = defaultProfilePicture; }} 
                />
                <button className="match-connect-button" onClick={() => handleConnect(match)}>Connect</button>
                <Link to={`/user-profile/${match._id}`} className="profile-link">
                  View Profile
                </Link>
              </div>
            </TinderCard>
          ))}
        </div>
      ) : (
        <p>No matches found.</p>
      )}

      {/* Swipe control buttons */}
      <div className="swipe-buttons">
        <button className="swipe-button left" onClick={() => swipe("left")} disabled={currentIndex < 0}>
          <i className="fas fa-arrow-left"></i> {/* Left Arrow */}
        </button>
        <button className="swipe-button right" onClick={() => swipe("right")} disabled={currentIndex < 0}>
          <i className="fas fa-arrow-right"></i> {/* Right Arrow */}
        </button>
      </div>

      <section className="match-events-section">
        <div className="match-events-container">
          <h2 className="match-events-title" data-aos="fade-up">
            Upcoming Events with Participants
          </h2>

          {events.length > 0 ? (
            <div className="match-events-grid">
              {events.map((event) => {
                const displayedParticipants = event.participants?.slice(0, 3) || [];
                const remainingCount = event.participants?.length - displayedParticipants.length;

                return (
                  <div key={event._id} className="match-event-card" data-aos="fade-up">
                    {event.image ? (
                      <img src={event.image} alt={event.name} className="match-event-image" />
                    ) : (
                      <div className="no-event-image">No Image Available</div>
                    )}

                    <div className="match-event-details">
                      <h3 className="match-event-name">{event.name}</h3>

                      <div className="match-event-info">
                        <FaMapMarkerAlt className="match-event-icon" />
                        <p>{event.destination}</p>
                      </div>

                      <div className="match-event-info">
                        <FaUsers className="match-event-icon" />
                        <p>
                          <strong>Attendees:</strong> {event.participants?.length || 0}
                        </p>
                      </div>

                      {/* Participants Avatars */}
                      <div className="match-participants">
                        {displayedParticipants.map((participant, index) => (
                          <img
                            key={index}
                            src={participant.user.profilePicture}
                            alt={participant.user.name}
                            className="match-participant-avatar"
                            title={participant.user.name}
                          />
                        ))}
                        {remainingCount > 0 && (
                          <span className="match-more-participants">+{remainingCount} more</span>
                        )}
                      </div>

                      <Link to={`/events/${event._id}`} className="match-view-event-link">
                        View Event
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="no-events-text">No events with participants available.</p>
          )}
        </div>
      </section>
    </div></div>
  );
}

export default MatchingPage;
