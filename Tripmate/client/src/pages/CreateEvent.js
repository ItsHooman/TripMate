import React, { useState } from 'react';
import '../styles/CreateEvent.css';
import { Link } from 'react-router-dom';
import API_BASE_URL from "../config/api";

function CreateEvent() {
  const [eventData, setEventData] = useState({
    name: '',
    startDate: '',
    destination: '',
    type: '',
    image: '',
    description: '',
    difficulty: '',
    packingList: [],
    attendees: 0,
    gallery: [],
    schedule: [],
    host: {
      name: '',
      email: '',
      phone: '',
    }
  });

  const [errorMessage, setErrorMessage] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name.startsWith("host.")) {

      const field = name.split(".")[1];
      setEventData({
        ...eventData,
        host: { ...eventData.host, [field]: value }
      });
    } else {
      setEventData({
        ...eventData,
        [name]: value,
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch(`${API_BASE_URL}/event/admin/events`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(eventData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to create event');
      }

      alert('Event created successfully');
      setEventData({
        name: '',
        startDate: '',
        destination: '',
        type: '',
        image: '',
        description: '',
        difficulty: '',
        packingList: [],
        attendees: 0,
        gallery: [],
        schedule: [],
        host: {
          name: '',
          email: '',
          phone: '',
        }
      });

      setErrorMessage('');
    } catch (error) {
      console.error('Error creating event:', error);
      setErrorMessage(error.message);
    }
  };

  return (
    <div className="create-event">
      <h2 className="create-event__title">Create Event</h2>
      {errorMessage && <p className="create-event__error">{errorMessage}</p>}
      <form onSubmit={handleSubmit} className="create-event__form">
        <div className="create-event__field">
          <input
            id="name"
            type="text"
            name="name"
            placeholder="Event Name"
            value={eventData.name}
            onChange={handleChange}
            required
          />
        </div>
        <div className="create-event__field">
          <input
            id="startDate"
            type="date"
            name="startDate"
            value={eventData.startDate}
            onChange={handleChange}
            required
          />
        </div>
        <div className="create-event__field">
          <input
            id="destination"
            type="text"
            name="destination"
            placeholder="Destination"
            value={eventData.destination}
            onChange={handleChange}
            required
          />
        </div>
        <div className="create-event__field">
          <input
            id="type"
            type="text"
            name="type"
            placeholder="Type"
            value={eventData.type}
            onChange={handleChange}
            required
          />
        </div>
        <div className="create-event__field">
          <input
            id="image"
            type="url"
            name="image"
            placeholder="Image URL"
            value={eventData.image}
            onChange={handleChange}
            required
          />
        </div>
        <div className="create-event__field">
          <input
            id="packingList"
            type="text"
            name="packingList"
            placeholder="Packing List"
            value={eventData.packingList}
            onChange={handleChange}
            required
          />
        </div>
        <div className="create-event__field">
          <textarea
            id="description"
            name="description"
            placeholder="Description"
            value={eventData.description}
            onChange={handleChange}
            required
          />
        </div>
        <div className="create-event__field">
          <input
            id="difficulty"
            type="text"
            name="difficulty"
            placeholder="Difficulty"
            value={eventData.difficulty}
            onChange={handleChange}
            required
          />
        </div>

        <div className="create-event__field">
          <input
            id="host-name"
            type="text"
            name="host.name"
            placeholder="Host Name"
            value={eventData.host.name}
            onChange={handleChange}
            required
          />
        </div>
        <div className="create-event__field">
          <input
            id="host-email"
            type="email"
            name="host.email"
            placeholder="Host Email"
            value={eventData.host.email}
            onChange={handleChange}
            required
          />
        </div>
        <div className="create-event__field">
          <input
            id="host-phone"
            type="tel"
            name="host.phone"
            placeholder="Host Phone"
            value={eventData.host.phone}
            onChange={handleChange}
            required
          />
        </div>

        <button type="submit" className="create-event__button">
          Create Event
        </button>
        <Link to="/manage-events" className="create-event__link">
          Back
        </Link>
      </form>
    </div>
  );
}

export default CreateEvent;
