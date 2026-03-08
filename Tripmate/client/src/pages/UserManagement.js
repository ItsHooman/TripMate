import React, { useState, useEffect } from 'react';
import { useNavigate } from "react-router-dom";
import '../styles/UserManagement.css';

function UserManagement() {
  const [users, setUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetch('http://localhost:5002/api/users', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    })
      .then(response => response.json())
      .then(data => {
        const regularUsers = data.filter(user => user.role !== 'admin');
        setUsers(regularUsers);
      })
      .catch(error => console.error('Error fetching users:', error));
  }, []);

  const handleBanUser = (userId) => {
    fetch(`http://localhost:5002/api/users/${userId}/ban`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json',
      },
    })
      .then(response => {
        if (response.ok) {
          setUsers(users.map(user => 
            user._id === userId ? { ...user, status: 'banned' } : user
          ));
          alert('User has been banned.');
        } else {
          alert('Failed to ban the user.');
        }
      })
      .catch(error => console.error('Error banning user:', error));
  };

  const handleUnbanUser = (userId) => {
    fetch(`http://localhost:5002/api/users/${userId}/unban`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json',
      },
    })
      .then(response => {
        if (response.ok) {
          setUsers(users.map(user => 
            user._id === userId ? { ...user, status: 'active' } : user
          ));
          alert('User has been unbanned.');
        } else {
          alert('Failed to unban the user.');
        }
      })
      .catch(error => console.error('Error unbanning user:', error));
  };
  

  const handleDeleteUser = (userId) => {
    fetch(`http://localhost:5002/api/users/${userId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
    })
      .then(response => {
        if (response.ok) {
          setUsers(users.filter(user => user._id !== userId));
          alert('User deleted successfully.');
        } else {
          alert('Failed to delete the user.');
        }
      })
      .catch(error => console.error('Error deleting user:', error));
  };

  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="user-management-container">
      <h2>User Management</h2>

      {/* Search Input */}
      <input 
        type="text" 
        className="search-input" 
        placeholder="Search by name or email" 
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
      />

      <table className="user-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Name</th>
            <th>Email</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredUsers.map(user => (
            <tr key={user._id}>
              <td>{user._id}</td>
              <td>{user.name}</td>
              <td>{user.email}</td>
              <td>{user.status}</td>
              <td>
                {user.status === 'banned' ? (
                    <button 
                    className="unban-button" 
                    onClick={() => handleUnbanUser(user._id)}
                    >
                    Unban
                    </button>
                ) : (
                    <button 
                    className="ban-button" 
                    onClick={() => handleBanUser(user._id)}
                    >
                    Ban
                    </button>
                )}
                <button 
                    className="delete-button" 
                    onClick={() => handleDeleteUser(user._id)}
                >
                    Delete
                </button>
                </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default UserManagement;
