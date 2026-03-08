import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useContext } from 'react';
import { FaChevronLeft, FaChevronRight, FaCalendarAlt, FaUsers, FaMapMarkerAlt } from "react-icons/fa"; 
import { AuthContext } from '../context/AuthContext';
import '../styles/ExploreEvents.css';
import Navbar from '../components/Navbar';  
import API_BASE_URL from "../config/api";


function ExploreEvents() {
    const [events, setEvents] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchDate, setSearchDate] = useState('');
    const [searchType, setSearchType] = useState('');
    const navigate = useNavigate();
    const { user, logout } = useContext(AuthContext);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const eventsPerPage = 3;

    const toggleMenu = () => {
      setIsMenuOpen(!isMenuOpen);
    };

    useEffect(() => {
        // Fetch all events when the page loads
        const fetchEvents = async () => {
            const response = await fetch(`${API_BASE_URL}/event`);
            const data = await response.json();
            setEvents(data);
        };

        fetchEvents();
    }, []);

    const filteredEvents = events.filter((event) => {
        const matchesDestination = event.destination.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesDate = searchDate ? new Date(event.startDate).toLocaleDateString() === new Date(searchDate).toLocaleDateString() : true;
        const matchesType = searchType ? event.type.toLowerCase().includes(searchType.toLowerCase()) : true;

        return matchesDestination && matchesDate && matchesType;
    });

    const handleLogout = () => {
        logout(); 
        navigate("/login"); 
    };

     // Pagination logic
      
     const totalPages = Math.ceil(filteredEvents.length / eventsPerPage);
     const indexOfLastEvent = currentPage * eventsPerPage;
     const indexOfFirstEvent = indexOfLastEvent - eventsPerPage;
     const currentEvents = filteredEvents.slice(
      (currentPage - 1) * eventsPerPage,
      currentPage * eventsPerPage
  );
 
     const handleNextPage = () => {
         if (currentPage < totalPages) {
             setCurrentPage(prevPage => prevPage + 1);
         }
     };
 
     const handlePrevPage = () => {
         if (currentPage > 1) {
             setCurrentPage(prevPage => prevPage - 1);
         }
     };
 
     const handlePageClick = (pageNumber) => {
         setCurrentPage(pageNumber);
     };
 

    return (
        <div className='event-container'>
              <Navbar />
              <div className="app-page">
            <h2 className='event-title'>Explore Events</h2>
            <div className="search-container">
            <input
                className="search-input"
                type="text"
                placeholder="Search by destination"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
            />
            <br />
            <input
                className="search-input"
                type="date"
                value={searchDate}
                onChange={(e) => setSearchDate(e.target.value)}
            />
            <br />
            <select
              className="search-input"
              value={searchType}
              onChange={(e) => setSearchType(e.target.value)}
            >
              <option value="" disabled>
                Select event type
              </option>
              <option value="concert">Concert</option>
              <option value="Adventure">Adventure</option>
              <option value="conference">Conference</option>
              <option value="workshop">Workshop</option>
              <option value="party">Party</option>
            </select>
          </div>

          <div className="event-list">
                {currentEvents.map((event) => (
                    <div className="event-card" key={event._id}>
                        <img
                            className="event-image"
                            src={event.image}
                            alt={event.name}
                        />
                          <h3>{event.name}</h3>
                          <div className="event-details">
                              <FaMapMarkerAlt className="event-icon" /> <p>{event.destination}</p>
                          </div>
                          <div className="event-details">
                              <FaCalendarAlt className="event-icon" /> <p>{new Date(event.startDate).toLocaleDateString('en-US', { timeZone: 'UTC' })}</p>
                          </div>
                          <div className="event-details">
                              <FaUsers className="event-icon" /> <p>{event.attendees} attendees</p>
                          </div>
                        <Link to={`/events/${event._id}`} style={{ textDecoration: "none" }}>
                            <button className="view-details-button">View Details</button>
                        </Link>
                    </div>
                ))}
            </div>
              {/* Pagination Controls */}
              <div className="pagination">
              <button onClick={() => setCurrentPage(Math.max(1, currentPage - 1))} disabled={currentPage === 1}>
                  <FaChevronLeft />
              </button>
              <span>{currentPage} of {totalPages}</span>
              <button onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))} disabled={currentPage === totalPages}>
                  <FaChevronRight />
              </button>
          </div>
      </div>
      </div>
    );
}

export default ExploreEvents;
