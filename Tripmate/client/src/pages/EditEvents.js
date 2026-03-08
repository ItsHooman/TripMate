import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import '../styles/EditEvent.css';

function EditEventPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState({
    name: '',
    startDate: '',
    destination: '',
    attendees: '',
    image: '',
    description: '',
    difficulty: '',
    packingList: [],
    host: {
      name: '',
      email: '',
      phone: ''
    },
    gallery: [],
    schedule: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`http://localhost:5002/api/event/${id}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
    })
      .then(response => response.json())
      .then(data => {
        setEvent({
          name: data.name,
          startDate: new Date(data.startDate).toLocaleDateString(),
          destination: data.destination,
          attendees: data.attendees,
          image: data.image,
          description: data.description,
          difficulty: data.difficulty,
          packingList: data.packingList,
          host: data.host,
          gallery: data.gallery,
          schedule: data.schedule,
        });
        setLoading(false);
      })
      .catch(error => console.error('Error fetching event:', error));
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'gallery') {
      const urls = value.split(',').map(url => url.trim()); 
      setEvent((prevEvent) => ({
        ...prevEvent,
        gallery: urls, 
      }));
    } else if (name.startsWith('host.')) {
      const [field, subField] = name.split('.');
      setEvent((prevEvent) => ({
        ...prevEvent,
        host: {
          ...prevEvent.host,
          [subField]: value, 
        },
      }));
    } else {
      setEvent((prevEvent) => ({
        ...prevEvent,
        [name]: value,
      }));
    }
    if (name === 'schedule') {
      const newSchedule = value.split(',').map(item => item.trim()).map(item => {
        const [time, description] = item.split(':'); // Assuming format like "10:00 AM: Event description"
        return { time: time.trim(), description: description ? description.trim() : '' };
      });
      setEvent((prevEvent) => ({
        ...prevEvent,
        schedule: newSchedule,
      }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const updatedEvent = {
      name: event.name,
      startDate: new Date(event.startDate).toISOString(),
      destination: event.destination,
      attendees: event.attendees,
      image: event.image,
      description: event.description,
      difficulty: event.difficulty,
      packingList: event.packingList,
      host: event.host,
      gallery: event.gallery,
      schedule: event.schedule,
    };

    fetch(`http://localhost:5002/api/event/admin/events/${id}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updatedEvent),
    })
      .then(response => response.json())
      .then(() => {
        navigate('/manage-events');
      })
      .catch(error => console.error('Error updating event:', error));
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="edit-event-container">
      <h2>Edit Event</h2>
      <form onSubmit={handleSubmit}>
        <div className="edit-form-group">
          <label className="edit-label" htmlFor="name">Event Name</label>
          <input
            type="text"
            id="name"
            name="name"
            value={event.name}
            onChange={handleChange}
            required
            className='edit-input'
          />
        </div>

        <div className="edit-form-group">
          <label className="edit-label"  htmlFor="startDate">Event Date</label>
          <input
            type="text"
            id="startDate"
            name="startDate"
            value={event.startDate}
            onChange={handleChange}
            required
            className='edit-input'
          />
        </div>

        <div className="edit-form-group">
          <label className="edit-label"  htmlFor="destination">Event Location</label>
          <input
            type="text"
            id="destination"
            name="destination"
            value={event.destination}
            onChange={handleChange}
            required
            className='edit-input'
          />
        </div>

        <div className="edit-form-group">
          <label className="edit-label"  htmlFor="description">Event Description</label>
          <textarea
            id="description"
            name="description"
            value={event.description}
            onChange={handleChange}
            required
            className="edit-description"
          />
        </div>

        <div className="edit-form-group">
          <label className="edit-label"  htmlFor="image">Event Image</label>
          <input
            type="text"
            id="image"
            name="image"
            value={event.image}
            onChange={handleChange}
            required
            className='edit-input'
          />
        </div>

        <div className="edit-form-group">
          <label className="edit-label"  htmlFor="difficulty">Event Difficulty</label>
          <input
            type="text"
            id="difficulty"
            name="difficulty"
            value={event.difficulty}
            onChange={handleChange}
            required
            className='edit-input'
          />
        </div>

        <div className="edit-form-group">
        <label className="edit-label"  htmlFor="packingList">Packing List</label>
        {event.packingList.map((item, index) => (
          <div key={index} className="packing-list-item">
            <input
              type="text"
              value={item}
              onChange={(e) => {
                const updatedPackingList = [...event.packingList];
                updatedPackingList[index] = e.target.value;  // Update the specific packing list item
                setEvent(prevEvent => ({ ...prevEvent, packingList: updatedPackingList }));
              }}
              required
            />
            <button 
              type="button" 
              className="edit-add-button"
              onClick={() => {
                const updatedPackingList = event.packingList.filter((_, i) => i !== index);  // Remove packing list item
                setEvent(prevEvent => ({ ...prevEvent, packingList: updatedPackingList }));
              }}
            >
              Remove
            </button>
          </div>
        ))}

        {/* Button to add new packing list item */}
        <button 
          type="button" 
          className="edit-add-button"
          onClick={() => setEvent(prevEvent => ({
            ...prevEvent,
            packingList: [...prevEvent.packingList, '']  // Add empty string to start a new input
          }))}>
          Add Packing Item
        </button>
      </div>

        <div className="edit-form-group">
          <label className="edit-label"  htmlFor="host.name">Host Name</label>
          <input
            type="text"
            id="host.name"
            name="host.name"
            value={event.host.name}
            onChange={handleChange}
            required
            className='edit-input'
          />
        </div>

        <div className="edit-form-group">
          <label className="edit-label"  htmlFor="gallery">Gallery (separate URLs with commas)</label>
          <textarea
            id="gallery"
            name="gallery"
            value={event.gallery.join(', ')}  // Join array into string for display
            onChange={handleChange}
            required
            className="edit-description"
          />
        </div>

        <div className="edit-form-group">
          <label className="edit-label"  htmlFor="schedule">Schedule</label>
          {event.schedule.map((scheduleItem, index) => (
            <div key={index} className="schedule-item">
              <input
                type="text"
                value={scheduleItem}
                onChange={(e) => {
                  const updatedSchedule = [...event.schedule];
                  updatedSchedule[index] = e.target.value;  // Update the specific schedule item
                  setEvent(prevEvent => ({ ...prevEvent, schedule: updatedSchedule }));
                }}
                required
              />
              <button 
                type="button" 
                className="edit-add-button"
                onClick={() => {
                  const updatedSchedule = event.schedule.filter((_, i) => i !== index);  // Remove schedule item
                  setEvent(prevEvent => ({ ...prevEvent, schedule: updatedSchedule }));
                }}
              >
                Remove
              </button>
            </div>
          ))}
          
          {/* Button to add new schedule item */}
          <button 
            type="button" 
            className="edit-add-button"
            onClick={() => setEvent(prevEvent => ({
              ...prevEvent,
              schedule: [...prevEvent.schedule, '']  // Add empty string to start a new input
            }))}>
            Add Schedule Item
          </button>
        </div>
        <button type="submit" className="edit-button">Update Event</button>
        <button type="button" className="cancel-button" onClick={() => navigate('/manage-events')}>Cancel</button>
      </form>
    </div>
  );
}

export default EditEventPage;
