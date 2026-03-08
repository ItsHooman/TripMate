import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../styles/ManageEvents.css';

function EventManagementPage() {
  const [events, setEvents] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetch('http://localhost:5002/api/event', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    })
      .then(response => response.json())
      .then(data => setEvents(data))
      .catch(error => console.error('Error fetching events:', error));
  }, []);

  const handleDelete = (eventId) => {
    fetch(`http://localhost:5002/api/event/admin/events/${eventId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
    })
    .then(() => {
      setEvents(events.filter(event => event._id !== eventId));
    })
    .catch(error => console.error('Error deleting event:', error));
  };

  return (
    <div className="event-management-container">
      <h2>Event Management</h2>
        <button onClick={() => navigate('/create-event')} className="Create-button">Create Event</button>
      <table className="event-table">
        <thead>
          <tr>
            <th>Event Name</th>
            <th>Date</th>
            <th>Location</th>
            <th>Type</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {events.length > 0 ? (
            events.map((event) => (
              <tr key={event._id}>
                <td>{event.name}</td>
                <td>{new Date(event.startDate).toLocaleDateString()}</td>
                <td>{event.destination}</td>
                <td>{event.type}</td>
                <td>
                  <Link to={`/edit-event/${event._id}`} className="Edit-button">Edit</Link>
                  <button onClick={() => handleDelete(event._id)} className="Delete-button">Delete</button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="4">No events available.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export default EventManagementPage;
