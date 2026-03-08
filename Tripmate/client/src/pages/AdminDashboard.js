import React, { useContext, useState, useEffect } from 'react';
import { useNavigate, Link } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import '../styles/AdminDashboard.css';

function AdminDashboard() {
    const [events, setEvents] = useState([]);
    const { logout } = useContext(AuthContext);
    const navigate = useNavigate();
    const [users, setUsers] = useState([]);

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

  const handleLogout = () => {
    console.log("Logging out...");
    logout();
    navigate("/login"); 
};

  return (
    <div className="admin-dashboard-container">
              <h1>Admin Dashboard</h1>
          <div className="admin-dashboard-cards">
          <div className="admin-dashboard-card">
            <i className="fas fa-calendar-alt fa-2x"></i>
            <h3>Events Management</h3>
            <p>Create, update, and manage events.</p>
            <Link to="/manage-events" className="admin-dashboard-button">Manage Events</Link>
          </div>
          <div className="admin-dashboard-card">
            <i className="fa fa-user fa-2x"></i>
            <h3>User Management</h3>
            <p>Manage user accounts and permissions.</p>
            <Link to="/users" className="admin-dashboard-button">Manage Users</Link>
          </div>
          <div className="admin-dashboard-card">
            <i className="fa fa-user fa-2x"></i>
            <h3>Reported Users</h3>
            <p>View and manage reported users.</p>
            <Link to="/reported-users" className="admin-dashboard-button">Manage Users</Link>
          </div>
        </div>
    </div>
  );
}

export default AdminDashboard;



