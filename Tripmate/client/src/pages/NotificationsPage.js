import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import io from 'socket.io-client';
import { AuthContext } from "../context/AuthContext";
import '../styles/NotificationPage.css';

const SOCKET_SERVER_URL = 'http://localhost:5002';
const socket = io(SOCKET_SERVER_URL);

function NotificationPage() {
  const [notifications, setNotifications] = useState([]);
  const { user, loading } = useContext(AuthContext);
  const userId = user?.id;
  const navigate = useNavigate();

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const response = await fetch(`/api/notifications/${userId}`);
        const data = await response.json();
        setNotifications(data);
        localStorage.setItem('notifications', JSON.stringify(data));
      } catch (error) {
        console.error('Error fetching notifications:', error);
      }
    };
  
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 5000); 
  
    return () => clearInterval(interval);
  }, [userId]);
  
  useEffect(() => {
    if (userId) {
      socket.emit('registerUser', userId);
    }
  }, [userId]);

  useEffect(() => {
    if (loading) return;
    if (!userId) {
      console.error('User ID is missing');
      return;
    }

    socket.on('connectionRequest', (data) => {
      const { senderId, user } = data;
      setNotifications((prev) => [
        ...prev,
        {
          type: 'connectionRequest',
          senderId,
          senderName: user.name,
          message: `${user.name} wants to connect with you.`,
          read: false,
        },
      ]);
    });

    // Remove notifications when a connection is accepted
    socket.on('connectionAccepted', (data) => {
      const { senderName } = data;
      setNotifications((prev) => prev.filter((notif) => notif.senderName !== senderName));
      updateLocalStorage();
    });

    return () => {
      socket.off('connectionRequest');
      socket.off('connectionAccepted');
    };
  }, [userId, loading]);

  const updateLocalStorage = () => {
    localStorage.setItem('notifications', JSON.stringify(notifications));
  };

  const handleConnect = async (senderId, senderName) => {
    if (!userId) return;

    console.log('Accepted connection from', senderId);
    socket.emit('acceptConnection', { senderId, userId });

    const response = await fetch(`/api/matche/users/${senderId}`);
    const senderProfile = await response.json();

    console.log('senderProfile:', senderProfile);

    setNotifications((prev) => prev.filter((notif) => notif.senderId !== senderId));
    updateLocalStorage();

    const storedUsers = JSON.parse(localStorage.getItem('connectedUsers')) || [];
    const updatedConnectedUsers = [...storedUsers, { 
      _id: senderId,
      profile: { name: senderName, profilePicture: senderProfile.profile?.profilePicture } 
    }];

    localStorage.setItem('connectedUsers', JSON.stringify(updatedConnectedUsers));

    navigate('/messages', {
      state: { connectedUsers: updatedConnectedUsers, currentUserId: userId },
    });
  };

  const handleIgnore = (senderId) => {
    console.log('Ignored connection from', senderId);
    setNotifications((prev) => prev.filter((notif) => notif.senderId !== senderId));
    updateLocalStorage();
  };

  return (
    <div className="notification-page">
      <h3>Notifications</h3>
      {notifications.length === 0 ? (
        <p>No new notifications</p>
      ) : (
        notifications.map((notif, index) => (
          <div key={index} className={`notification ${notif.read ? 'read' : 'unread'}`}>
            <p>{notif.message}</p>
            {notif.type === 'connectionRequest' && (
              <div className="action-buttons">
                <button className="connect-button" onClick={() => handleConnect(notif.senderId, notif.senderName)}>
                  Connect
                </button>
                <button className="ignore-button" onClick={() => handleIgnore(notif.senderId)}>
                  Ignore
                </button>
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
}

export default NotificationPage;
